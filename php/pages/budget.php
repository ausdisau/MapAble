<?php
$pageTitle = 'Budget';
$userId = currentUserId();
$budgets = getParticipantBudgets($pdo, $userId);
$sessions = getServiceSessions($pdo, $userId);
$trips = getTransportTrips($pdo, $userId);
$careRate = calculateCareRate($pdo, $userId, date('Y-m'));
$transportRate = calculateTransportRate($pdo, $userId, date('Y-m'));

$categoryLabels = ['daily_living' => 'Daily Living', 'transport' => 'Transport', 'capacity_building' => 'Capacity Building'];
$categoryColors = ['daily_living' => 'map-teal', 'transport' => 'map-blue', 'capacity_building' => 'map-gold'];

require __DIR__ . '/../includes/layout_header.php';
?>
<div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
    <div>
        <h1 class="text-2xl font-bold" data-testid="text-page-title">Budget Dashboard</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Track your NDIS plan spending</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card">
            <h3 class="text-sm font-semibold text-gray-500 mb-1">Current Care Tier</h3>
            <p class="text-2xl font-bold text-map-teal" data-testid="text-care-tier"><?= h($careRate['tier']) ?></p>
            <p class="text-sm text-gray-500"><?= formatCurrency($careRate['rate']) ?>/hr · <?= number_format($careRate['hours'], 1) ?> hrs this month</p>
        </div>
        <div class="card">
            <h3 class="text-sm font-semibold text-gray-500 mb-1">Current Transport Tier</h3>
            <p class="text-2xl font-bold text-map-blue" data-testid="text-transport-tier"><?= h($transportRate['tier']) ?></p>
            <p class="text-sm text-gray-500"><?= formatCurrency($transportRate['rate']) ?>/km · <?= number_format($transportRate['km'], 1) ?> km this month</p>
        </div>
    </div>

    <?php if ($budgets): ?>
    <div class="space-y-4">
        <h2 class="text-xl font-bold">Budget Categories</h2>
        <?php foreach ($budgets as $b):
            $allocated = (float)$b['total_allocated'];
            $used = (float)$b['total_used'];
            $remaining = $allocated - $used;
            $pct = $allocated > 0 ? min(100, round($used / $allocated * 100)) : 0;
            $cat = $b['category'];
            $color = $categoryColors[$cat] ?? 'map-blue';
        ?>
        <div class="card" data-testid="card-budget-<?= h($cat) ?>">
            <div class="flex items-center justify-between mb-2">
                <h3 class="font-semibold"><?= h($categoryLabels[$cat] ?? $cat) ?></h3>
                <span class="text-sm font-semibold <?= $pct > 80 ? 'text-red-500' : 'text-' . $color ?>"><?= $pct ?>% used</span>
            </div>
            <div class="progress-bar mb-2">
                <div class="progress-fill bg-<?= $color ?>" style="width: <?= $pct ?>%"></div>
            </div>
            <div class="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Used: <?= formatCurrency($used) ?></span>
                <span>Remaining: <?= formatCurrency($remaining) ?></span>
                <span>Total: <?= formatCurrency($allocated) ?></span>
            </div>
            <p class="text-xs text-gray-400 mt-1">Period: <?= formatDate($b['period_start']) ?> — <?= formatDate($b['period_end']) ?></p>
        </div>
        <?php endforeach; ?>
    </div>
    <?php else: ?>
    <div class="card text-center py-8">
        <p class="text-gray-400">No budget categories set up yet.</p>
    </div>
    <?php endif; ?>

    <div class="card" data-testid="section-recent-activity">
        <h2 class="font-semibold mb-4">Recent Activity</h2>
        <?php
        $activity = [];
        foreach (array_slice($sessions, 0, 5) as $s) {
            $activity[] = ['date' => $s['date'], 'type' => 'Care', 'desc' => ($s['worker_name'] ?? 'Worker') . ' · ' . ($s['actual_hours'] ?? '?') . ' hrs', 'amount' => $s['total_charge'], 'tier' => $s['tier_applied']];
        }
        foreach (array_slice($trips, 0, 5) as $t) {
            $activity[] = ['date' => $t['date'], 'type' => 'Transport', 'desc' => ($t['worker_name'] ?? 'Driver') . ' · ' . number_format((float)$t['distance_km'], 1) . ' km', 'amount' => $t['total_charge'], 'tier' => $t['tier_applied']];
        }
        usort($activity, fn($a, $b) => strcmp($b['date'], $a['date']));
        ?>
        <?php if (empty($activity)): ?>
        <p class="text-sm text-gray-400">No recent activity.</p>
        <?php endif; ?>
        <?php foreach (array_slice($activity, 0, 10) as $a): ?>
        <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div>
                <span class="badge badge-<?= $a['type'] === 'Care' ? 'teal' : 'blue' ?> text-[10px] mr-2"><?= $a['type'] ?></span>
                <span class="text-sm"><?= h($a['desc']) ?></span>
            </div>
            <div class="text-right">
                <span class="font-semibold text-sm"><?= formatCurrency($a['amount'] ?? 0) ?></span>
                <span class="text-[10px] text-gray-400 block"><?= formatDate($a['date']) ?></span>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
