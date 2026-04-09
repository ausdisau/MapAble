<?php
$pageTitle = 'My Shifts';
$userId = currentUserId();
$worker = getWorkerByUserId($pdo, $userId);
if (!$worker) {
    setFlash('error', 'Worker profile not found.');
    redirect('/settings');
}

$filters = [
    'status' => $_GET['status'] ?? '',
    'date_from' => $_GET['date_from'] ?? '',
    'date_to' => $_GET['date_to'] ?? '',
];
$activeFilters = array_filter($filters);
$shifts = getWorkerShifts($pdo, $worker['id'], $activeFilters);

$monthStart = date('Y-m-01');
$monthEnd = date('Y-m-t');
$periodStart = $filters['date_from'] ?: $monthStart;
$periodEnd = $filters['date_to'] ?: $monthEnd;
$earnings = getWorkerEarnings($pdo, $worker['id'], $periodStart, $periodEnd);
$activeShift = getWorkerActiveShift($pdo, $worker['id']);

$confirmedBookings = getWorkerBookings($pdo, $worker['id'], 'confirmed');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'start_shift') {
        $bookingId = $_POST['booking_id'] ?? null;
        if ($bookingId && !$activeShift) {
            $booking = getBookingById($pdo, $bookingId);
            if ($booking && $booking['worker_id'] === $worker['id']) {
                startWorkerShift($pdo, $worker['id'], $booking['participant_id'], $bookingId);
                setFlash('success', 'Shift started successfully.');
            } else {
                setFlash('error', 'Booking not found or not assigned to you.');
            }
        }
        redirect('/worker/shifts');
    }

    if ($action === 'end_shift') {
        $sessionId = $_POST['session_id'] ?? '';
        $hours = (float)($_POST['hours'] ?? 0);
        $notes = $_POST['notes'] ?? '';
        if ($sessionId && $hours > 0) {
            $result = endWorkerShift($pdo, $sessionId, $hours, $notes, $worker['id']);
            if ($result) {
                setFlash('success', 'Shift ended. ' . $hours . ' hours logged.');
            } else {
                setFlash('error', 'Session not found or not assigned to you.');
            }
        }
        redirect('/worker/shifts');
    }
}

require __DIR__ . '/../includes/layout_header.php';
?>

