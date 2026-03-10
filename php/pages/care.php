<?php
$pageTitle = 'Book a Carer';
$workers = getWorkers($pdo);
$q = $_GET['q'] ?? '';
$filterVerified = isset($_GET['verified']);
$filterTransport = isset($_GET['transport']);
$filterAccessible = isset($_GET['accessible']);

if ($q) {
    $ql = strtolower($q);
    $workers = array_filter($workers, fn($w) =>
        str_contains(strtolower($w['full_name']), $ql) ||
        str_contains(strtolower($w['title']), $ql) ||
        str_contains(strtolower($w['location'] ?? ''), $ql) ||
        str_contains(strtolower(implode(' ', pgArrayToPhp($w['specializations'] ?? ''))), $ql)
    );
}
if ($filterVerified) $workers = array_filter($workers, fn($w) => $w['ndis_verified']);
if ($filterTransport) $workers = array_filter($workers, fn($w) => $w['transport_capable']);
if ($filterAccessible) $workers = array_filter($workers, fn($w) => $w['wheelchair_accessible']);

require __DIR__ . '/../includes/layout_header.php';
?>
<div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-bold" data-testid="text-page-title">Book a Carer</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Find NDIS-verified support workers near you</p>
        </div>
        <form method="get" class="flex items-center gap-2">
            <input type="search" name="q" value="<?= h($q) ?>" placeholder="Search name, skill, location..."
                class="input max-w-xs" data-testid="input-search-workers">
            <button type="submit" class="btn btn-primary btn-sm" data-testid="button-search">Search</button>
        </form>
    </div>

    <div class="flex flex-wrap gap-2 mb-6" data-testid="filter-bar">
        <a href="?<?= $q ? 'q=' . urlencode($q) . '&' : '' ?><?= $filterVerified ? '' : 'verified&' ?><?= $filterTransport ? 'transport&' : '' ?><?= $filterAccessible ? 'accessible' : '' ?>"
           class="badge <?= $filterVerified ? 'badge-teal' : 'badge-gray' ?> cursor-pointer min-h-[36px]" data-testid="filter-verified">
            ✓ Verified
        </a>
        <a href="?<?= $q ? 'q=' . urlencode($q) . '&' : '' ?><?= $filterVerified ? 'verified&' : '' ?><?= $filterTransport ? '' : 'transport&' ?><?= $filterAccessible ? 'accessible' : '' ?>"
           class="badge <?= $filterTransport ? 'badge-blue' : 'badge-gray' ?> cursor-pointer min-h-[36px]" data-testid="filter-transport">
            🚗 Transport
        </a>
        <a href="?<?= $q ? 'q=' . urlencode($q) . '&' : '' ?><?= $filterVerified ? 'verified&' : '' ?><?= $filterTransport ? 'transport&' : '' ?><?= $filterAccessible ? '' : 'accessible' ?>"
           class="badge <?= $filterAccessible ? 'badge-gold' : 'badge-gray' ?> cursor-pointer min-h-[36px]" data-testid="filter-accessible">
            ♿ Accessible
        </a>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <?php if (empty($workers)): ?>
        <p class="text-gray-500 dark:text-gray-400 col-span-full text-center py-12">No workers found matching your criteria.</p>
        <?php endif; ?>
        <?php foreach ($workers as $w): ?>
        <a href="/care/<?= h($w['id']) ?>" class="card" data-testid="card-worker-<?= h($w['id']) ?>">
            <div class="flex items-start gap-3">
                <div class="w-12 h-12 rounded-full bg-map-blue/10 flex items-center justify-center text-map-blue font-bold text-lg shrink-0">
                    <?= strtoupper(substr($w['full_name'], 0, 1)) ?>
                </div>
                <div class="min-w-0 flex-1">
                    <h3 class="font-semibold truncate"><?= h($w['full_name']) ?></h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 truncate"><?= h($w['title']) ?></p>
                    <p class="text-xs text-gray-400 mt-0.5"><?= h($w['location']) ?></p>
                    <div class="flex items-center gap-2 mt-1.5">
                        <span class="star-rating text-xs"><?= starRating((float)$w['rating']) ?></span>
                        <span class="text-xs text-gray-400"><?= $w['rating'] ?> (<?= $w['review_count'] ?>)</span>
                    </div>
                    <div class="flex flex-wrap gap-1 mt-2">
                        <?php if ($w['ndis_verified']): ?><span class="badge badge-teal text-[10px]">NDIS Verified</span><?php endif; ?>
                        <?php if ($w['transport_capable']): ?><span class="badge badge-blue text-[10px]">Transport</span><?php endif; ?>
                        <?php if ($w['wheelchair_accessible']): ?><span class="badge badge-gold text-[10px]">Accessible</span><?php endif; ?>
                    </div>
                    <?php $specs = pgArrayToPhp($w['specializations'] ?? ''); if ($specs): ?>
                    <div class="flex flex-wrap gap-1 mt-2">
                        <?php foreach (array_slice($specs, 0, 3) as $s): ?>
                        <span class="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300"><?= h($s) ?></span>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <span class="text-xs text-gray-400"><?= h($w['availability'] ?? 'Available') ?></span>
                <span class="font-bold text-map-blue"><?= formatCurrency($w['hourly_rate']) ?>/hr</span>
            </div>
        </a>
        <?php endforeach; ?>
    </div>
</div>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
