<?php
$pageTitle = 'Pricing';
$careTiers = [
    ['name' => 'Basic Care', 'rate' => '$70.23/hr', 'range' => '0–10 hours/month', 'code' => '01_011_0107_1_1', 'color' => 'teal'],
    ['name' => 'Standard Care', 'rate' => '$68.00/hr', 'range' => '11–30 hours/month', 'code' => '01_011_0107_1_1', 'color' => 'blue'],
    ['name' => 'High Support', 'rate' => '$65.00/hr', 'range' => '31+ hours/month', 'code' => '01_011_0107_1_1', 'color' => 'gold'],
    ['name' => 'Complex Care', 'rate' => '$85.00/hr', 'range' => 'Specialist support', 'code' => '01_015_0107_1_1', 'color' => 'red'],
];
$transportTiers = [
    ['name' => 'Basic Mobility', 'rate' => '$0.99/km', 'range' => '0–100 km/month', 'code' => '02_051_0108_1_1', 'color' => 'teal'],
    ['name' => 'Standard Mobility', 'rate' => '$0.90/km', 'range' => '101–300 km/month', 'code' => '02_051_0108_1_1', 'color' => 'blue'],
    ['name' => 'High Mobility', 'rate' => '$0.85/km', 'range' => '301+ km/month', 'code' => '02_051_0108_1_1', 'color' => 'gold'],
    ['name' => 'Accessible Vehicle', 'rate' => '+$0.15/km', 'range' => 'Wheelchair capable', 'code' => '02_051_0108_1_1', 'color' => 'red'],
];
require __DIR__ . '/../includes/layout_header.php';
?>
<div class="max-w-7xl mx-auto px-4 py-8 space-y-10">
    <div class="text-center space-y-2">
        <h1 class="text-2xl font-bold" data-testid="text-page-title">NDIS Pricing</h1>
        <p class="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Transparent, NDIS-compliant pricing with volume-based tiers. All rates align with the NDIS Price Guide.</p>
    </div>

    <section>
        <h2 class="text-xl font-bold mb-4 flex items-center gap-2" data-testid="text-care-tiers">
            <span class="text-map-teal">♥</span> Care Services
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <?php foreach ($careTiers as $i => $t): ?>
            <div class="card text-center space-y-3 <?= $i === 1 ? 'ring-2 ring-map-blue' : '' ?>" data-testid="card-care-tier-<?= $i ?>">
                <?php if ($i === 1): ?><span class="badge badge-blue text-[10px] mx-auto">Most Popular</span><?php endif; ?>
                <h3 class="font-bold text-lg"><?= $t['name'] ?></h3>
                <p class="text-2xl font-black text-map-<?= $t['color'] ?>"><?= $t['rate'] ?></p>
                <p class="text-sm text-gray-500 dark:text-gray-400"><?= $t['range'] ?></p>
                <div class="pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p class="text-[10px] text-gray-400 font-mono">NDIS: <?= $t['code'] ?></p>
                </div>
                <div class="flex items-center justify-center gap-1.5 text-xs text-map-teal">
                    <span>✓</span> <span>NDIS Compliant</span>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </section>

    <section>
        <h2 class="text-xl font-bold mb-4 flex items-center gap-2" data-testid="text-transport-tiers">
            <span class="text-map-blue">🚌</span> Transport Services
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <?php foreach ($transportTiers as $i => $t): ?>
            <div class="card text-center space-y-3" data-testid="card-transport-tier-<?= $i ?>">
                <h3 class="font-bold text-lg"><?= $t['name'] ?></h3>
                <p class="text-2xl font-black text-map-<?= $t['color'] ?>"><?= $t['rate'] ?></p>
                <p class="text-sm text-gray-500 dark:text-gray-400"><?= $t['range'] ?></p>
                <div class="pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p class="text-[10px] text-gray-400 font-mono">NDIS: <?= $t['code'] ?></p>
                </div>
                <div class="flex items-center justify-center gap-1.5 text-xs text-map-teal">
                    <span>✓</span> <span>NDIS Compliant</span>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </section>

    <div class="card bg-map-blue/5 dark:bg-map-blue/10 border-map-blue/20">
        <div class="flex items-start gap-3">
            <span class="text-map-blue text-lg">ℹ</span>
            <div class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p class="font-semibold">How Tier Pricing Works</p>
                <p>Your rate is automatically calculated based on your monthly usage. As you use more hours or travel more kilometers, you move into lower-cost tiers — saving you money while maximizing your NDIS budget.</p>
                <p>All charges are NDIS-compliant and can be claimed directly through your plan.</p>
            </div>
        </div>
    </div>
</div>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
