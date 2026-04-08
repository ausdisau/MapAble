<?php
$pageTitle = 'Availability';
$userId = currentUserId();
$worker = getWorkerByUserId($pdo, $userId);
if (!$worker) {
    setFlash('error', 'Worker profile not found.');
    redirect('/settings');
}

$availability = getWorkerAvailability($pdo, $worker['id']);
$blockouts = getWorkerBlockouts($pdo, $worker['id']);

$dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCsrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'save_availability') {
        $slots = [];
        for ($day = 0; $day < 7; $day++) {
            $starts = $_POST['start_time'][$day] ?? [];
            $ends = $_POST['end_time'][$day] ?? [];
            foreach ($starts as $i => $start) {
                $end = $ends[$i] ?? '';
                if ($start && $end && $start < $end) {
                    $slots[] = ['day_of_week' => $day, 'start_time' => $start, 'end_time' => $end];
                }
            }
        }
        setWorkerAvailability($pdo, $worker['id'], $slots);
        setFlash('success', 'Availability updated successfully.');
        redirect('/worker/availability');
    }

    if ($action === 'add_blockout') {
        $date = $_POST['blockout_date'] ?? '';
        $reason = trim($_POST['blockout_reason'] ?? '');
        if ($date) {
            addWorkerBlockout($pdo, $worker['id'], $date, $reason);
            setFlash('success', 'Blockout date added.');
        }
        redirect('/worker/availability');
    }

    if ($action === 'remove_blockout') {
        $blockoutId = $_POST['blockout_id'] ?? '';
        if ($blockoutId) {
            removeWorkerBlockout($pdo, $blockoutId);
            setFlash('success', 'Blockout date removed.');
        }
        redirect('/worker/availability');
    }
}

$slotsByDay = [];
for ($d = 0; $d < 7; $d++) $slotsByDay[$d] = [];
foreach ($availability as $slot) {
    $slotsByDay[(int)$slot['day_of_week']][] = $slot;
}

require __DIR__ . '/../includes/layout_header.php';
?>

