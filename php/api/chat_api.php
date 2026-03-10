<?php
require_once __DIR__ . '/../api/chat_engine.php';

$method = $_SERVER['REQUEST_METHOD'];
$userId = currentUserId();

if (in_array($method, ['POST', 'DELETE']) && !verifyCsrf()) {
    jsonResponse(['error' => 'Invalid CSRF token'], 403);
}

$path = str_replace('/api/chat', '', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$path = rtrim($path, '/');

if ($path === '/sessions' && $method === 'GET') {
    $sessions = getUserChatSessions($pdo, $userId);
    jsonResponse($sessions);
}

if ($path === '/sessions' && $method === 'POST') {
    $session = createChatSession($pdo, $userId);
    jsonResponse($session, 201);
}

function verifyChatSessionOwnership($pdo, $sessionId, $userId) {
    $stmt = $pdo->prepare('SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?');
    $stmt->execute([$sessionId, $userId]);
    if (!$stmt->fetch()) {
        jsonResponse(['error' => 'Unauthorized'], 403);
    }
}

if (preg_match('#^/sessions/([^/]+)$#', $path, $m) && $method === 'DELETE') {
    verifyChatSessionOwnership($pdo, $m[1], $userId);
    deleteChatSession($pdo, $m[1]);
    jsonResponse(['success' => true]);
}

if (preg_match('#^/sessions/([^/]+)/messages$#', $path, $m) && $method === 'GET') {
    verifyChatSessionOwnership($pdo, $m[1], $userId);
    $messages = getChatMessages($pdo, $m[1]);
    jsonResponse($messages);
}

if (preg_match('#^/sessions/([^/]+)/messages$#', $path, $m) && $method === 'POST') {
    $sessionId = $m[1];
    verifyChatSessionOwnership($pdo, $sessionId, $userId);
    $input = json_decode(file_get_contents('php://input'), true);
    $userMessage = $input['message'] ?? '';

    if (!$userMessage) {
        jsonResponse(['error' => 'Message is required'], 400);
    }

    saveChatMessage($pdo, $sessionId, 'user', $userMessage);

    $result = processChat($pdo, $userId, $sessionId, $userMessage);

    $saved = saveChatMessage($pdo, $sessionId, 'assistant', $result['content'],
        null, $result['quick_actions'] ?? null, $result['confidence'] ?? null);

    jsonResponse([
        'message' => $saved,
        'quick_actions' => $result['quick_actions'] ?? [],
        'confidence' => $result['confidence'] ?? 'general',
    ]);
}

jsonResponse(['error' => 'Not found'], 404);
