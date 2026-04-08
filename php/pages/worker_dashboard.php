<?php
$pageTitle = 'Worker Dashboard';
$userId = currentUserId();
$worker = getWorkerByUserId($pdo, $userId);
if (!$worker) {
    setFlash('error', 'Worker profile not found.');
    redirect('/settings');
}

$monthStart = date('Y-m-01');
$monthEnd = date('Y-m-t');
$earnings = getWorkerEarnings($pdo, $worker['id'], $monthStart, $monthEnd);
$todayBookings = getWorkerTodayBookings($pdo, $worker['id']);
$activeShift = getWorkerActiveShift($pdo, $worker['id']);
$upcomingBookings = getWorkerUpcomingBookings($pdo, $worker['id'], 5);
$recentReviews = getWorkerRecentReviews($pdo, $worker['id'], 3);
$activeBookingsCount = getWorkerActiveBookingsCount($pdo, $worker['id']);
$complianceAlerts = getWorkerComplianceAlerts($pdo, $worker['id']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrf();
    $action = $_POST['action'] ?? '';
    if ($action === 'end_shift' && $activeShift) {
        $hours = (float)($_POST['hours'] ?? 0);
        $notes = $_POST['notes'] ?? '';
        if ($hours > 0) {
            $result = endWorkerShift($pdo, $activeShift['id'], $hours, $notes, $worker['id']);
            if ($result) {
                setFlash('success', 'Shift ended successfully. ' . $hours . ' hours logged.');
            } else {
                setFlash('error', 'Could not end shift. Session not found or not yours.');
            }
        }
    }
    redirect('/');
}

require __DIR__ . '/../includes/layout_header.php';
?>

