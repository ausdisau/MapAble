<?php
$pageTitle = 'Worker Profile';
$worker = getWorker($pdo, $workerId);
if (!$worker) { http_response_code(404); require __DIR__ . '/not_found.php'; exit; }
$reviews = getReviewsForWorker($pdo, $workerId);
$pageTitle = h($worker['full_name']);
$user = currentUser($pdo);
$userId = currentUserId();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    if ($action === 'book') {
        createBooking($pdo, [
            'participant_id' => $userId,
            'worker_id' => $workerId,
            'service_type' => $_POST['service_type'] ?? 'Personal Care',
            'date' => $_POST['date'],
            'start_time' => $_POST['start_time'],
            'end_time' => $_POST['end_time'] ?? null,
            'notes' => $_POST['notes'] ?? null,
        ]);
        setFlash('success', 'Booking created successfully!');
        redirect('/care/' . $workerId);
    }
    if ($action === 'review') {
        createReview($pdo, [
            'participant_id' => $userId,
            'worker_id' => $workerId,
            'rating' => (int)$_POST['rating'],
            'comment' => $_POST['comment'] ?? null,
        ]);
        setFlash('success', 'Review submitted!');
        redirect('/care/' . $workerId);
    }
    if ($action === 'start_shift') {
        $careRate = calculateCareRate($pdo, $userId, date('Y-m'));
        createServiceSession($pdo, [
            'worker_id' => $workerId,
            'participant_id' => $userId,
            'start_time' => date('H:i'),
            'date' => date('Y-m-d'),
            'hourly_rate' => $careRate['rate'],
            'tier_applied' => $careRate['tier'],
            'ndis_item_code' => '01_011_0107_1_1',
            'status' => 'in_progress',
        ]);
        setFlash('success', 'Shift started at ' . date('g:i A'));
        redirect('/care/' . $workerId);
    }
    if ($action === 'end_shift') {
        $sessionId = $_POST['session_id'];
        $hours = (float)$_POST['hours'];
        $stmt = $pdo->prepare('SELECT * FROM service_sessions WHERE id = ?');
        $stmt->execute([$sessionId]);
        $sess = $stmt->fetch();
        if ($sess) {
            $total = round($hours * (float)$sess['hourly_rate'], 2);
            $pdo->prepare('UPDATE service_sessions SET end_time = ?, actual_hours = ?, total_charge = ?, status = ? WHERE id = ?')
                ->execute([date('H:i'), $hours, $total, 'completed', $sessionId]);
            updateBudgetUsage($pdo, $userId, 'daily_living', $total);
            setFlash('success', 'Shift completed: ' . formatCurrency($total));
        }
        redirect('/care/' . $workerId);
    }
}

$activeSession = null;
$stmt = $pdo->prepare("SELECT * FROM service_sessions WHERE participant_id = ? AND worker_id = ? AND status = 'in_progress' ORDER BY date DESC LIMIT 1");
$stmt->execute([$userId, $workerId]);
$activeSession = $stmt->fetch();

$specs = pgArrayToPhp($worker['specializations'] ?? '');
$langs = pgArrayToPhp($worker['languages'] ?? '');

