<?php
$pageTitle = 'Dashboard';
$workers = getWorkers($pdo);
$jobs = getJobs($pdo);
$verifiedCount = count(array_filter($workers, fn($w) => $w['ndis_verified']));
$openJobs = count(array_filter($jobs, fn($j) => $j['status'] === 'open'));
require __DIR__ . '/../includes/layout_header.php';
?>
<div class="hero-gradient text-white px-6 py-12 md:py-16">
    <div class="max-w-4xl mx-auto text-center space-y-6">
        <h1 class="text-3xl md:text-4xl font-black tracking-tight" data-testid="text-hero-title">
            Your NDIS Support,<br><span class="text-map-gold">All in One Place</span>
        </h1>
        <p class="text-white/70 text-lg max-w-2xl mx-auto">Book carers, arrange transport, find jobs, and chat with our AI assistant — all aligned with your NDIS plan.</p>
        <form action="/care" method="get" class="max-w-xl mx-auto">
            <div class="flex bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
                <input type="search" name="q" placeholder="Search for support workers, services..." class="flex-1 bg-transparent text-white placeholder:text-white/50 outline-none text-sm" data-testid="input-hero-search">
                <button type="submit" class="btn btn-teal btn-sm rounded-full" data-testid="button-hero-search">Search</button>
            </div>
        </form>
    </div>
</div>

<div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/care" class="card text-center group" data-testid="card-quick-care">
            <div class="text-2xl mb-2">♥</div>
            <h3 class="font-semibold text-sm">Book a Carer</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Find verified workers</p>
        </a>
        <a href="/transport" class="card text-center group" data-testid="card-quick-transport">
            <div class="text-2xl mb-2">🚌</div>
            <h3 class="font-semibold text-sm">Get Transport</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Accessible rides</p>
        </a>
        <a href="/jobs" class="card text-center group" data-testid="card-quick-jobs">
            <div class="text-2xl mb-2">💼</div>
            <h3 class="font-semibold text-sm">Find a Job</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Support roles</p>
        </a>
        <a href="/chat" class="card text-center group" data-testid="card-quick-chat">
            <div class="text-2xl mb-2">🤖</div>
            <h3 class="font-semibold text-sm">MapAble Chat</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">AI assistant</p>
        </a>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card stat-card" data-testid="stat-jobs"><div class="stat-value"><?= $openJobs ?></div><div class="stat-label">Active Jobs</div></div>
        <div class="card stat-card" data-testid="stat-workers"><div class="stat-value"><?= count($workers) ?></div><div class="stat-label">Support Workers</div></div>
        <div class="card stat-card" data-testid="stat-verified"><div class="stat-value"><?= $verifiedCount ?></div><div class="stat-label">NDIS Verified</div></div>
        <div class="card stat-card" data-testid="stat-rating"><div class="stat-value">4.8</div><div class="stat-label">Avg Rating</div></div>
    </div>

    <section>
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold" data-testid="text-featured-workers">Featured Workers</h2>
            <a href="/care" class="text-map-blue text-sm font-medium" data-testid="link-view-all-workers">View All →</a>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <?php foreach (array_slice($workers, 0, 3) as $w): ?>
            <a href="/care/<?= h($w['id']) ?>" class="card" data-testid="card-worker-<?= h($w['id']) ?>">
                <div class="flex items-start gap-3">
                    <div class="w-12 h-12 rounded-full bg-map-blue/10 flex items-center justify-center text-map-blue font-bold text-lg shrink-0">
                        <?= strtoupper(substr($w['full_name'], 0, 1)) ?>
                    </div>
                    <div class="min-w-0">
                        <h3 class="font-semibold text-sm truncate"><?= h($w['full_name']) ?></h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate"><?= h($w['title']) ?></p>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="star-rating text-xs"><?= starRating((float)$w['rating']) ?></span>
                            <span class="text-xs text-gray-400">(<?= $w['review_count'] ?>)</span>
                        </div>
                        <div class="flex flex-wrap gap-1 mt-2">
                            <?php if ($w['ndis_verified']): ?><span class="badge badge-teal text-[10px]">NDIS Verified</span><?php endif; ?>
                            <?php if ($w['transport_capable']): ?><span class="badge badge-blue text-[10px]">Transport</span><?php endif; ?>
                            <?php if ($w['wheelchair_accessible']): ?><span class="badge badge-gold text-[10px]">Accessible</span><?php endif; ?>
                        </div>
                    </div>
                </div>
                <div class="mt-3 text-right">
                    <span class="text-sm font-bold text-map-blue"><?= formatCurrency($w['hourly_rate']) ?>/hr</span>
                </div>
            </a>
            <?php endforeach; ?>
        </div>
    </section>

    <section>
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold" data-testid="text-recent-jobs">Recent Jobs</h2>
            <a href="/jobs" class="text-map-blue text-sm font-medium" data-testid="link-view-all-jobs">View All →</a>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <?php foreach (array_slice($jobs, 0, 4) as $j): ?>
            <a href="/jobs/<?= h($j['id']) ?>" class="card" data-testid="card-job-<?= h($j['id']) ?>">
                <div class="flex items-start justify-between">
                    <div>
                        <h3 class="font-semibold text-sm"><?= h($j['title']) ?></h3>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1"><?= h($j['location']) ?> · <?= h($j['job_type']) ?></p>
                    </div>
                    <span class="badge badge-<?= match($j['category']) { 'Care' => 'teal', 'Transport' => 'blue', 'Employment' => 'gold', default => 'gray' } ?>"><?= h($j['category']) ?></span>
                </div>
                <?php if ($j['salary']): ?><p class="text-sm font-semibold text-map-teal mt-2"><?= h($j['salary']) ?></p><?php endif; ?>
            </a>
            <?php endforeach; ?>
        </div>
    </section>
</div>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