<div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold" data-testid="text-worker-dashboard-title">
                Welcome back, <?= h(explode(' ', $worker['full_name'])[0]) ?>
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400" data-testid="text-worker-dashboard-subtitle"><?= h($worker['title']) ?></p>
        </div>
        <div class="flex gap-2">
            <a href="/worker/shifts" class="btn btn-blue btn-sm" data-testid="link-view-all-shifts">
                <i class="icon-clock w-4 h-4" aria-hidden="true"></i> View All Shifts
            </a>
            <a href="/worker/profile" class="btn btn-outline btn-sm" data-testid="link-edit-profile">
                <i class="icon-user w-4 h-4" aria-hidden="true"></i> Edit Profile
            </a>
        </div>
    </div>

    <?php if (!empty($complianceAlerts)): ?>
    <div class="rounded-lg border-l-4 <?= in_array('expired', array_column($complianceAlerts, 'level')) ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' ?> p-4" role="alert" data-testid="alert-compliance">
        <div class="flex items-start gap-3">
            <i class="icon-alert-triangle w-5 h-5 <?= in_array('expired', array_column($complianceAlerts, 'level')) ? 'text-red-500' : 'text-yellow-500' ?> mt-0.5" aria-hidden="true"></i>
            <div>
                <h3 class="font-semibold text-sm <?= in_array('expired', array_column($complianceAlerts, 'level')) ? 'text-red-800 dark:text-red-300' : 'text-yellow-800 dark:text-yellow-300' ?>">Compliance Alerts</h3>
                <ul class="mt-1 space-y-1">
                    <?php foreach ($complianceAlerts as $alert): ?>
                    <li class="text-sm <?= $alert['level'] === 'expired' ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400' ?>" data-testid="text-compliance-alert-<?= h($alert['field']) ?>">
                        <i class="icon-<?= $alert['level'] === 'expired' ? 'x-circle' : 'alert-circle' ?> w-3 h-3 inline" aria-hidden="true"></i>
                        <?= h($alert['label']) ?>:
                        <?php if (isset($alert['expiry'])): ?>
                            <?= $alert['level'] === 'expired' ? 'Expired' : 'Expires' ?> <?= h(formatDate($alert['expiry'])) ?>
                        <?php else: ?>
                            Status: <?= h($alert['status'] ?? 'Unknown') ?>
                        <?php endif; ?>
                    </li>
                    <?php endforeach; ?>
                </ul>
                <a href="/worker/profile" class="text-xs font-medium underline mt-2 inline-block">Update compliance documents</a>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <?php if ($activeShift): ?>
    <div class="card border-2 border-map-teal bg-map-teal/5 dark:bg-map-teal/10" data-testid="card-active-shift">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-map-teal/20 flex items-center justify-center">
                    <i class="icon-play text-map-teal w-6 h-6" aria-hidden="true"></i>
                </div>
                <div>
                    <h2 class="font-bold text-lg" data-testid="text-active-shift-title">Active Shift</h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                        With <span class="font-medium"><?= h($activeShift['participant_name']) ?></span>
                        &middot; Started at <?= h($activeShift['start_time']) ?>
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Rate: <?= formatCurrency($activeShift['hourly_rate']) ?>/hr (<?= h($activeShift['tier_applied']) ?>)
                    </p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <div class="text-center">
                    <div class="text-2xl font-mono font-bold text-map-teal" id="shift-timer" data-start="<?= h($activeShift['start_time']) ?>" data-date="<?= h($activeShift['date']) ?>" data-testid="text-shift-timer" aria-live="polite">
                        00:00:00
                    </div>
                    <span class="text-xs text-gray-500">Elapsed</span>
                </div>
                <button onclick="document.getElementById('end-shift-modal').classList.remove('hidden')" class="btn btn-red btn-sm" data-testid="button-end-shift">
                    <i class="icon-square w-4 h-4" aria-hidden="true"></i> End Shift
                </button>
            </div>
        </div>
    </div>

    <div id="end-shift-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="End shift">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 class="text-lg font-bold mb-4">End Shift</h3>
            <form method="POST">
                <?= csrfField() ?>
                <input type="hidden" name="action" value="end_shift">
                <div class="space-y-4">
                    <div>
                        <label for="end-hours" class="label">Total Hours Worked</label>
                        <input type="number" id="end-hours" name="hours" step="0.25" min="0.25" max="24" required
                            class="input w-full" data-testid="input-end-shift-hours"
                            aria-required="true">
                    </div>
                    <div>
                        <label for="end-notes" class="label">Shift Notes (optional)</label>
                        <textarea id="end-notes" name="notes" rows="3" class="input w-full" data-testid="input-end-shift-notes"
                            placeholder="Any notes about this shift..."></textarea>
                    </div>
                    <div class="flex gap-3">
                        <button type="submit" class="btn btn-teal flex-1" data-testid="button-confirm-end-shift">Confirm & End Shift</button>
                        <button type="button" onclick="document.getElementById('end-shift-modal').classList.add('hidden')" class="btn btn-outline flex-1" data-testid="button-cancel-end-shift">Cancel</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
    <?php endif; ?>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card stat-card" data-testid="stat-worker-hours">
            <div class="stat-value"><?= number_format((float)$earnings['total_hours'], 1) ?></div>
            <div class="stat-label">Hours This Month</div>
        </div>
        <div class="card stat-card" data-testid="stat-worker-earnings">
            <div class="stat-value"><?= formatCurrency($earnings['total_earnings']) ?></div>
            <div class="stat-label">Earnings This Month</div>
        </div>
        <div class="card stat-card" data-testid="stat-worker-rating">
            <div class="stat-value"><?= number_format((float)$worker['rating'], 1) ?></div>
            <div class="stat-label">Average Rating</div>
        </div>
        <div class="card stat-card" data-testid="stat-worker-bookings">
            <div class="stat-value"><?= $activeBookingsCount ?></div>
            <div class="stat-label">Active Bookings</div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-lg font-bold" data-testid="text-today-schedule-title">Today's Schedule</h2>
                <span class="text-xs text-gray-500 dark:text-gray-400"><?= date('l, j F Y') ?></span>
            </div>
            <?php if (empty($todayBookings)): ?>
            <div class="card text-center py-8">
                <i class="icon-calendar w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" aria-hidden="true"></i>
                <p class="text-sm text-gray-500 dark:text-gray-400" data-testid="text-no-today-bookings">No bookings scheduled for today</p>
            </div>
            <?php else: ?>
            <div class="space-y-2">
                <?php foreach ($todayBookings as $b): ?>
                <div class="card flex items-center gap-4" data-testid="card-today-booking-<?= h($b['id']) ?>">
                    <div class="w-10 h-10 rounded-full bg-map-blue/10 flex items-center justify-center text-map-blue font-bold shrink-0">
                        <?= strtoupper(substr($b['participant_name'], 0, 1)) ?>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-sm truncate"><?= h($b['participant_name']) ?></p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            <?= h($b['start_time']) ?><?= $b['end_time'] ? ' - ' . h($b['end_time']) : '' ?>
                            &middot; <?= h($b['service_type'] ?? 'Care') ?>
                        </p>
                    </div>
                    <span class="badge badge-<?= $b['status'] === 'confirmed' ? 'teal' : 'gold' ?> text-xs" data-testid="badge-booking-status-<?= h($b['id']) ?>">
                        <?= h(ucfirst($b['status'])) ?>
                    </span>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </section>

        <section>
            <div class="flex items-center justify-between mb-3">
                <h2 class="text-lg font-bold" data-testid="text-upcoming-bookings-title">Upcoming Bookings</h2>
                <a href="/worker/bookings" class="text-map-blue text-xs font-medium" data-testid="link-view-all-bookings">View All &rarr;</a>
            </div>
            <?php if (empty($upcomingBookings)): ?>
            <div class="card text-center py-8">
                <i class="icon-calendar-check w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" aria-hidden="true"></i>
                <p class="text-sm text-gray-500 dark:text-gray-400" data-testid="text-no-upcoming-bookings">No upcoming bookings</p>
            </div>
            <?php else: ?>
            <div class="space-y-2">
                <?php foreach ($upcomingBookings as $b): ?>
                <div class="card flex items-center gap-3" data-testid="card-upcoming-booking-<?= h($b['id']) ?>">
                    <div class="w-10 h-10 rounded-full bg-map-teal/10 flex items-center justify-center text-map-teal font-bold shrink-0">
                        <?= strtoupper(substr($b['participant_name'], 0, 1)) ?>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-sm truncate"><?= h($b['participant_name']) ?></p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            <?= formatDate($b['date']) ?> &middot; <?= h($b['start_time']) ?>
                        </p>
                    </div>
                    <?php if ($b['status'] === 'pending'): ?>
                    <div class="flex gap-1">
                        <form method="POST" action="/api/worker/booking/accept" class="inline">
                            <input type="hidden" name="booking_id" value="<?= h($b['id']) ?>">
                            <button type="button" onclick="workerApiAction('/api/worker/booking/accept', {booking_id: '<?= h($b['id']) ?>'})" class="btn btn-teal btn-xs" data-testid="button-accept-booking-<?= h($b['id']) ?>">Accept</button>
                        </form>
                        <button type="button" onclick="workerApiAction('/api/worker/booking/decline', {booking_id: '<?= h($b['id']) ?>'})" class="btn btn-red btn-xs" data-testid="button-decline-booking-<?= h($b['id']) ?>">Decline</button>
                    </div>
                    <?php else: ?>
                    <span class="badge badge-teal text-xs">Confirmed</span>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </section>
    </div>

    <section>
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold" data-testid="text-recent-reviews-title">Recent Reviews</h2>
        </div>
        <?php if (empty($recentReviews)): ?>
        <div class="card text-center py-8">
            <i class="icon-star w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" aria-hidden="true"></i>
            <p class="text-sm text-gray-500 dark:text-gray-400" data-testid="text-no-reviews">No reviews yet</p>
        </div>
        <?php else: ?>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <?php foreach ($recentReviews as $r): ?>
            <div class="card" data-testid="card-review-<?= h($r['id']) ?>">
                <div class="flex items-center gap-2 mb-2">
                    <span class="star-rating text-sm"><?= starRating((int)$r['rating']) ?></span>
                    <span class="text-xs text-gray-500 dark:text-gray-400"><?= timeAgo($r['created_at']) ?></span>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300"><?= h($r['comment'] ?? 'No comment') ?></p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">— <?= h($r['reviewer_name']) ?></p>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </section>
</div>

<script>
(function() {
    const timer = document.getElementById('shift-timer');
    if (!timer) return;
    const startTime = timer.dataset.start;
    const startDate = timer.dataset.date;
    if (!startTime || !startDate) return;
    const [sh, sm] = startTime.split(':').map(Number);
    const [sy, smon, sd] = startDate.split('-').map(Number);
    const startMs = new Date(sy, smon - 1, sd, sh, sm, 0).getTime();
    function updateTimer() {
        const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        timer.textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    updateTimer();
    setInterval(updateTimer, 1000);
})();

function workerApiAction(url, data) {
    data.csrf_token = '<?= h(csrfToken()) ?>';
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': data.csrf_token },
        body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
        if (res.success) location.reload();
        else alert(res.error || 'Action failed');
    }).catch(() => alert('Request failed'));
}
</script>

<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
