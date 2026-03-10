<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/db.php';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (preg_match('/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/', $uri)) {
    return false;
}

if ($uri === '/login') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        requireCsrf();
        $username = $_POST['username'] ?? '';
        $password = $_POST['password'] ?? '';
        if (attemptLogin($pdo, $username, $password)) {
            redirect('/');
        } else {
            $loginError = 'Invalid username or password';
        }
    }
    require __DIR__ . '/../pages/login.php';
    exit;
}

if ($uri === '/auth/login' || $uri === '/auth/login/google' || $uri === '/auth/login/microsoft') {
    if (!AUTH0_ENABLED) {
        redirect('/login');
    }
    $connection = null;
    if ($uri === '/auth/login/google') $connection = 'google-oauth2';
    if ($uri === '/auth/login/microsoft') $connection = 'windowslive';
    $url = getAuth0AuthorizeUrl($connection);
    header('Location: ' . $url);
    exit;
}

if ($uri === '/auth/callback') {
    if (!AUTH0_ENABLED) {
        redirect('/login');
    }
    $code = $_GET['code'] ?? '';
    $state = $_GET['state'] ?? '';
    $error = $_GET['error'] ?? '';

    $cleanupAuth0Session = function() {
        unset($_SESSION['auth0_state'], $_SESSION['auth0_code_verifier']);
    };

    if ($error) {
        $cleanupAuth0Session();
        $_SESSION['login_error'] = 'Authentication failed: ' . ($_GET['error_description'] ?? $error);
        redirect('/login');
    }

    if (!$state || !hash_equals($_SESSION['auth0_state'] ?? '', $state)) {
        $cleanupAuth0Session();
        $_SESSION['login_error'] = 'Invalid authentication state. Please try again.';
        redirect('/login');
    }

    $storedVerifier = $_SESSION['auth0_code_verifier'] ?? '';
    if (!$code || !$storedVerifier) {
        $cleanupAuth0Session();
        $_SESSION['login_error'] = 'No authorization code received.';
        redirect('/login');
    }

    $tokens = exchangeAuth0Code($code);
    $cleanupAuth0Session();
    if (!$tokens || empty($tokens['access_token'])) {
        $_SESSION['login_error'] = 'Failed to exchange authorization code.';
        redirect('/login');
    }

    $userInfo = getAuth0UserInfo($tokens['access_token']);
    if (!$userInfo) {
        $_SESSION['login_error'] = 'Failed to retrieve user information.';
        redirect('/login');
    }

    $user = findOrCreateAuth0User($pdo, $userInfo);
    if (!$user) {
        $_SESSION['login_error'] = 'Failed to create or find user account.';
        redirect('/login');
    }

    redirect('/');
}

if ($uri === '/logout') {
    $wasAuth0 = logout();
    if ($wasAuth0 && AUTH0_ENABLED) {
        $logoutUrl = 'https://' . AUTH0_DOMAIN . '/v2/logout?' . http_build_query([
            'client_id' => AUTH0_CLIENT_ID,
            'returnTo' => AUTH0_LOGOUT_RETURN_URL,
        ]);
        header('Location: ' . $logoutUrl);
        exit;
    }
    redirect('/login');
}

requireAuth();

if (str_starts_with($uri, '/api/chat/')) {
    require __DIR__ . '/../api/chat_api.php';
    exit;
}

$routes = [
    '/' => 'dashboard.php',
    '/care' => 'care.php',
    '/jobs' => 'jobs.php',
    '/transport' => 'transport.php',
    '/chat' => 'chat.php',
    '/pricing' => 'pricing.php',
    '/budget' => 'budget.php',
    '/invoices' => 'invoices.php',
    '/messages' => 'messages.php',
    '/settings' => 'settings.php',
];

if (preg_match('#^/care/([a-zA-Z0-9-]+)$#', $uri, $m)) {
    $workerId = $m[1];
    require __DIR__ . '/../pages/worker_detail.php';
    exit;
}

if (preg_match('#^/jobs/([a-zA-Z0-9-]+)$#', $uri, $m)) {
    $jobId = $m[1];
    require __DIR__ . '/../pages/job_detail.php';
    exit;
}

if (isset($routes[$uri])) {
    require __DIR__ . '/../pages/' . $routes[$uri];
} else {
    http_response_code(404);
    require __DIR__ . '/../pages/not_found.php';
}
