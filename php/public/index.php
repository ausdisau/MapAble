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

if ($uri === '/logout') {
    logout();
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