<div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 class="text-2xl font-bold" data-testid="text-shifts-title">My Shifts & Earnings</h1>
        <div class="flex gap-2">
            <a href="/api/worker/shifts/export?<?= http_build_query($activeFilters) ?>" class="btn btn-outline btn-sm" data-testid="link-export-csv">
                <i class="icon-download w-4 h-4" aria-hidden="true"></i> Export CSV
            </a>
            <?php if (!$activeShift): ?>
            <button onclick="document.getElementById('start-shift-modal').classList.remove('hidden')" class="btn btn-teal btn-sm" data-testid="button-start-new-shift">
                <i class="icon-play w-4 h-4" aria-hidden="true"></i> Start New Shift
            </button>
            <?php endif; ?>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="card stat-card" data-testid="stat-period-hours">
            <div class="stat-value"><?= number_format((float)$earnings['total_hours'], 1) ?></div>
            <div class="stat-label">Total Hours</div>
        </div>
        <div class="card stat-card" data-testid="stat-period-earnings">
            <div class="stat-value"><?= formatCurrency($earnings['total_earnings']) ?></div>
            <div class="stat-label">Total Earnings</div>
        </div>
        <div class="card stat-card" data-testid="stat-period-avg-rate">
            <div class="stat-value">
                <?= (float)$earnings['total_hours'] > 0 ? formatCurrency((float)$earnings['total_earnings'] / (float)$earnings['total_hours']) : '$0.00' ?>
            </div>
            <div class="stat-label">Avg Hourly Rate</div>
        </div>
    </div>

    <div class="card">
        <form method="GET" class="flex flex-col md:flex-row gap-3">
            <div class="flex-1">
                <label for="filter-status" class="label">Status</label>
                <select id="filter-status" name="status" class="input w-full" data-testid="select-filter-status">
                    <option value="">All Statuses</option>
                    <option value="in_progress" <?= $filters['status'] === 'in_progress' ? 'selected' : '' ?>>In Progress</option>
                    <option value="completed" <?= $filters['status'] === 'completed' ? 'selected' : '' ?>>Completed</option>
                    <option value="cancelled" <?= $filters['status'] === 'cancelled' ? 'selected' : '' ?>>Cancelled</option>
                </select>
            </div>
            <div class="flex-1">
                <label for="filter-from" class="label">From Date</label>
                <input type="date" id="filter-from" name="date_from" value="<?= h($filters['date_from']) ?>" class="input w-full" data-testid="input-filter-from">
            </div>
            <div class="flex-1">
                <label for="filter-to" class="label">To Date</label>
                <input type="date" id="filter-to" name="date_to" value="<?= h($filters['date_to']) ?>" class="input w-full" data-testid="input-filter-to">
            </div>
            <div class="flex items-end gap-2">
                <button type="submit" class="btn btn-blue min-h-[44px]" data-testid="button-apply-filters">Filter</button>
                <?php if (!empty($activeFilters)): ?>
                <a href="/worker/shifts" class="btn btn-outline min-h-[44px]" data-testid="link-clear-filters">Clear</a>
                <?php endif; ?>
            </div>
        </form>
    </div>

    <?php if ($activeShift): ?>
    <div class="card border-2 border-map-teal bg-map-teal/5 dark:bg-map-teal/10" data-testid="card-active-shift-banner">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-map-teal/20 flex items-center justify-center">
                    <i class="icon-play text-map-teal w-5 h-5" aria-hidden="true"></i>
                </div>
                <div>
                    <p class="font-bold text-sm">Active Shift with <?= h($activeShift['participant_name']) ?></p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Started <?= h($activeShift['start_time']) ?> &middot; <?= h($activeShift['tier_applied']) ?> &middot; <?= formatCurrency($activeShift['hourly_rate']) ?>/hr</p>
                </div>
            </div>
            <form method="POST" class="flex items-center gap-2">
                <?= csrfField() ?>
                <input type="hidden" name="action" value="end_shift">
                <input type="hidden" name="session_id" value="<?= h($activeShift['id']) ?>">
                <input type="number" name="hours" step="0.25" min="0.25" max="24" placeholder="Hours" required class="input w-24" aria-label="Hours worked" data-testid="input-end-shift-hours-inline">
                <input type="text" name="notes" placeholder="Notes..." class="input w-32 hidden md:block" aria-label="Shift notes" data-testid="input-end-shift-notes-inline">
                <button type="submit" class="btn btn-red btn-sm" data-testid="button-end-shift-inline">End Shift</button>
            </form>
        </div>
    </div>
    <?php endif; ?>

    <?php if (empty($shifts)): ?>
    <div class="card text-center py-12">
        <i class="icon-clock w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" aria-hidden="true"></i>
        <p class="text-gray-500 dark:text-gray-400" data-testid="text-no-shifts">No shifts found for the selected period</p>
    </div>
    <?php else: ?>
    <div class="overflow-x-auto">
        <table class="w-full text-sm" data-testid="table-shifts">
            <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th class="text-left py-3 px-4 font-semibold">Date</th>
                    <th class="text-left py-3 px-4 font-semibold">Participant</th>
                    <th class="text-left py-3 px-4 font-semibold">Time</th>
                    <th class="text-right py-3 px-4 font-semibold">Hours</th>
                    <th class="text-right py-3 px-4 font-semibold">Rate</th>
                    <th class="text-left py-3 px-4 font-semibold">Tier</th>
                    <th class="text-left py-3 px-4 font-semibold">NDIS Code</th>
                    <th class="text-right py-3 px-4 font-semibold">Total</th>
                    <th class="text-center py-3 px-4 font-semibold">Status</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($shifts as $s): ?>
                <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50" data-testid="row-shift-<?= h($s['id']) ?>">
                    <td class="py-3 px-4"><?= formatDate($s['date']) ?></td>
                    <td class="py-3 px-4 font-medium"><?= h($s['participant_name']) ?></td>
                    <td class="py-3 px-4 text-gray-500 dark:text-gray-400">
                        <?= h($s['start_time']) ?><?= $s['end_time'] ? ' - ' . h($s['end_time']) : '' ?>
                    </td>
                    <td class="py-3 px-4 text-right"><?= $s['actual_hours'] ? number_format((float)$s['actual_hours'], 1) : '—' ?></td>
                    <td class="py-3 px-4 text-right"><?= $s['hourly_rate'] ? formatCurrency($s['hourly_rate']) : '—' ?></td>
                    <td class="py-3 px-4 text-xs"><?= h($s['tier_applied'] ?? '—') ?></td>
                    <td class="py-3 px-4 text-xs font-mono"><?= h($s['ndis_item_code'] ?? '—') ?></td>
                    <td class="py-3 px-4 text-right font-semibold"><?= $s['total_charge'] ? formatCurrency($s['total_charge']) : '—' ?></td>
                    <td class="py-3 px-4 text-center">
                        <span class="badge badge-<?= match($s['status']) { 'completed' => 'teal', 'in_progress' => 'blue', 'cancelled' => 'red', default => 'gray' } ?> text-xs"
                            data-testid="badge-shift-status-<?= h($s['id']) ?>">
                            <i class="icon-<?= match($s['status']) { 'completed' => 'check-circle', 'in_progress' => 'clock', 'cancelled' => 'x-circle', default => 'circle' } ?> w-3 h-3" aria-hidden="true"></i>
                            <?= h(ucfirst(str_replace('_', ' ', $s['status']))) ?>
                        </span>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
</div>

<?php if (!$activeShift): ?>
<div id="start-shift-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Start new shift">
    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
        <h3 class="text-lg font-bold mb-4">Start New Shift</h3>
        <form method="POST">
            <?= csrfField() ?>
            <input type="hidden" name="action" value="start_shift">
            <div class="space-y-4">
                <div>
                    <label for="shift-booking" class="label">Select Booking</label>
                    <select id="shift-booking" name="booking_id" required class="input w-full" aria-required="true" data-testid="select-shift-booking">
                        <option value="">Choose a confirmed booking...</option>
                        <?php foreach ($confirmedBookings as $b): ?>
                        <option value="<?= h($b['id']) ?>">
                            <?= h($b['participant_name']) ?> — <?= formatDate($b['date']) ?> (<?= h($b['start_time'] ?? '') ?>)
                        </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="flex gap-3">
                    <button type="submit" class="btn btn-teal flex-1" data-testid="button-confirm-start-shift">Start Shift</button>
                    <button type="button" onclick="document.getElementById('start-shift-modal').classList.add('hidden')" class="btn btn-outline flex-1" data-testid="button-cancel-start-shift">Cancel</button>
                </div>
            </div>
        </form>
    </div>
</div>
<?php endif; ?>

<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
