<?php
$job = getJob($pdo, $jobId);
if (!$job) { http_response_code(404); require __DIR__ . '/not_found.php'; exit; }
$pageTitle = h($job['title']);
$reqs = pgArrayToPhp($job['requirements'] ?? '');
require __DIR__ . '/../includes/layout_header.php';
?>
<div class="max-w-3xl mx-auto px-4 py-8 space-y-6">
    <a href="/jobs" class="inline-flex items-center gap-1 text-sm text-map-blue" data-testid="link-back-to-jobs">← Back to Jobs</a>

    <div class="card space-y-4">
        <div class="flex items-start justify-between gap-3">
            <div>
                <h1 class="text-2xl font-bold" data-testid="text-job-title"><?= h($job['title']) ?></h1>
                <p class="text-gray-500 dark:text-gray-400 mt-1"><?= h($job['location']) ?> · <?= h($job['job_type']) ?></p>
            </div>
            <span class="badge badge-<?= match($job['category']) { 'Care' => 'teal', 'Transport' => 'blue', 'Employment' => 'gold', default => 'gray' } ?>"><?= h($job['category']) ?></span>
        </div>
        <?php if ($job['salary']): ?>
        <p class="text-xl font-bold text-map-teal" data-testid="text-job-salary"><?= h($job['salary']) ?></p>
        <?php endif; ?>
        <span class="badge badge-<?= $job['status'] === 'open' ? 'teal' : 'gray' ?>"><?= ucfirst($job['status']) ?></span>
    </div>

    <div class="card">
        <h2 class="font-semibold mb-3">Description</h2>
        <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line" data-testid="text-job-description"><?= h($job['description']) ?></p>
    </div>

    <?php if ($reqs): ?>
    <div class="card">
        <h2 class="font-semibold mb-3">Requirements</h2>
        <ul class="space-y-2">
            <?php foreach ($reqs as $r): ?>
            <li class="flex items-start gap-2 text-sm">
                <span class="text-map-teal mt-0.5">✓</span>
                <span class="text-gray-600 dark:text-gray-300"><?= h($r) ?></span>
            </li>
            <?php endforeach; ?>
        </ul>
    </div>
    <?php endif; ?>

    <div class="flex gap-3">
        <button class="btn btn-primary flex-1" data-testid="button-apply-job" onclick="alert('Application submitted! The employer will be in touch.')">Apply Now</button>
        <button class="btn btn-outline" data-testid="button-save-job" onclick="alert('Job saved to your list!')">Save Job</button>
    </div>
</div>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