<div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold" data-testid="text-availability-title">Availability</h1>
    </div>

    <form method="POST">
        <?= csrfField() ?>
        <input type="hidden" name="action" value="save_availability">

        <div class="card">
            <h2 class="text-lg font-bold mb-4">Weekly Recurring Schedule</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Set your regular availability for each day of the week. You can add multiple time slots per day.</p>

            <div class="space-y-4" role="grid" aria-label="Weekly availability grid">
                <?php for ($day = 0; $day < 7; $day++):
                    $slots = $slotsByDay[$day];
                    if (empty($slots)) $slots = [['start_time' => '', 'end_time' => '']];
                ?>
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4" role="row" aria-label="<?= $dayNames[$day] ?> availability" data-testid="row-day-<?= $day ?>">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="font-semibold text-sm" role="rowheader"><?= $dayNames[$day] ?></h3>
                        <button type="button" onclick="addTimeSlot(this, <?= $day ?>)" class="text-map-blue text-xs font-medium min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Add time slot for <?= $dayNames[$day] ?>" data-testid="button-add-slot-<?= $day ?>">
                            <i class="icon-plus w-4 h-4" aria-hidden="true"></i> Add Slot
                        </button>
                    </div>
                    <div class="slots-container space-y-2" data-day="<?= $day ?>">
                        <?php foreach ($slots as $idx => $slot): ?>
                        <div class="flex items-center gap-2 slot-row" role="gridcell">
                            <label class="sr-only" for="start-<?= $day ?>-<?= $idx ?>">Start time for <?= $dayNames[$day] ?></label>
                            <input type="time" id="start-<?= $day ?>-<?= $idx ?>" name="start_time[<?= $day ?>][]" value="<?= h($slot['start_time']) ?>"
                                class="input flex-1" aria-label="Start time" data-testid="input-start-<?= $day ?>-<?= $idx ?>">
                            <span class="text-gray-400 text-sm" aria-hidden="true">to</span>
                            <label class="sr-only" for="end-<?= $day ?>-<?= $idx ?>">End time for <?= $dayNames[$day] ?></label>
                            <input type="time" id="end-<?= $day ?>-<?= $idx ?>" name="end_time[<?= $day ?>][]" value="<?= h($slot['end_time']) ?>"
                                class="input flex-1" aria-label="End time" data-testid="input-end-<?= $day ?>-<?= $idx ?>">
                            <button type="button" onclick="this.closest('.slot-row').remove()" class="text-red-400 hover:text-red-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                aria-label="Remove this time slot" data-testid="button-remove-slot-<?= $day ?>-<?= $idx ?>">
                                <i class="icon-trash-2 w-4 h-4" aria-hidden="true"></i>
                            </button>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endfor; ?>
            </div>

            <div class="flex justify-end mt-6">
                <button type="submit" class="btn btn-blue min-h-[44px] px-8" data-testid="button-save-availability">
                    <i class="icon-save w-4 h-4" aria-hidden="true"></i> Save Availability
                </button>
            </div>
        </div>
    </form>

    <div class="card">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold" data-testid="text-blockouts-title">Blockout Dates</h2>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Block specific dates when you are unavailable (holidays, appointments, etc.).</p>

        <form method="POST" class="flex flex-col md:flex-row gap-3 mb-4">
            <?= csrfField() ?>
            <input type="hidden" name="action" value="add_blockout">
            <div class="flex-1">
                <label for="blockout-date" class="label">Date</label>
                <input type="date" id="blockout-date" name="blockout_date" min="<?= date('Y-m-d') ?>" required
                    class="input w-full" aria-required="true" data-testid="input-blockout-date">
            </div>
            <div class="flex-1">
                <label for="blockout-reason" class="label">Reason (optional)</label>
                <input type="text" id="blockout-reason" name="blockout_reason" class="input w-full"
                    placeholder="e.g. Holiday, Doctor's appointment" data-testid="input-blockout-reason">
            </div>
            <div class="flex items-end">
                <button type="submit" class="btn btn-teal min-h-[44px]" data-testid="button-add-blockout">
                    <i class="icon-plus w-4 h-4" aria-hidden="true"></i> Add Blockout
                </button>
            </div>
        </form>

        <?php if (empty($blockouts)): ?>
        <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-4" data-testid="text-no-blockouts">No blockout dates set</p>
        <?php else: ?>
        <div class="space-y-2">
            <?php foreach ($blockouts as $bo): ?>
            <div class="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800" data-testid="row-blockout-<?= h($bo['id']) ?>">
                <div>
                    <span class="font-medium text-sm"><?= formatDate($bo['date']) ?></span>
                    <?php if ($bo['reason']): ?>
                        <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">— <?= h($bo['reason']) ?></span>
                    <?php endif; ?>
                </div>
                <form method="POST" class="inline">
                    <?= csrfField() ?>
                    <input type="hidden" name="action" value="remove_blockout">
                    <input type="hidden" name="blockout_id" value="<?= h($bo['id']) ?>">
                    <button type="submit" class="text-red-400 hover:text-red-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Remove blockout on <?= formatDate($bo['date']) ?>" data-testid="button-remove-blockout-<?= h($bo['id']) ?>">
                        <i class="icon-trash-2 w-4 h-4" aria-hidden="true"></i>
                    </button>
                </form>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </div>
</div>

<script>
function addTimeSlot(btn, day) {
    const container = btn.closest('[data-testid]').querySelector('.slots-container');
    const count = container.querySelectorAll('.slot-row').length;
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 slot-row';
    row.setAttribute('role', 'gridcell');
    row.innerHTML = `
        <label class="sr-only" for="start-${day}-${count}">Start time</label>
        <input type="time" id="start-${day}-${count}" name="start_time[${day}][]" class="input flex-1" aria-label="Start time" data-testid="input-start-${day}-${count}">
        <span class="text-gray-400 text-sm" aria-hidden="true">to</span>
        <label class="sr-only" for="end-${day}-${count}">End time</label>
        <input type="time" id="end-${day}-${count}" name="end_time[${day}][]" class="input flex-1" aria-label="End time" data-testid="input-end-${day}-${count}">
        <button type="button" onclick="this.closest('.slot-row').remove()" class="text-red-400 hover:text-red-600 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Remove this time slot" data-testid="button-remove-slot-${day}-${count}">
            <i class="icon-trash-2 w-4 h-4" aria-hidden="true"></i>
        </button>
    `;
    container.appendChild(row);
    row.querySelector('input[type="time"]').focus();
}
</script>

<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
