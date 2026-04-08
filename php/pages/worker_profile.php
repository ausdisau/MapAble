<?php
$pageTitle = 'Worker Profile';
$userId = currentUserId();
$worker = getWorkerByUserId($pdo, $userId);
if (!$worker) {
    setFlash('error', 'Worker profile not found.');
    redirect('/settings');
}

$specializations = pgArrayToPhp($worker['specializations'] ?? '');
$complianceAlerts = getWorkerComplianceAlerts($pdo, $worker['id']);

$allSpecializations = [
    'Personal Care', 'Domestic Assistance', 'Community Access', 'Transport',
    'Meal Preparation', 'Medication Support', 'Physiotherapy', 'Occupational Therapy',
    'Speech Therapy', 'Behavioural Support', 'Nursing', 'Respite Care',
    'Social Support', 'Group Activities', 'Auslan Interpreter', 'Cultural Safety',
    'Recreation', 'Active Support', 'Skill Building', 'Employment Support',
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrf();
    $action = $_POST['action'] ?? 'update_profile';

    if ($action === 'update_profile') {
        $data = [
            'title' => trim($_POST['title'] ?? ''),
            'bio' => trim($_POST['bio'] ?? ''),
            'languages' => trim($_POST['languages'] ?? ''),
            'phone_number' => trim($_POST['phone_number'] ?? ''),
            'hourly_rate' => (float)($_POST['hourly_rate'] ?? 0),
            'transport_capable' => !empty($_POST['transport_capable']),
            'transport_type' => trim($_POST['transport_type'] ?? ''),
            'wheelchair_accessible' => !empty($_POST['wheelchair_accessible']),
            'specializations' => $_POST['specializations'] ?? [],
        ];
        updateWorkerProfile($pdo, $worker['id'], $data);
        setFlash('success', 'Profile updated successfully.');
        redirect('/worker/profile');
    }

    if ($action === 'update_photo' && !empty($_FILES['photo']['tmp_name'])) {
        $file = $_FILES['photo'];
        $allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (in_array($file['type'], $allowed) && $file['size'] < 5 * 1024 * 1024) {
            $photoData = 'data:' . $file['type'] . ';base64,' . base64_encode(file_get_contents($file['tmp_name']));
            updateWorkerPhoto($pdo, $worker['id'], $photoData);
            setFlash('success', 'Photo updated successfully.');
        } else {
            setFlash('error', 'Invalid photo. Use JPG, PNG, or WebP under 5MB.');
        }
        redirect('/worker/profile');
    }
}

require __DIR__ . '/../includes/layout_header.php';
?>

