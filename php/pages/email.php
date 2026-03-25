<?php
$pageTitle = 'Email';
$userId = currentUserId();
$user = currentUser($pdo);

$agentmailBase = 'http://127.0.0.1:3001';

function emailApiCall($base, $path, $method = 'GET', $body = null) {
    $ch = curl_init($base . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    ]);
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($body) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($err) return ['error' => $err, '_status' => 0];
    $data = json_decode($response, true) ?? [];
    $data['_status'] = $httpCode;
    return $data;
}

function getUserInboxes($pdo, $userId) {
    $stmt = $pdo->prepare('SELECT * FROM user_email_inboxes WHERE user_id = ? ORDER BY created_at');
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}

function userOwnsInbox($pdo, $userId, $inboxId) {
    $stmt = $pdo->prepare('SELECT id FROM user_email_inboxes WHERE user_id = ? AND inbox_id = ?');
    $stmt->execute([$userId, $inboxId]);
    return $stmt->fetch() !== false;
}

function saveUserInbox($pdo, $userId, $inboxId, $email, $displayName) {
    $stmt = $pdo->prepare('INSERT INTO user_email_inboxes (user_id, inbox_id, email, display_name) VALUES (?, ?, ?, ?) ON CONFLICT (inbox_id) DO NOTHING');
    $stmt->execute([$userId, $inboxId, $email, $displayName]);
}

$serviceHealth = emailApiCall($agentmailBase, '/api/email/health');
$serviceOnline = ($serviceHealth['_status'] ?? 0) === 200 && ($serviceHealth['status'] ?? '') !== 'unavailable';

$inboxes = getUserInboxes($pdo, $userId);
$messages = [];
$selectedInbox = $_GET['inbox'] ?? '';
$sendSuccess = false;
$sendError = '';

if ($selectedInbox && !userOwnsInbox($pdo, $userId, $selectedInbox)) {
    $selectedInbox = '';
}

if ($serviceOnline) {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        requireCsrf();
        $action = $_POST['action'] ?? '';

        if ($action === 'create_inbox') {
            $username = trim($_POST['inbox_username'] ?? '');
            $displayName = trim($_POST['inbox_display_name'] ?? '');
            if ($username) {
                $result = emailApiCall($agentmailBase, '/api/email/inboxes', 'POST', [
                    'username' => $username,
                    'display_name' => $displayName ?: 'MapAble - ' . $user['full_name'],
                ]);
                if (($result['_status'] ?? 0) >= 200 && ($result['_status'] ?? 0) < 300) {
                    $newInboxId = $result['inbox_id'] ?? $result['id'] ?? '';
                    $newEmail = $result['email'] ?? $username . '@agentmail.to';
                    if ($newInboxId) {
                        saveUserInbox($pdo, $userId, $newInboxId, $newEmail, $displayName ?: 'MapAble - ' . $user['full_name']);
                    }
                    setFlash('success', 'Inbox created successfully!');
                    redirect('/email');
                } else {
                    $sendError = $result['message'] ?? $result['error'] ?? 'Failed to create inbox';
                }
            }
        }

        if ($action === 'send_email') {
            $inboxId = $_POST['inbox_id'] ?? '';
            if (!userOwnsInbox($pdo, $userId, $inboxId)) {
                $sendError = 'You do not have access to this inbox';
            } else {
                $to = trim($_POST['to'] ?? '');
                $subject = trim($_POST['subject'] ?? '');
                $body = trim($_POST['body'] ?? '');
                if ($to && $subject && $body) {
                    $result = emailApiCall($agentmailBase, '/api/email/send', 'POST', [
                        'inbox_id' => $inboxId,
                        'to' => $to,
                        'subject' => $subject,
                        'text' => $body,
                        'html' => '<div style="font-family:Arial,sans-serif;color:#333;">' . nl2br(htmlspecialchars($body)) . '</div>',
                    ]);
                    if (($result['_status'] ?? 0) >= 200 && ($result['_status'] ?? 0) < 300) {
                        setFlash('success', 'Email sent successfully!');
                        redirect('/email?inbox=' . urlencode($inboxId));
                    } else {
                        $sendError = $result['message'] ?? $result['error'] ?? 'Failed to send email';
                    }
                } else {
                    $sendError = 'Please fill in all fields';
                }
            }
        }

        if ($action === 'reply_email') {
            $inboxId = $_POST['inbox_id'] ?? '';
            if (!userOwnsInbox($pdo, $userId, $inboxId)) {
                $sendError = 'You do not have access to this inbox';
            } else {
                $messageId = $_POST['message_id'] ?? '';
                $replyText = trim($_POST['reply_text'] ?? '');
                if ($messageId && $replyText) {
                    $result = emailApiCall($agentmailBase, '/api/email/reply', 'POST', [
                        'inbox_id' => $inboxId,
                        'message_id' => $messageId,
                        'text' => $replyText,
                    ]);
                    if (($result['_status'] ?? 0) >= 200 && ($result['_status'] ?? 0) < 300) {
                        setFlash('success', 'Reply sent!');
                        redirect('/email?inbox=' . urlencode($inboxId));
                    } else {
                        $sendError = $result['message'] ?? $result['error'] ?? 'Failed to send reply';
                    }
                }
            }
        }

        $inboxes = getUserInboxes($pdo, $userId);
    }

    if ($selectedInbox && userOwnsInbox($pdo, $userId, $selectedInbox)) {
        $msgResult = emailApiCall($agentmailBase, '/api/email/messages/' . urlencode($selectedInbox));
        if (is_array($msgResult) && isset($msgResult['messages'])) {
            $messages = $msgResult['messages'];
        } elseif (is_array($msgResult) && isset($msgResult['items'])) {
            $messages = $msgResult['items'];
        }
    }
}

