<?php
function h($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

function formatCurrency($amount) {
    return '$' . number_format((float)$amount, 2);
}

function formatDate($date) {
    if (!$date) return '';
    return date('d M Y', strtotime($date));
}

function formatDateTime($dt) {
    if (!$dt) return '';
    return date('d M Y, g:i A', strtotime($dt));
}

function timeAgo($datetime) {
    $now = new DateTime();
    $ago = new DateTime($datetime);
    $diff = $now->diff($ago);
    if ($diff->d > 0) return $diff->d . 'd ago';
    if ($diff->h > 0) return $diff->h . 'h ago';
    if ($diff->i > 0) return $diff->i . 'm ago';
    return 'Just now';
}

function csrfToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrf() {
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    return hash_equals($_SESSION['csrf_token'] ?? '', $token);
}

function requireCsrf() {
    if (!verifyCsrf()) {
        setFlash('error', 'Invalid form submission. Please try again.');
        redirect($_SERVER['REQUEST_URI']);
    }
}

function csrfField() {
    return '<input type="hidden" name="csrf_token" value="' . h(csrfToken()) . '">';
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function redirect($url) {
    header('Location: ' . $url);
    exit;
}

function currentUserId() {
    return $_SESSION['user_id'] ?? null;
}

function isLoggedIn() {
    return !empty($_SESSION['user_id']);
}

function setFlash($type, $message) {
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function getFlash() {
    $flash = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $flash;
}

function starRating($rating) {
    $full = floor($rating);
    $half = ($rating - $full) >= 0.5 ? 1 : 0;
    $empty = 5 - $full - $half;
    $html = '';
    for ($i = 0; $i < $full; $i++) $html .= '★';
    if ($half) $html .= '½';
    for ($i = 0; $i < $empty; $i++) $html .= '☆';
    return $html;
}