<div class="max-w-4xl mx-auto px-4 py-6 space-y-6">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold" data-testid="text-worker-profile-title">Worker Profile</h1>
    </div>

    <div class="card">
        <div class="flex flex-col md:flex-row gap-6">
            <div class="flex flex-col items-center gap-3">
                <div class="w-28 h-28 rounded-xl overflow-hidden bg-map-blue/10 flex items-center justify-center" data-testid="img-worker-avatar">
                    <?php if ($worker['photo']): ?>
                        <img src="<?= h($worker['photo']) ?>" alt="Profile photo" class="w-full h-full object-cover">
                    <?php else: ?>
                        <span class="text-4xl font-bold text-map-blue"><?= strtoupper(substr($worker['full_name'], 0, 1)) ?></span>
                    <?php endif; ?>
                </div>
                <form method="POST" enctype="multipart/form-data" class="w-full">
                    <?= csrfField() ?>
                    <input type="hidden" name="action" value="update_photo">
                    <label for="photo-upload" class="btn btn-outline btn-xs w-full text-center cursor-pointer block" data-testid="button-change-photo">
                        <i class="icon-camera w-3 h-3" aria-hidden="true"></i> Change Photo
                    </label>
                    <input type="file" id="photo-upload" name="photo" accept="image/jpeg,image/png,image/webp" class="hidden" onchange="this.form.submit()" aria-label="Upload profile photo">
                </form>
            </div>

            <div class="flex-1">
                <h2 class="text-xl font-bold" data-testid="text-worker-name"><?= h($worker['full_name']) ?></h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">@<?= h($worker['username']) ?></p>
                <div class="flex flex-wrap gap-2 mt-2">
                    <?php if ($worker['ndis_verified']): ?>
                    <span class="badge badge-teal" data-testid="badge-ndis-verified"><i class="icon-shield-check w-3 h-3" aria-hidden="true"></i> NDIS Verified</span>
                    <?php endif; ?>
                    <?php if ($worker['abn_verified']): ?>
                    <span class="badge badge-blue" data-testid="badge-abn-verified"><i class="icon-check-circle w-3 h-3" aria-hidden="true"></i> ABN Verified</span>
                    <?php endif; ?>
                    <span class="badge badge-gold" data-testid="badge-rating">
                        <?= starRating((float)$worker['rating']) ?> (<?= $worker['review_count'] ?> reviews)
                    </span>
                </div>
                <?php if ($worker['abn']): ?>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2" data-testid="text-worker-abn">
                    ABN: <?= h($worker['abn']) ?>
                    <?php if ($worker['abn_verified']): ?>
                        <i class="icon-check-circle w-3 h-3 text-map-teal inline" aria-hidden="true"></i>
                    <?php endif; ?>
                    <a href="/abn-lookup" class="ml-2 text-map-blue hover:underline text-xs" data-testid="link-abn-lookup">ABN Lookup &rarr;</a>
                </p>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <form method="POST" class="space-y-6" novalidate>
        <?= csrfField() ?>
        <input type="hidden" name="action" value="update_profile">

        <fieldset class="card">
            <legend class="text-lg font-bold mb-4 px-1">Professional Details</legend>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label for="prof-title" class="label" id="label-title">Job Title</label>
                    <input type="text" id="prof-title" name="title" value="<?= h($worker['title']) ?>" class="input w-full"
                        aria-required="true" aria-labelledby="label-title" data-testid="input-worker-title">
                </div>
                <div>
                    <label for="prof-rate" class="label" id="label-rate">Hourly Rate ($)</label>
                    <input type="number" id="prof-rate" name="hourly_rate" value="<?= h($worker['hourly_rate']) ?>" step="0.01" min="0" class="input w-full"
                        aria-required="true" aria-labelledby="label-rate" data-testid="input-worker-rate">
                </div>
                <div>
                    <label for="prof-phone" class="label" id="label-phone">Phone Number</label>
                    <input type="tel" id="prof-phone" name="phone_number" value="<?= h($worker['phone_number'] ?? '') ?>" class="input w-full"
                        aria-labelledby="label-phone" data-testid="input-worker-phone">
                </div>
                <div>
                    <label for="prof-languages" class="label" id="label-languages">Languages</label>
                    <input type="text" id="prof-languages" name="languages" value="<?= h($worker['languages'] ?? '') ?>" class="input w-full"
                        placeholder="e.g. English, Auslan, Mandarin"
                        aria-labelledby="label-languages" data-testid="input-worker-languages">
                </div>
                <div class="md:col-span-2">
                    <label for="prof-bio" class="label" id="label-bio">Bio</label>
                    <textarea id="prof-bio" name="bio" rows="4" class="input w-full"
                        aria-labelledby="label-bio" data-testid="input-worker-bio"><?= h($worker['bio'] ?? '') ?></textarea>
                </div>
            </div>
        </fieldset>

        <fieldset class="card">
            <legend class="text-lg font-bold mb-4 px-1">Specialisations</legend>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                <?php foreach ($allSpecializations as $spec): ?>
                <label class="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[44px] text-sm"
                    data-testid="checkbox-spec-<?= strtolower(str_replace(' ', '-', $spec)) ?>">
                    <input type="checkbox" name="specializations[]" value="<?= h($spec) ?>"
                        <?= in_array($spec, $specializations) ? 'checked' : '' ?>
                        class="rounded border-gray-300 text-map-blue focus:ring-map-blue">
                    <span><?= h($spec) ?></span>
                </label>
                <?php endforeach; ?>
            </div>
        </fieldset>

        <fieldset class="card">
            <legend class="text-lg font-bold mb-4 px-1">Transport & Accessibility</legend>
            <div class="space-y-3">
                <label class="flex items-center gap-3 min-h-[44px] cursor-pointer" data-testid="checkbox-transport-capable">
                    <input type="checkbox" name="transport_capable" value="1"
                        <?= $worker['transport_capable'] ? 'checked' : '' ?>
                        class="rounded border-gray-300 text-map-blue focus:ring-map-blue"
                        onchange="document.getElementById('transport-type-row').classList.toggle('hidden', !this.checked)">
                    <span class="text-sm font-medium">I can provide transport services</span>
                </label>
                <div id="transport-type-row" class="ml-8 <?= $worker['transport_capable'] ? '' : 'hidden' ?>">
                    <label for="prof-transport-type" class="label">Transport Type</label>
                    <select id="prof-transport-type" name="transport_type" class="input w-full max-w-xs" data-testid="select-transport-type">
                        <option value="">Select...</option>
                        <option value="sedan" <?= ($worker['transport_type'] ?? '') === 'sedan' ? 'selected' : '' ?>>Sedan</option>
                        <option value="suv" <?= ($worker['transport_type'] ?? '') === 'suv' ? 'selected' : '' ?>>SUV</option>
                        <option value="van" <?= ($worker['transport_type'] ?? '') === 'van' ? 'selected' : '' ?>>Van</option>
                        <option value="wheelchair_accessible" <?= ($worker['transport_type'] ?? '') === 'wheelchair_accessible' ? 'selected' : '' ?>>Wheelchair Accessible Vehicle</option>
                    </select>
                </div>
                <label class="flex items-center gap-3 min-h-[44px] cursor-pointer" data-testid="checkbox-wheelchair-accessible">
                    <input type="checkbox" name="wheelchair_accessible" value="1"
                        <?= $worker['wheelchair_accessible'] ? 'checked' : '' ?>
                        class="rounded border-gray-300 text-map-blue focus:ring-map-blue">
                    <span class="text-sm font-medium">Wheelchair accessible service available</span>
                </label>
            </div>
        </fieldset>

        <fieldset class="card">
            <legend class="text-lg font-bold mb-4 px-1">Compliance Documents</legend>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <?php
                $complianceDocs = [
                    ['label' => 'WWCC Number', 'key' => 'wwcc_number', 'type' => 'text'],
                    ['label' => 'WWCC Expiry', 'key' => 'wwcc_expiry', 'type' => 'date'],
                    ['label' => 'First Aid Expiry', 'key' => 'first_aid_expiry', 'type' => 'date'],
                    ['label' => 'Insurance Expiry', 'key' => 'insurance_expiry', 'type' => 'date'],
                    ['label' => 'Screening Number', 'key' => 'screening_number', 'type' => 'text'],
                    ['label' => 'Screening Expiry', 'key' => 'screening_expiry', 'type' => 'date'],
                ];
                foreach ($complianceDocs as $doc):
                    $val = $worker[$doc['key']] ?? '';
                    $alertLevel = '';
                    foreach ($complianceAlerts as $a) {
                        if ($a['field'] === $doc['key']) {
                            $alertLevel = $a['level'];
                            break;
                        }
                    }
                    $borderClass = match($alertLevel) {
                        'expired' => 'border-red-400 dark:border-red-600',
                        'warning' => 'border-yellow-400 dark:border-yellow-600',
                        default => 'border-gray-200 dark:border-gray-700',
                    };
                ?>
                <div class="p-3 rounded-lg border <?= $borderClass ?>">
                    <label for="comp-<?= $doc['key'] ?>" class="label flex items-center gap-2">
                        <?= h($doc['label']) ?>
                        <?php if ($alertLevel === 'expired'): ?>
                            <span class="badge badge-red text-[10px]"><i class="icon-x-circle w-3 h-3" aria-hidden="true"></i> Expired</span>
                        <?php elseif ($alertLevel === 'warning'): ?>
                            <span class="badge badge-gold text-[10px]"><i class="icon-alert-circle w-3 h-3" aria-hidden="true"></i> Expiring Soon</span>
                        <?php elseif ($val): ?>
                            <span class="badge badge-teal text-[10px]"><i class="icon-check-circle w-3 h-3" aria-hidden="true"></i> Valid</span>
                        <?php endif; ?>
                    </label>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1" data-testid="text-comp-<?= $doc['key'] ?>">
                        <?= $val ? h($doc['type'] === 'date' ? formatDate($val) : $val) : '<span class="text-gray-400 italic">Not provided</span>' ?>
                    </p>
                </div>
                <?php endforeach; ?>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">
                <i class="icon-info w-3 h-3 inline" aria-hidden="true"></i>
                Compliance documents are managed by your provider. Contact MapAble Services to update these details.
            </p>
        </fieldset>

        <div class="flex justify-end">
            <button type="submit" class="btn btn-blue min-h-[44px] px-8" data-testid="button-save-profile">
                <i class="icon-save w-4 h-4" aria-hidden="true"></i> Save Changes
            </button>
        </div>
    </form>
</div>

<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
