<?php
function attemptLogin($pdo, $username, $password) {
    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    if (!$user || $user['password'] !== $password) {
        return false;
    }
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['user_name'] = $user['full_name'];
    return $user;
}

function logout() {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function requireAuth() {
    if (!isLoggedIn()) {
        redirect('/login');
    }
}

function currentUser($pdo) {
    if (!isLoggedIn()) return null;
    static $cached = null;
    if ($cached) return $cached;
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([currentUserId()]);
    $cached = $stmt->fetch();
    return $cached;
}
