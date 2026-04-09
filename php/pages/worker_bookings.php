<?php
$pageTitle = 'My Bookings';
$userId = currentUserId();
$worker = getWorkerByUserId($pdo, $userId);
if (!$worker) {
    setFlash('error', 'Worker profile not found.');
    redirect('/settings');
}

$statusFilter = $_GET['status'] ?? '';
$bookings = getWorkerBookings($pdo, $worker['id'], $statusFilter ?: null);
$activeShift = getWorkerActiveShift($pdo, $worker['id']);

$statusCounts = ['all' => 0, 'pending' => 0, 'confirmed' => 0, 'completed' => 0, 'cancelled' => 0];
$allBookings = getWorkerBookings($pdo, $worker['id']);
foreach ($allBookings as $b) {
    $statusCounts['all']++;
    $st = $b['status'] ?? 'pending';
    if (isset($statusCounts[$st])) $statusCounts[$st]++;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrf();
    $action = $_POST['action'] ?? '';
    $bookingId = $_POST['booking_id'] ?? '';

    if ($action === 'accept' && $bookingId) {
        if (acceptBooking($pdo, $bookingId, $worker['id'])) {
            setFlash('success', 'Booking accepted.');
        } else {
            setFlash('error', 'Booking not found or not assigned to you.');
        }
    } elseif ($action === 'decline' && $bookingId) {
        if (declineBooking($pdo, $bookingId, $worker['id'])) {
            setFlash('success', 'Booking declined.');
        } else {
            setFlash('error', 'Booking not found or not assigned to you.');
        }
    } elseif ($action === 'start_shift' && $bookingId) {
        $booking = getBookingById($pdo, $bookingId);
        if ($booking && $booking['worker_id'] === $worker['id'] && !$activeShift) {
            startWorkerShift($pdo, $worker['id'], $booking['participant_id'], $bookingId);
            acceptBooking($pdo, $bookingId, $worker['id']);
            setFlash('success', 'Shift started from booking.');
        } elseif (!$booking || $booking['worker_id'] !== $worker['id']) {
            setFlash('error', 'Booking not found or not assigned to you.');
        }
    }
    redirect('/worker/bookings' . ($statusFilter ? '?status=' . $statusFilter : ''));
}

require __DIR__ . '/../includes/layout_header.php';
?>

<div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <h1 class="text-2xl font-bold" data-testid="text-bookings-title">My Bookings</h1>

    <div class="flex flex-wrap gap-2" role="tablist" aria-label="Booking status filters">
        <?php
        $tabs = [
            '' => ['label' => 'All', 'count' => $statusCounts['all']],
            'pending' => ['label' => 'Pending', 'count' => $statusCounts['pending']],
            'confirmed' => ['label' => 'Confirmed', 'count' => $statusCounts['confirmed']],
            'completed' => ['label' => 'Completed', 'count' => $statusCounts['completed']],
            'cancelled' => ['label' => 'Cancelled', 'count' => $statusCounts['cancelled']],
        ];
        foreach ($tabs as $val => $tab):
            $isActive = $statusFilter === $val;
        ?>
        <a href="/worker/bookings<?= $val ? '?status=' . $val : '' ?>"
            class="px-4 py-2 rounded-full text-sm font-medium min-h-[44px] flex items-center gap-1.5 transition-colors
                <?= $isActive ? 'bg-map-blue text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700' ?>"
            role="tab" aria-selected="<?= $isActive ? 'true' : 'false' ?>"
            data-testid="tab-booking-<?= $val ?: 'all' ?>">
            <?= $tab['label'] ?> <span class="text-xs opacity-70">(<?= $tab['count'] ?>)</span>
        </a>
        <?php endforeach; ?>
    </div>

    <?php if (empty($bookings)): ?>
    <div class="card text-center py-12">
        <i class="icon-calendar w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" aria-hidden="true"></i>
        <p class="text-gray-500 dark:text-gray-400" data-testid="text-no-bookings">No bookings found</p>
    </div>
    <?php else: ?>
    <div class="space-y-3">
        <?php foreach ($bookings as $b):
            $status = $b['status'] ?? 'pending';
        ?>
        <div class="card" data-testid="card-booking-<?= h($b['id']) ?>">
            <div class="flex flex-col md:flex-row md:items-center gap-4">
                <div class="flex items-center gap-4 flex-1 min-w-0">
                    <div class="w-12 h-12 rounded-full bg-map-blue/10 flex items-center justify-center text-map-blue font-bold text-lg shrink-0">
                        <?= strtoupper(substr($b['participant_name'], 0, 1)) ?>
                    </div>
                    <div class="min-w-0 flex-1">
                        <h3 class="font-semibold truncate" data-testid="text-booking-participant-<?= h($b['id']) ?>"><?= h($b['participant_name']) ?></h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            <?= formatDate($b['date']) ?> &middot; <?= h($b['start_time']) ?><?= $b['end_time'] ? ' - ' . h($b['end_time']) : '' ?>
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <?= h($b['service_type'] ?? 'Care') ?>
                            <?php if ($b['notes']): ?> &middot; <?= h(mb_strimwidth($b['notes'], 0, 60, '...')) ?><?php endif; ?>
                        </p>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <span class="badge badge-<?= match($status) { 'confirmed' => 'teal', 'pending' => 'gold', 'completed' => 'blue', 'cancelled' => 'red', default => 'gray' } ?> text-xs"
                        data-testid="badge-booking-status-<?= h($b['id']) ?>">
                        <i class="icon-<?= match($status) { 'confirmed' => 'check-circle', 'pending' => 'clock', 'completed' => 'check', 'cancelled' => 'x-circle', default => 'circle' } ?> w-3 h-3" aria-hidden="true"></i>
                        <?= h(ucfirst($status)) ?>
                    </span>

                    <?php if ($status === 'pending'): ?>
                    <form method="POST" class="flex gap-1">
                        <?= csrfField() ?>
                        <input type="hidden" name="booking_id" value="<?= h($b['id']) ?>">
                        <button type="submit" name="action" value="accept" class="btn btn-teal btn-xs" data-testid="button-accept-<?= h($b['id']) ?>">
                            <i class="icon-check w-3 h-3" aria-hidden="true"></i> Accept
                        </button>
                        <button type="submit" name="action" value="decline" class="btn btn-red btn-xs" data-testid="button-decline-<?= h($b['id']) ?>">
                            <i class="icon-x w-3 h-3" aria-hidden="true"></i> Decline
                        </button>
                    </form>
                    <?php endif; ?>

                    <?php if ($status === 'confirmed' && !$activeShift): ?>
                    <form method="POST">
                        <?= csrfField() ?>
                        <input type="hidden" name="booking_id" value="<?= h($b['id']) ?>">
                        <button type="submit" name="action" value="start_shift" class="btn btn-blue btn-xs" data-testid="button-start-shift-<?= h($b['id']) ?>">
                            <i class="icon-play w-3 h-3" aria-hidden="true"></i> Start Shift
                        </button>
                    </form>
                    <?php endif; ?>

                    <?php if ($b['total_cost']): ?>
                    <span class="text-sm font-semibold text-map-blue"><?= formatCurrency($b['total_cost']) ?></span>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
</div>

<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
