<?php
$pageTitle = 'Find a Job';
$jobs = getJobs($pdo);
$q = $_GET['q'] ?? '';
$cat = $_GET['category'] ?? '';

if ($q) {
    $ql = strtolower($q);
    $jobs = array_filter($jobs, fn($j) =>
        str_contains(strtolower($j['title']), $ql) ||
        str_contains(strtolower($j['description']), $ql) ||
        str_contains(strtolower($j['location']), $ql)
    );
}
if ($cat) {
    $jobs = array_filter($jobs, fn($j) => strtolower($j['category']) === strtolower($cat));
}

$categories = ['Care', 'Transport', 'Support', 'Employment'];
require __DIR__ . '/../includes/layout_header.php';
?>
<div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-bold" data-testid="text-page-title">Find a Job</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Disability support roles across Australia</p>
        </div>
        <form method="get" class="flex items-center gap-2">
            <?php if ($cat): ?><input type="hidden" name="category" value="<?= h($cat) ?>"><?php endif; ?>
            <input type="search" name="q" value="<?= h($q) ?>" placeholder="Search jobs..." class="input max-w-xs" data-testid="input-search-jobs">
            <button type="submit" class="btn btn-primary btn-sm" data-testid="button-search">Search</button>
        </form>
    </div>

    <div class="flex flex-wrap gap-2 mb-6">
        <a href="/jobs" class="badge <?= !$cat ? 'badge-blue' : 'badge-gray' ?> cursor-pointer min-h-[36px]" data-testid="filter-all">All</a>
        <?php foreach ($categories as $c): ?>
        <a href="/jobs?category=<?= urlencode($c) ?><?= $q ? '&q=' . urlencode($q) : '' ?>"
           class="badge <?= strtolower($cat) === strtolower($c) ? 'badge-teal' : 'badge-gray' ?> cursor-pointer min-h-[36px]"
           data-testid="filter-<?= strtolower($c) ?>"><?= $c ?></a>
        <?php endforeach; ?>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <?php if (empty($jobs)): ?>
        <p class="text-gray-500 dark:text-gray-400 col-span-full text-center py-12">No jobs found.</p>
        <?php endif; ?>
        <?php foreach ($jobs as $j): ?>
        <a href="/jobs/<?= h($j['id']) ?>" class="card" data-testid="card-job-<?= h($j['id']) ?>">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <h3 class="font-semibold"><?= h($j['title']) ?></h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1"><?= h($j['location']) ?> · <?= h($j['job_type']) ?></p>
                </div>
                <span class="badge badge-<?= match($j['category']) { 'Care' => 'teal', 'Transport' => 'blue', 'Employment' => 'gold', default => 'gray' } ?> shrink-0"><?= h($j['category']) ?></span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2"><?= h(substr($j['description'], 0, 150)) ?></p>
            <?php $reqs = pgArrayToPhp($j['requirements'] ?? ''); if ($reqs): ?>
            <div class="flex flex-wrap gap-1 mt-2">
                <?php foreach (array_slice($reqs, 0, 3) as $r): ?>
                <span class="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded"><?= h($r) ?></span>
                <?php endforeach; ?>
                <?php if (count($reqs) > 3): ?><span class="text-[10px] text-gray-400">+<?= count($reqs) - 3 ?> more</span><?php endif; ?>
            </div>
            <?php endif; ?>
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <span class="badge badge-<?= $j['status'] === 'open' ? 'teal' : 'gray' ?> text-[10px]"><?= ucfirst($j['status']) ?></span>
                <?php if ($j['salary']): ?><span class="font-semibold text-map-teal text-sm"><?= h($j['salary']) ?></span><?php endif; ?>
            </div>
        </a>
        <?php endforeach; ?>
    </div>
</div>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
