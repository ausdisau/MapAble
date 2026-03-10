<?php
$pageTitle = 'Messages';
$userId = currentUserId();
$workers = getWorkers($pdo);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'send') {
    requireCsrf();
    createMessage($pdo, [
        'sender_id' => $userId,
        'receiver_id' => $_POST['receiver_id'],
        'body' => $_POST['body'],
    ]);
    setFlash('success', 'Message sent!');
    redirect('/messages?to=' . $_POST['receiver_id']);
}

$selectedReceiver = $_GET['to'] ?? '';
$allMessages = getMessages($pdo);
$myMessages = array_filter($allMessages, fn($m) => $m['sender_id'] === $userId || $m['receiver_id'] === $userId);

$conversations = [];
foreach ($myMessages as $m) {
    $otherId = $m['sender_id'] === $userId ? $m['receiver_id'] : $m['sender_id'];
    if (!isset($conversations[$otherId])) $conversations[$otherId] = [];
    $conversations[$otherId][] = $m;
}

$selectedMessages = $conversations[$selectedReceiver] ?? [];
usort($selectedMessages, fn($a, $b) => strcmp($a['timestamp'] ?? $a['created_at'] ?? '', $b['timestamp'] ?? $b['created_at'] ?? ''));

require __DIR__ . '/../includes/layout_header.php';
?>
<div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6" data-testid="text-page-title">Messages</h1>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6" style="min-height: 500px">
        <div class="card md:col-span-1 overflow-y-auto" style="max-height: 600px" data-testid="section-contacts">
            <h2 class="font-semibold mb-3 text-sm text-gray-500">Contacts</h2>
            <?php foreach ($workers as $w): ?>
            <a href="/messages?to=<?= h($w['user_id']) ?>"
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg min-h-[44px] mb-1
                      <?= $selectedReceiver === $w['user_id'] ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800' ?>"
               data-testid="link-contact-<?= h($w['id']) ?>">
                <div class="w-9 h-9 rounded-full bg-map-blue/10 flex items-center justify-center text-map-blue font-bold text-sm shrink-0">
                    <?= strtoupper(substr($w['full_name'], 0, 1)) ?>
                </div>
                <div class="min-w-0">
                    <p class="text-sm font-medium truncate"><?= h($w['full_name']) ?></p>
                    <p class="text-xs text-gray-400 truncate"><?= h($w['title']) ?></p>
                </div>
            </a>
            <?php endforeach; ?>
        </div>

        <div class="card md:col-span-2 flex flex-col" data-testid="section-conversation">
            <?php if ($selectedReceiver): ?>
                <?php
                $receiverUser = getUser($pdo, $selectedReceiver);
                $receiverName = $receiverUser ? $receiverUser['full_name'] : 'User';
                ?>
                <div class="border-b border-gray-100 dark:border-gray-800 pb-3 mb-3">
                    <h2 class="font-semibold"><?= h($receiverName) ?></h2>
                </div>

                <div class="flex-1 overflow-y-auto space-y-3 mb-4" style="max-height: 400px" data-testid="message-list">
                    <?php if (empty($selectedMessages)): ?>
                    <p class="text-sm text-gray-400 text-center py-8">No messages yet. Start a conversation!</p>
                    <?php endif; ?>
                    <?php foreach ($selectedMessages as $m): ?>
                    <div class="flex <?= $m['sender_id'] === $userId ? 'justify-end' : 'justify-start' ?>">
                        <div class="chat-bubble <?= $m['sender_id'] === $userId ? 'chat-user' : 'chat-assistant' ?>">
                            <p><?= h($m['body']) ?></p>
                            <p class="text-[10px] mt-1 opacity-60"><?= timeAgo($m['timestamp'] ?? $m['created_at'] ?? 'now') ?></p>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>

                <form method="POST" class="flex gap-2">
                    <?= csrfField() ?>
                    <input type="hidden" name="action" value="send">
                    <input type="hidden" name="receiver_id" value="<?= h($selectedReceiver) ?>">
                    <input type="text" name="body" class="input flex-1" placeholder="Type a message..." required data-testid="input-message-body">
                    <button type="submit" class="btn btn-primary" data-testid="button-send-message">Send</button>
                </form>
            <?php else: ?>
                <div class="flex-1 flex items-center justify-center text-gray-400">
                    <p>Select a contact to start messaging</p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
