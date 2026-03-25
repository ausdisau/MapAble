<?php
$pageTitle = 'Invoices';
$userId = currentUserId();
$invoices = getInvoices($pdo, $userId);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'generate') {
    requireCsrf();
    $invoice = generateInvoice($pdo, $userId, $_POST['period_start'], $_POST['period_end']);
    setFlash('success', 'Invoice generated: ' . formatCurrency($invoice['total_amount']));
    redirect('/invoices');
}

require __DIR__ . '/../includes/layout_header.php';
?>
<div class="max-w-5xl mx-auto px-4 py-8 space-y-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold" data-testid="text-page-title">Invoices</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Generate and view NDIS-compliant invoices</p>
        </div>
    </div>

    <div class="card" data-testid="section-generate-invoice">
        <h2 class="font-semibold mb-4">Generate Invoice</h2>
        <form method="POST" class="flex flex-wrap items-end gap-4">
            <?= csrfField() ?>
            <input type="hidden" name="action" value="generate">
            <div>
                <label class="label">Period Start</label>
                <input type="date" name="period_start" class="input" required value="<?= date('Y-m-01') ?>" data-testid="input-period-start">
            </div>
            <div>
                <label class="label">Period End</label>
                <input type="date" name="period_end" class="input" required value="<?= date('Y-m-t') ?>" data-testid="input-period-end">
            </div>
            <button type="submit" class="btn btn-primary" data-testid="button-generate-invoice">Generate Invoice</button>
        </form>
    </div>

    <?php if (empty($invoices)): ?>
    <div class="card text-center py-8">
        <p class="text-gray-400">No invoices yet. Generate one above to get started.</p>
    </div>
    <?php endif; ?>

    <?php foreach ($invoices as $inv): ?>
    <div class="card space-y-4" data-testid="card-invoice-<?= h($inv['id']) ?>">
        <div class="flex items-start justify-between">
            <div>
                <h3 class="font-semibold">Invoice</h3>
                <p class="text-xs text-gray-400 font-mono"><?= h(substr($inv['id'], 0, 8)) ?>...</p>
                <p class="text-sm text-gray-500 mt-1"><?= formatDate($inv['period_start']) ?> — <?= formatDate($inv['period_end']) ?></p>
            </div>
            <div class="text-right">
                <?php
                $invGst = (float)($inv['gst_amount'] ?? 0);
                $invTotalIncGst = (float)($inv['total_inc_gst'] ?? $inv['total_amount']);
                ?>
                <?php if ($invGst > 0): ?>
                <p class="text-sm text-gray-500 dark:text-gray-400" data-testid="text-subtotal-<?= h($inv['id']) ?>">Subtotal: <?= formatCurrency($inv['total_amount']) ?></p>
                <p class="text-sm text-gray-500 dark:text-gray-400" data-testid="text-gst-<?= h($inv['id']) ?>">GST (10%): <?= formatCurrency($invGst) ?></p>
                <p class="text-xl font-bold text-map-blue" data-testid="text-total-<?= h($inv['id']) ?>"><?= formatCurrency($invTotalIncGst) ?> <span class="text-xs font-normal text-gray-400">inc. GST</span></p>
                <?php else: ?>
                <p class="text-xl font-bold text-map-blue" data-testid="text-total-<?= h($inv['id']) ?>"><?= formatCurrency($inv['total_amount']) ?></p>
                <p class="text-xs text-map-teal" data-testid="text-gst-free-<?= h($inv['id']) ?>">GST-Free (NDIS)</p>
                <?php endif; ?>
                <span class="badge badge-<?= match($inv['status']) { 'paid' => 'teal', 'submitted' => 'blue', default => 'gold' } ?>"><?= ucfirst($inv['status']) ?></span>
            </div>
        </div>

        <?php
        $lineItems = json_decode($inv['line_items'] ?? '[]', true);
        if ($lineItems):
        ?>
        <details class="border-t border-gray-100 dark:border-gray-800 pt-3">
            <summary class="text-sm font-medium text-map-blue cursor-pointer" data-testid="button-expand-invoice-<?= h($inv['id']) ?>">View Line Items (<?= count($lineItems) ?>)</summary>
            <div class="mt-3 overflow-x-auto">
                <table class="w-full text-sm">
                    <thead><tr class="border-b border-gray-200 dark:border-gray-700">
                        <th class="text-left py-2 font-medium text-gray-500">Description</th>
                        <th class="text-left py-2 font-medium text-gray-500">NDIS Code</th>
                        <th class="text-right py-2 font-medium text-gray-500">Qty</th>
                        <th class="text-right py-2 font-medium text-gray-500">Rate</th>
                        <th class="text-right py-2 font-medium text-gray-500">Ex-GST</th>
                        <th class="text-right py-2 font-medium text-gray-500">GST</th>
                        <th class="text-right py-2 font-medium text-gray-500">Total</th>
                    </tr></thead>
                    <tbody>
                    <?php foreach ($lineItems as $li): ?>
                    <tr class="border-b border-gray-100 dark:border-gray-800">
                        <td class="py-2"><?= h($li['description'] ?? '') ?></td>
                        <td class="py-2 font-mono text-xs"><?= h($li['ndisItemCode'] ?? '') ?></td>
                        <td class="py-2 text-right"><?= number_format($li['quantity'] ?? 0, 1) ?> <?= h($li['unit'] ?? '') ?></td>
                        <td class="py-2 text-right"><?= formatCurrency($li['rate'] ?? 0) ?></td>
                        <td class="py-2 text-right"><?= formatCurrency($li['subtotal'] ?? 0) ?></td>
                        <td class="py-2 text-right">
                            <?php if (!empty($li['gst_free'])): ?>
                            <span class="text-map-teal text-xs">Free</span>
                            <?php else: ?>
                            <?= formatCurrency($li['gst_amount'] ?? 0) ?>
                            <?php endif; ?>
                        </td>
                        <td class="py-2 text-right font-semibold"><?= formatCurrency($li['total_inc_gst'] ?? $li['subtotal'] ?? 0) ?></td>
                    </tr>
                    <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </details>
        <?php endif; ?>

        <div class="text-xs text-gray-400 space-y-0.5">
            <p>NDIS Claimable (ex-GST): <?= formatCurrency($inv['ndis_claimable'] ?? $inv['total_amount']) ?> · Generated: <?= formatDateTime($inv['generated_at']) ?></p>
            <?php if ($invGst > 0): ?>
            <p class="text-gray-500 dark:text-gray-400">Note: GST of <?= formatCurrency($invGst) ?> applies to transport services. NDIS disability support services are GST-free under Division 38 of the GST Act.</p>
            <?php else: ?>
            <p class="text-map-teal">All items on this invoice are GST-free NDIS disability supports.</p>
            <?php endif; ?>
        </div>
    </div>
    <?php endforeach; ?>
</div>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