require __DIR__ . '/../includes/layout_header.php';
?>
<div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold" data-testid="text-page-title">
            <i class="icon-mail w-6 h-6 inline-block align-middle mr-2 text-map-blue" aria-hidden="true"></i>
            Email
        </h1>
        <?php if ($serviceOnline && !empty($inboxes)): ?>
        <button onclick="document.getElementById('compose-modal').classList.remove('hidden')"
                class="bg-map-blue text-white px-4 py-2.5 rounded-lg text-sm font-medium min-h-[44px] hover:bg-map-navy transition-colors"
                data-testid="button-compose-email">
            <i class="icon-edit-3 w-4 h-4 inline-block align-middle mr-1.5" aria-hidden="true"></i>
            Compose
        </button>
        <?php endif; ?>
    </div>

    <?php if ($sendError): ?>
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4" role="alert" data-testid="alert-email-error">
        <?= h($sendError) ?>
    </div>
    <?php endif; ?>

    <?php if (!$serviceOnline): ?>
    <div class="card p-8 text-center" data-testid="section-email-offline">
        <div class="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="icon-mail-x w-8 h-8 text-yellow-600 dark:text-yellow-400" aria-hidden="true"></i>
        </div>
        <h2 class="text-lg font-semibold mb-2">Email Service Connecting</h2>
        <p class="text-gray-500 dark:text-gray-400 text-sm mb-4">The email service is starting up. Please refresh in a moment.</p>
        <a href="/email" class="text-map-blue hover:underline text-sm font-medium min-h-[44px] inline-flex items-center" data-testid="link-email-refresh">
            <i class="icon-refresh-cw w-4 h-4 mr-1.5" aria-hidden="true"></i>
            Refresh
        </a>
    </div>
    <?php elseif (empty($inboxes)): ?>
    <div class="card p-8 text-center" data-testid="section-email-setup">
        <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="icon-inbox w-8 h-8 text-map-blue" aria-hidden="true"></i>
        </div>
        <h2 class="text-lg font-semibold mb-2">Set Up Your Email Inbox</h2>
        <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Create an email inbox to send and receive emails through MapAble.</p>
        <form method="POST" class="max-w-md mx-auto space-y-4">
            <?= csrfField() ?>
            <input type="hidden" name="action" value="create_inbox">
            <div>
                <label for="inbox_username" class="block text-sm font-medium mb-1">Inbox Username</label>
                <div class="flex items-center gap-2">
                    <input type="text" id="inbox_username" name="inbox_username" required
                           placeholder="e.g. notifications"
                           class="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 min-h-[44px]"
                           data-testid="input-inbox-username">
                    <span class="text-sm text-gray-400">@agentmail.to</span>
                </div>
            </div>
            <div>
                <label for="inbox_display_name" class="block text-sm font-medium mb-1">Display Name</label>
                <input type="text" id="inbox_display_name" name="inbox_display_name"
                       placeholder="MapAble Notifications"
                       class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 min-h-[44px]"
                       data-testid="input-inbox-display-name">
            </div>
            <button type="submit"
                    class="w-full bg-map-blue text-white py-2.5 rounded-lg text-sm font-medium min-h-[44px] hover:bg-map-navy transition-colors"
                    data-testid="button-create-inbox">
                Create Inbox
            </button>
        </form>
    </div>
    <?php else: ?>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6" style="min-height:500px">
        <div class="md:col-span-1 space-y-4">
            <div class="card p-4">
                <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Inboxes</h2>
                <?php foreach ($inboxes as $inbox):
                    $inboxId = $inbox['inbox_id'] ?? $inbox['id'] ?? '';
                    $inboxEmail = $inbox['email'] ?? $inboxId;
                    $inboxDisplay = $inbox['display_name'] ?? $inboxEmail;
                    $isSelected = $selectedInbox === $inboxId;
                ?>
                <a href="/email?inbox=<?= h(urlencode($inboxId)) ?>"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm min-h-[44px] mb-1
                          <?= $isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-map-blue font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400' ?>"
                   <?= $isSelected ? 'aria-current="true"' : '' ?>
                   data-testid="link-inbox-<?= h($inboxId) ?>">
                    <i class="icon-inbox w-4 h-4" aria-hidden="true"></i>
                    <div class="min-w-0">
                        <p class="truncate font-medium"><?= h($inboxDisplay) ?></p>
                        <p class="text-xs text-gray-400 truncate"><?= h($inboxEmail) ?></p>
                    </div>
                </a>
                <?php endforeach; ?>
            </div>

            <form method="POST" class="card p-4">
                <?= csrfField() ?>
                <input type="hidden" name="action" value="create_inbox">
                <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">New Inbox</h3>
                <input type="text" name="inbox_username" required placeholder="username"
                       class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 mb-2 min-h-[44px]"
                       data-testid="input-new-inbox-username">
                <input type="text" name="inbox_display_name" placeholder="Display name"
                       class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 mb-2 min-h-[44px]"
                       data-testid="input-new-inbox-display-name">
                <button type="submit" class="w-full bg-gray-100 dark:bg-gray-800 text-sm py-2 rounded-lg min-h-[44px] hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        data-testid="button-add-inbox">
                    <i class="icon-plus w-3.5 h-3.5 inline-block align-middle mr-1" aria-hidden="true"></i>
                    Add Inbox
                </button>
            </form>
        </div>

        <div class="md:col-span-3">
            <?php if (!$selectedInbox): ?>
            <div class="card p-8 text-center">
                <i class="icon-mail-open w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" aria-hidden="true"></i>
                <p class="text-gray-500 dark:text-gray-400">Select an inbox to view messages</p>
            </div>
            <?php elseif (empty($messages)): ?>
            <div class="card p-8 text-center" data-testid="section-email-empty">
                <i class="icon-inbox w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" aria-hidden="true"></i>
                <p class="text-gray-500 dark:text-gray-400 mb-2">No messages yet</p>
                <p class="text-xs text-gray-400">Send an email or wait for incoming messages.</p>
            </div>
            <?php else: ?>
            <div class="space-y-3" data-testid="section-email-list">
                <?php foreach ($messages as $msg):
                    $msgId = $msg['message_id'] ?? $msg['id'] ?? '';
                    $from = $msg['from'] ?? 'Unknown';
                    $to = is_array($msg['to'] ?? null) ? implode(', ', $msg['to']) : ($msg['to'] ?? '');
                    $subject = $msg['subject'] ?? '(No subject)';
                    $body = $msg['extracted_text'] ?? $msg['text'] ?? '';
                    $date = $msg['created_at'] ?? '';
                    if ($date) $date = date('d M Y, g:i A', strtotime($date));
                ?>
                <div class="card p-4" data-testid="card-email-<?= h($msgId) ?>">
                    <div class="flex items-start justify-between gap-4 mb-2">
                        <div class="min-w-0">
                            <p class="font-semibold text-sm truncate" data-testid="text-email-subject-<?= h($msgId) ?>"><?= h($subject) ?></p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">
                                From: <span class="font-medium"><?= h($from) ?></span>
                                <?php if ($to): ?> &middot; To: <?= h($to) ?><?php endif; ?>
                            </p>
                        </div>
                        <span class="text-xs text-gray-400 whitespace-nowrap"><?= h($date) ?></span>
                    </div>
                    <div class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3" data-testid="text-email-body-<?= h($msgId) ?>"><?= h(mb_substr($body, 0, 500)) ?></div>

                    <details class="border-t border-gray-100 dark:border-gray-700 pt-3">
                        <summary class="text-xs text-map-blue cursor-pointer min-h-[44px] flex items-center" data-testid="button-reply-toggle-<?= h($msgId) ?>">
                            <i class="icon-reply w-3.5 h-3.5 mr-1" aria-hidden="true"></i>
                            Reply
                        </summary>
                        <form method="POST" class="mt-3 space-y-2">
                            <?= csrfField() ?>
                            <input type="hidden" name="action" value="reply_email">
                            <input type="hidden" name="inbox_id" value="<?= h($selectedInbox) ?>">
                            <input type="hidden" name="message_id" value="<?= h($msgId) ?>">
                            <textarea name="reply_text" required rows="3" placeholder="Type your reply..."
                                      class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                                      data-testid="input-reply-<?= h($msgId) ?>"></textarea>
                            <button type="submit"
                                    class="bg-map-blue text-white px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] hover:bg-map-navy transition-colors"
                                    data-testid="button-send-reply-<?= h($msgId) ?>">
                                Send Reply
                            </button>
                        </form>
                    </details>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </div>
    </div>
    <?php endif; ?>
