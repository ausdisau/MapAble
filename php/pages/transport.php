<?php
$pageTitle = 'Get Transport';
$userId = currentUserId();
$drivers = array_filter(getWorkers($pdo), fn($w) => $w['transport_capable']);
$requests = getTransportRequests($pdo);
$trips = getTransportTrips($pdo, $userId);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrf();
    $action = $_POST['action'] ?? '';
    if ($action === 'request') {
        createTransportRequest($pdo, [
            'participant_id' => $userId,
            'worker_id' => $_POST['worker_id'] ?: null,
            'pickup_location' => $_POST['pickup_location'],
            'dropoff_location' => $_POST['dropoff_location'],
            'date' => $_POST['date'],
            'time' => $_POST['time'],
            'wheelchair_required' => !empty($_POST['wheelchair_required']),
            'notes' => $_POST['notes'] ?? null,
        ]);
        setFlash('success', 'Transport request submitted!');
        redirect('/transport');
    }
    if ($action === 'log_trip') {
        $transportRate = calculateTransportRate($pdo, $userId, date('Y-m'));
        $km = (float)$_POST['distance_km'];
        $accessible = !empty($_POST['accessible_vehicle']);
        $surcharge = $accessible ? round($km * 0.15, 2) : 0;
        $tolls = (float)($_POST['tolls'] ?? 0);
        $total = round($km * $transportRate['rate'] + $surcharge + $tolls, 2);
        createTransportTrip($pdo, [
            'worker_id' => $_POST['worker_id'],
            'participant_id' => $userId,
            'distance_km' => $km,
            'per_km_rate' => $transportRate['rate'],
            'tier_applied' => $transportRate['tier'],
            'accessible_vehicle' => $accessible,
            'accessible_surcharge' => $surcharge,
            'tolls' => $tolls,
            'total_charge' => $total,
            'ndis_item_code' => '02_051_0108_1_1',
            'status' => 'completed',
            'date' => date('Y-m-d'),
        ]);
        updateBudgetUsage($pdo, $userId, 'transport', $total);
        setFlash('success', 'Trip logged: ' . formatCurrency($total));
        redirect('/transport');
    }
}

require __DIR__ . '/../includes/layout_header.php';
?>
<div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
    <div>
        <h1 class="text-2xl font-bold" data-testid="text-page-title">Get Transport</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">Book accessible transport or log trips</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card" data-testid="section-book-transport">
            <h2 class="font-semibold mb-4">Book Transport</h2>
            <form method="POST" class="space-y-4">
                <?= csrfField() ?>
                <input type="hidden" name="action" value="request">
                <div>
                    <label class="label">Pickup Location</label>
                    <input type="text" name="pickup_location" class="input" required placeholder="123 Main St, Sydney" data-testid="input-pickup">
                </div>
                <div>
                    <label class="label">Dropoff Location</label>
                    <input type="text" name="dropoff_location" class="input" required placeholder="456 Park Ave, Sydney" data-testid="input-dropoff">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">Date</label>
                        <input type="date" name="date" class="input" required data-testid="input-transport-date">
                    </div>
                    <div>
                        <label class="label">Time</label>
                        <input type="time" name="time" class="input" required data-testid="input-transport-time">
                    </div>
                </div>
                <div>
                    <label class="label">Preferred Driver</label>
                    <select name="worker_id" class="input" data-testid="select-driver">
                        <option value="">Any available driver</option>
                        <?php foreach ($drivers as $d): ?>
                        <option value="<?= h($d['id']) ?>"><?= h($d['full_name']) ?> <?= $d['wheelchair_accessible'] ? '(♿ Accessible)' : '' ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <label class="flex items-center gap-2 min-h-[44px] cursor-pointer">
                    <input type="checkbox" name="wheelchair_required" value="1" class="w-5 h-5 rounded" data-testid="input-wheelchair-required">
                    <span class="text-sm">Wheelchair accessible vehicle required</span>
                </label>
                <div>
                    <label class="label">Notes</label>
                    <textarea name="notes" rows="2" class="input" placeholder="Any special requirements..." data-testid="input-transport-notes"></textarea>
                </div>
                <button type="submit" class="btn btn-primary w-full" data-testid="button-request-transport">Request Transport</button>
            </form>
        </div>

        <div class="card" data-testid="section-log-trip">
            <h2 class="font-semibold mb-4">Log a Trip</h2>
            <form method="POST" class="space-y-4">
                <?= csrfField() ?>
                <input type="hidden" name="action" value="log_trip">
                <div>
                    <label class="label">Driver</label>
                    <select name="worker_id" class="input" required data-testid="select-trip-driver">
                        <?php foreach ($drivers as $d): ?>
                        <option value="<?= h($d['id']) ?>"><?= h($d['full_name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="label">Distance (km)</label>
                        <input type="number" name="distance_km" step="0.1" min="0.1" class="input" required data-testid="input-distance-km">
                    </div>
                    <div>
                        <label class="label">Tolls ($)</label>
                        <input type="number" name="tolls" step="0.01" min="0" value="0" class="input" data-testid="input-tolls">
                    </div>
                </div>
                <label class="flex items-center gap-2 min-h-[44px] cursor-pointer">
                    <input type="checkbox" name="accessible_vehicle" value="1" class="w-5 h-5 rounded" data-testid="input-accessible-vehicle">
                    <span class="text-sm">Wheelchair accessible vehicle used (+$0.15/km)</span>
                </label>
                <button type="submit" class="btn btn-teal w-full" data-testid="button-log-trip">Log Trip</button>
            </form>
        </div>
    </div>

    <?php if ($trips): ?>
    <div class="card" data-testid="section-recent-trips">
        <h2 class="font-semibold mb-4">Recent Trips</h2>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead><tr class="border-b border-gray-200 dark:border-gray-700">
                    <th class="text-left py-2 font-medium text-gray-500">Date</th>
                    <th class="text-left py-2 font-medium text-gray-500">Driver</th>
                    <th class="text-right py-2 font-medium text-gray-500">Distance</th>
                    <th class="text-right py-2 font-medium text-gray-500">Rate</th>
                    <th class="text-right py-2 font-medium text-gray-500">Total</th>
                    <th class="text-center py-2 font-medium text-gray-500">Tier</th>
                </tr></thead>
                <tbody>
                <?php foreach (array_slice($trips, 0, 10) as $t): ?>
                <tr class="border-b border-gray-100 dark:border-gray-800">
                    <td class="py-2"><?= formatDate($t['date']) ?></td>
                    <td class="py-2"><?= h($t['worker_name'] ?? 'Driver') ?></td>
                    <td class="py-2 text-right"><?= number_format((float)$t['distance_km'], 1) ?> km</td>
                    <td class="py-2 text-right"><?= formatCurrency($t['per_km_rate']) ?>/km</td>
                    <td class="py-2 text-right font-semibold"><?= formatCurrency($t['total_charge']) ?></td>
                    <td class="py-2 text-center"><span class="badge badge-blue text-[10px]"><?= h($t['tier_applied']) ?></span></td>
                </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
    <?php endif; ?>
</div>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