require __DIR__ . '/../includes/layout_header.php';
?>
<div class="max-w-4xl mx-auto px-4 py-8 space-y-6">
    <a href="/care" class="inline-flex items-center gap-1 text-sm text-map-blue mb-2" data-testid="link-back-to-care">← Back to Workers</a>

    <div class="card">
        <div class="flex flex-col md:flex-row gap-6">
            <div class="w-20 h-20 rounded-full bg-map-blue/10 flex items-center justify-center text-map-blue font-bold text-3xl shrink-0">
                <?= strtoupper(substr($worker['full_name'], 0, 1)) ?>
            </div>
            <div class="flex-1 space-y-3">
                <div>
                    <h1 class="text-2xl font-bold" data-testid="text-worker-name"><?= h($worker['full_name']) ?></h1>
                    <p class="text-gray-500 dark:text-gray-400"><?= h($worker['title']) ?></p>
                    <p class="text-sm text-gray-400 mt-1"><?= h($worker['location']) ?></p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="star-rating"><?= starRating((float)$worker['rating']) ?></span>
                    <span class="text-sm text-gray-500"><?= $worker['rating'] ?> (<?= $worker['review_count'] ?> reviews)</span>
                    <span class="text-lg font-bold text-map-blue" data-testid="text-worker-rate"><?= formatCurrency($worker['hourly_rate']) ?>/hr</span>
                </div>
                <div class="flex flex-wrap gap-2">
                    <?php if ($worker['ndis_verified']): ?><span class="badge badge-teal">NDIS Verified</span><?php endif; ?>
                    <?php if ($worker['transport_capable']): ?><span class="badge badge-blue">Transport: <?= h($worker['transport_type'] ?? 'Available') ?></span><?php endif; ?>
                    <?php if ($worker['wheelchair_accessible']): ?><span class="badge badge-gold">Wheelchair Accessible</span><?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <?php if ($worker['bio']): ?>
    <div class="card">
        <h2 class="font-semibold mb-2">About</h2>
        <p class="text-sm text-gray-600 dark:text-gray-300"><?= nl2br(h($worker['bio'])) ?></p>
    </div>
    <?php endif; ?>

    <?php if ($specs): ?>
    <div class="card">
        <h2 class="font-semibold mb-3">Specializations</h2>
        <div class="flex flex-wrap gap-2">
            <?php foreach ($specs as $s): ?>
            <span class="badge badge-blue"><?= h($s) ?></span>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <?php if ($langs): ?>
    <div class="card">
        <h2 class="font-semibold mb-3">Languages</h2>
        <div class="flex flex-wrap gap-2">
            <?php foreach ($langs as $l): ?>
            <span class="badge badge-gray"><?= h($l) ?></span>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <div class="card">
        <h2 class="font-semibold mb-3">Verification & Compliance</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div class="flex items-center gap-2"><span class="text-map-teal">✓</span> ABN: <?= h($worker['abn'] ?? 'On file') ?></div>
            <div class="flex items-center gap-2"><span class="text-map-teal">✓</span> WWCC: <?= h($worker['wwcc_number'] ?? 'Verified') ?></div>
            <div class="flex items-center gap-2"><span class="text-map-teal">✓</span> First Aid: <?= h($worker['first_aid_expiry'] ? 'Exp ' . $worker['first_aid_expiry'] : 'Current') ?></div>
            <div class="flex items-center gap-2"><span class="text-map-teal">✓</span> Insurance: <?= h($worker['insurance_expiry'] ? 'Exp ' . $worker['insurance_expiry'] : 'Current') ?></div>
        </div>
    </div>

    <div class="card" data-testid="section-shift-timer">
        <h2 class="font-semibold mb-3">Shift Timer</h2>
        <?php if ($activeSession): ?>
        <div class="bg-map-teal/10 border border-map-teal/30 rounded-lg p-4 space-y-3">
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-map-teal">Shift In Progress</span>
                <span class="text-xs text-gray-400">Started: <?= h($activeSession['start_time']) ?></span>
            </div>
            <div class="text-3xl font-bold text-center" id="shift-timer" data-start="<?= h($activeSession['start_time']) ?>" data-date="<?= h($activeSession['date']) ?>">00:00:00</div>
            <form method="POST" class="flex items-center gap-2">
                <input type="hidden" name="action" value="end_shift">
                <input type="hidden" name="session_id" value="<?= h($activeSession['id']) ?>">
                <input type="number" name="hours" step="0.25" min="0.25" placeholder="Hours worked" class="input flex-1" required data-testid="input-shift-hours">
                <button type="submit" class="btn bg-red-500 text-white" data-testid="button-end-shift">End Shift</button>
            </form>
            <p class="text-xs text-gray-400">Rate: <?= formatCurrency($activeSession['hourly_rate']) ?>/hr (<?= h($activeSession['tier_applied']) ?>)</p>
        </div>
        <?php else: ?>
        <form method="POST">
            <input type="hidden" name="action" value="start_shift">
            <button type="submit" class="btn btn-teal w-full" data-testid="button-start-shift">Start Shift</button>
        </form>
        <?php endif; ?>
    </div>

    <div class="card" data-testid="section-booking">
        <h2 class="font-semibold mb-3">Book This Worker</h2>
        <form method="POST" class="space-y-4">
            <input type="hidden" name="action" value="book">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="label">Service Type</label>
                    <select name="service_type" class="input" data-testid="select-service-type">
                        <option value="Personal Care">Personal Care</option>
                        <option value="Community Access">Community Access</option>
                        <option value="Domestic Assistance">Domestic Assistance</option>
                        <option value="Transport">Transport</option>
                    </select>
                </div>
                <div>
                    <label class="label">Date</label>
                    <input type="date" name="date" class="input" required data-testid="input-booking-date">
                </div>
                <div>
                    <label class="label">Start Time</label>
                    <input type="time" name="start_time" class="input" required data-testid="input-booking-start">
                </div>
                <div>
                    <label class="label">End Time</label>
                    <input type="time" name="end_time" class="input" data-testid="input-booking-end">
                </div>
            </div>
            <div>
                <label class="label">Notes</label>
                <textarea name="notes" rows="2" class="input" placeholder="Any special requirements..." data-testid="input-booking-notes"></textarea>
            </div>
            <button type="submit" class="btn btn-primary" data-testid="button-book-worker">Book Now</button>
        </form>
    </div>

    <div class="card" data-testid="section-reviews">
        <h2 class="font-semibold mb-4">Reviews (<?= count($reviews) ?>)</h2>
        <?php if (empty($reviews)): ?>
        <p class="text-sm text-gray-400">No reviews yet. Be the first!</p>
        <?php endif; ?>
        <?php foreach ($reviews as $r): ?>
        <div class="border-b border-gray-100 dark:border-gray-800 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
            <div class="flex items-center justify-between">
                <span class="font-medium text-sm"><?= h($r['reviewer_name']) ?></span>
                <span class="text-xs text-gray-400"><?= formatDate($r['created_at']) ?></span>
            </div>
            <span class="star-rating text-sm"><?= starRating($r['rating']) ?></span>
            <?php if ($r['comment']): ?><p class="text-sm text-gray-600 dark:text-gray-300 mt-1"><?= h($r['comment']) ?></p><?php endif; ?>
        </div>
        <?php endforeach; ?>

        <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h3 class="text-sm font-semibold mb-3">Leave a Review</h3>
            <form method="POST" class="space-y-3">
                <input type="hidden" name="action" value="review">
                <div>
                    <label class="label">Rating</label>
                    <select name="rating" class="input" required data-testid="select-review-rating">
                        <option value="5">★★★★★ Excellent</option>
                        <option value="4">★★★★☆ Great</option>
                        <option value="3">★★★☆☆ Good</option>
                        <option value="2">★★☆☆☆ Fair</option>
                        <option value="1">★☆☆☆☆ Poor</option>
                    </select>
                </div>
                <div>
                    <label class="label">Comment</label>
                    <textarea name="comment" rows="2" class="input" placeholder="Your experience..." data-testid="input-review-comment"></textarea>
                </div>
                <button type="submit" class="btn btn-teal btn-sm" data-testid="button-submit-review">Submit Review</button>
            </form>
        </div>
    </div>
</div>

<script>
(function() {
    const timer = document.getElementById('shift-timer');
    if (!timer) return;
    const startTime = timer.dataset.start;
    const startDate = timer.dataset.date;
    const start = new Date(startDate + 'T' + startTime);
    function update() {
        const now = new Date();
        const diff = Math.max(0, Math.floor((now - start) / 1000));
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        timer.textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    }
    update();
    setInterval(update, 1000);
})();
</script>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