</div>

<div id="compose-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="modal-compose-email">
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold">Compose Email</h2>
            <button onclick="document.getElementById('compose-modal').classList.add('hidden')"
                    class="text-gray-400 hover:text-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close compose modal" data-testid="button-close-compose">
                <i class="icon-x w-5 h-5" aria-hidden="true"></i>
            </button>
        </div>
        <form method="POST" class="space-y-4">
            <?= csrfField() ?>
            <input type="hidden" name="action" value="send_email">
            <div>
                <label for="compose-inbox" class="block text-sm font-medium mb-1">From Inbox</label>
                <select id="compose-inbox" name="inbox_id" required
                        class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 min-h-[44px]"
                        data-testid="select-compose-inbox">
                    <?php foreach ($inboxes as $inbox):
                        $id = $inbox['inbox_id'] ?? $inbox['id'] ?? '';
                        $email = $inbox['email'] ?? $id;
                    ?>
                    <option value="<?= h($id) ?>"><?= h($email) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div>
                <label for="compose-to" class="block text-sm font-medium mb-1">To</label>
                <input type="email" id="compose-to" name="to" required placeholder="recipient@example.com"
                       class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 min-h-[44px]"
                       data-testid="input-compose-to">
            </div>
            <div>
                <label for="compose-subject" class="block text-sm font-medium mb-1">Subject</label>
                <input type="text" id="compose-subject" name="subject" required placeholder="Email subject"
                       class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800 min-h-[44px]"
                       data-testid="input-compose-subject">
            </div>
            <div>
                <label for="compose-body" class="block text-sm font-medium mb-1">Message</label>
                <textarea id="compose-body" name="body" required rows="6" placeholder="Type your message..."
                          class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-800"
                          data-testid="input-compose-body"></textarea>
            </div>
            <div class="flex gap-3 justify-end">
                <button type="button" onclick="document.getElementById('compose-modal').classList.add('hidden')"
                        class="px-4 py-2.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 min-h-[44px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        data-testid="button-cancel-compose">
                    Cancel
                </button>
                <button type="submit"
                        class="bg-map-blue text-white px-6 py-2.5 rounded-lg text-sm font-medium min-h-[44px] hover:bg-map-navy transition-colors"
                        data-testid="button-send-email">
                    <i class="icon-send w-4 h-4 inline-block align-middle mr-1.5" aria-hidden="true"></i>
                    Send
                </button>
            </div>
        </form>
    </div>
</div>

<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
