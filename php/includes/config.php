<?php
session_start();

$dbUrl = getenv('NEON_DATABASE_URL') ?: getenv('DATABASE_URL');
if (!$dbUrl) {
    die('NEON_DATABASE_URL or DATABASE_URL must be set');
}

$parsed = parse_url($dbUrl);
$host = $parsed['host'] ?? 'localhost';
$port = $parsed['port'] ?? 5432;
$dbname = ltrim($parsed['path'] ?? '', '/');
$user = $parsed['user'] ?? '';
$pass = $parsed['pass'] ?? '';

$dsn = "pgsql:host={$host};port={$port};dbname={$dbname};sslmode=require";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    die('Database connection failed: ' . $e->getMessage());
}

define('OPENAI_API_KEY', getenv('AI_INTEGRATIONS_OPENAI_API_KEY') ?: '');
define('OPENAI_BASE_URL', getenv('AI_INTEGRATIONS_OPENAI_BASE_URL') ?: 'https://api.openai.com/v1');
define('SESSION_SECRET', getenv('SESSION_SECRET') ?: 'mapable-dev-secret');

define('AUTH0_DOMAIN', getenv('AUTH0_DOMAIN') ?: 'adid.au.auth0.com');
define('AUTH0_CLIENT_ID', getenv('AUTH0_CLIENT_ID') ?: '');
$replit_domain = getenv('REPLIT_DEV_DOMAIN') ?: getenv('REPLIT_DOMAINS') ?: '';
define('AUTH0_CALLBACK_URL', $replit_domain ? "https://{$replit_domain}/auth/callback" : 'http://localhost:5000/auth/callback');
define('AUTH0_LOGOUT_RETURN_URL', $replit_domain ? "https://{$replit_domain}/login" : 'http://localhost:5000/login');
define('AUTH0_ENABLED', !empty(AUTH0_CLIENT_ID));
