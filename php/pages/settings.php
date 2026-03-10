<?php
$pageTitle = 'Settings';
$user = currentUser($pdo);
$userId = currentUserId();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrf();
    $action = $_POST['action'] ?? '';
    if ($action === 'update_profile') {
        updateUserProfile($pdo, $userId, [
            'full_name' => $_POST['full_name'],
            'email' => $_POST['email'],
            'location' => $_POST['location'] ?? '',
        ]);
        setFlash('success', 'Profile updated!');
        redirect('/settings');
    }
    if ($action === 'update_access') {
        upsertAccessProfile($pdo, $userId, [
            'mobility_aids' => array_filter(explode(',', $_POST['mobility_aids'] ?? '')),
            'max_transfer_m' => (int)($_POST['max_transfer_m'] ?? 200),
            'stairs_allowed' => !empty($_POST['stairs_allowed']),
            'communication_mode' => $_POST['communication_mode'] ?? 'text',
        ]);
        setFlash('success', 'Access profile updated!');
        redirect('/settings');
    }
}

$accessProfile = getAccessProfile($pdo, $userId);

require __DIR__ . '/../includes/layout_header.php';
?>
<div class="max-w-3xl mx-auto px-4 py-8 space-y-8">
    <h1 class="text-2xl font-bold" data-testid="text-page-title">Settings</h1>

    <div class="card" data-testid="section-profile">
        <h2 class="font-semibold mb-4">Profile</h2>
        <form method="POST" class="space-y-4">
            <?= csrfField() ?>
            <input type="hidden" name="action" value="update_profile">
            <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-full bg-map-blue/10 flex items-center justify-center text-map-blue font-bold text-2xl">
                    <?= strtoupper(substr($user['full_name'], 0, 1)) ?>
                </div>
                <div>
                    <p class="font-semibold" data-testid="text-user-name"><?= h($user['full_name']) ?></p>
                    <p class="text-sm text-gray-500"><?= h($user['role']) ?></p>
                    <?php if ($user['ndis_number']): ?>
                    <p class="text-xs text-gray-400 font-mono" data-testid="text-ndis-number">NDIS: <?= h($user['ndis_number']) ?></p>
                    <?php endif; ?>
                </div>
            </div>
            <div>
                <label class="label">Full Name</label>
                <input type="text" name="full_name" class="input" value="<?= h($user['full_name']) ?>" required data-testid="input-full-name">
            </div>
            <div>
                <label class="label">Email</label>
                <input type="email" name="email" class="input" value="<?= h($user['email']) ?>" required data-testid="input-email">
            </div>
            <div>
                <label class="label">Location</label>
                <input type="text" name="location" class="input" value="<?= h($user['location'] ?? '') ?>" placeholder="City, State" data-testid="input-location">
            </div>
            <button type="submit" class="btn btn-primary" data-testid="button-save-profile">Save Changes</button>
        </form>
    </div>

    <div class="card" data-testid="section-accessibility">
        <h2 class="font-semibold mb-4">Accessibility</h2>
        <div class="space-y-4">
            <label class="flex items-center justify-between min-h-[44px] cursor-pointer" data-testid="toggle-dark-mode">
                <span class="text-sm font-medium">Dark Mode</span>
                <button type="button" onclick="toggleTheme()" class="btn btn-outline btn-sm">Toggle</button>
            </label>
            <label class="flex items-center justify-between min-h-[44px] cursor-pointer" data-testid="toggle-high-contrast">
                <span class="text-sm font-medium">High Contrast</span>
                <input type="checkbox" class="w-5 h-5 rounded" onchange="document.body.classList.toggle('high-contrast', this.checked); localStorage.setItem('highContrast', this.checked)">
            </label>
            <label class="flex items-center justify-between min-h-[44px] cursor-pointer" data-testid="toggle-easy-read">
                <span class="text-sm font-medium">Easy Read (Larger Text)</span>
                <input type="checkbox" class="w-5 h-5 rounded" onchange="document.body.style.fontSize = this.checked ? '18px' : ''; localStorage.setItem('easyRead', this.checked)">
            </label>
        </div>
    </div>

    <div class="card" data-testid="section-access-profile">
        <h2 class="font-semibold mb-4">Access Profile</h2>
        <p class="text-sm text-gray-500 mb-4">Configure your mobility and accessibility needs. This helps our AI chatbot provide personalized transport recommendations.</p>
        <form method="POST" class="space-y-4">
            <?= csrfField() ?>
            <input type="hidden" name="action" value="update_access">
            <div>
                <label class="label">Mobility Aids (comma separated)</label>
                <input type="text" name="mobility_aids" class="input" value="<?= h(implode(',', json_decode($accessProfile['mobility_aids'] ?? '[]', true) ?: [])) ?>" placeholder="e.g. wheelchair, walker" data-testid="input-mobility-aids">
            </div>
            <div>
                <label class="label">Maximum Transfer Distance (meters)</label>
                <input type="number" name="max_transfer_m" class="input" value="<?= h($accessProfile['max_transfer_m'] ?? 200) ?>" data-testid="input-max-transfer">
            </div>
            <label class="flex items-center gap-2 min-h-[44px] cursor-pointer">
                <input type="checkbox" name="stairs_allowed" value="1" class="w-5 h-5 rounded"
                    <?= ($accessProfile['stairs_allowed'] ?? true) ? 'checked' : '' ?> data-testid="input-stairs-allowed">
                <span class="text-sm">Can use stairs</span>
            </label>
            <div>
                <label class="label">Communication Mode</label>
                <select name="communication_mode" class="input" data-testid="select-communication-mode">
                    <?php foreach (['text', 'voice', 'auslan', 'easy_read', 'symbol'] as $mode): ?>
                    <option value="<?= $mode ?>" <?= ($accessProfile['communication_mode'] ?? 'text') === $mode ? 'selected' : '' ?>><?= ucfirst(str_replace('_', ' ', $mode)) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <button type="submit" class="btn btn-teal" data-testid="button-save-access">Save Access Profile</button>
        </form>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('highContrast') === 'true') {
        document.body.classList.add('high-contrast');
        document.querySelector('[data-testid="toggle-high-contrast"] input').checked = true;
    }
    if (localStorage.getItem('easyRead') === 'true') {
        document.body.style.fontSize = '18px';
        document.querySelector('[data-testid="toggle-easy-read"] input').checked = true;
    }
});
</script>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
