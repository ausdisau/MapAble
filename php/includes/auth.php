<?php
function attemptLogin($pdo, $username, $password) {
    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    if (!$user || $user['password'] !== $password) {
        return false;
    }
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['user_name'] = $user['full_name'];
    return $user;
}

function logout() {
    $wasAuth0 = !empty($_SESSION['auth0_login']);
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    return $wasAuth0;
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

function generatePkceChallenge(): array {
    $verifier = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');
    return ['verifier' => $verifier, 'challenge' => $challenge];
}

function getAuth0AuthorizeUrl(?string $connection = null): string {
    $pkce = generatePkceChallenge();
    $state = bin2hex(random_bytes(16));
    $_SESSION['auth0_state'] = $state;
    $_SESSION['auth0_code_verifier'] = $pkce['verifier'];

    $params = [
        'response_type' => 'code',
        'client_id' => AUTH0_CLIENT_ID,
        'redirect_uri' => AUTH0_CALLBACK_URL,
        'scope' => 'openid profile email',
        'state' => $state,
        'code_challenge' => $pkce['challenge'],
        'code_challenge_method' => 'S256',
    ];
    if ($connection) {
        $params['connection'] = $connection;
    }
    return 'https://' . AUTH0_DOMAIN . '/authorize?' . http_build_query($params);
}

function exchangeAuth0Code(string $code): ?array {
    $data = [
        'grant_type' => 'authorization_code',
        'client_id' => AUTH0_CLIENT_ID,
        'code' => $code,
        'redirect_uri' => AUTH0_CALLBACK_URL,
        'code_verifier' => $_SESSION['auth0_code_verifier'] ?? '',
    ];

    $ch = curl_init('https://' . AUTH0_DOMAIN . '/oauth/token');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return null;
    }
    return json_decode($response, true);
}

function getAuth0UserInfo(string $accessToken): ?array {
    $ch = curl_init('https://' . AUTH0_DOMAIN . '/userinfo');
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => ["Authorization: Bearer {$accessToken}"],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return null;
    }
    return json_decode($response, true);
}

function findOrCreateAuth0User($pdo, array $userInfo): ?array {
    $sub = $userInfo['sub'] ?? '';
    $email = $userInfo['email'] ?? '';
    $emailVerified = !empty($userInfo['email_verified']);
    $name = $userInfo['name'] ?? $userInfo['nickname'] ?? 'Auth0 User';
    $picture = $userInfo['picture'] ?? '';

    if ($sub) {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE auth0_sub = ?');
        $stmt->execute([$sub]);
        $user = $stmt->fetch();
        if ($user) {
            setAuth0Session($user);
            return $user;
        }
    }

    if ($email && $emailVerified) {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if ($user) {
            if ($sub) {
                $pdo->prepare('UPDATE users SET auth0_sub = ? WHERE id = ?')->execute([$sub, $user['id']]);
            }
            setAuth0Session($user);
            return $user;
        }
    }

    $id = 'auth0_' . substr(md5($sub ?: $email), 0, 12);
    $username = $email ? explode('@', $email)[0] : 'user_' . substr(md5($sub), 0, 8);

    $existingUsername = $pdo->prepare('SELECT id FROM users WHERE username = ?');
    $existingUsername->execute([$username]);
    if ($existingUsername->fetch()) {
        $username .= '_' . substr(md5($sub), 0, 4);
    }

    $stmt = $pdo->prepare('INSERT INTO users (id, username, password, full_name, email, role, avatar, auth0_sub, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true)');
    $stmt->execute([$id, $username, '', $name, $email, 'participant', $picture, $sub]);

    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();
    setAuth0Session($user);
    return $user;
}

function setAuth0Session(array $user): void {
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['user_name'] = $user['full_name'];
    $_SESSION['auth0_login'] = true;
}

function getAuth0LogoutUrl(): string {
    $params = [
        'client_id' => AUTH0_CLIENT_ID,
        'returnTo' => AUTH0_LOGOUT_RETURN_URL,
    ];
    return 'https://' . AUTH0_DOMAIN . '/v2/logout?' . http_build_query($params);
}
