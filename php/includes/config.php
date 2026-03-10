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
