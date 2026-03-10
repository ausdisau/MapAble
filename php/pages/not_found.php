<?php $pageTitle = '404 Not Found'; ?>
<?php if (isLoggedIn()): ?>
<?php require __DIR__ . '/../includes/layout_header.php'; ?>
<div class="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
    <div class="text-6xl font-black text-map-gold" data-testid="text-404">404</div>
    <h1 class="text-2xl font-bold">Page Not Found</h1>
    <p class="text-gray-500 dark:text-gray-400">The page you're looking for doesn't exist or has been moved.</p>
    <a href="/" class="btn btn-primary inline-flex" data-testid="link-go-home">Go to Dashboard</a>
</div>
<?php require __DIR__ . '/../includes/layout_footer.php'; ?>
<?php else: ?>
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>404 | MapAble 4.0</title>
<script src="https://cdn.tailwindcss.com"></script></head>
<body class="min-h-screen flex items-center justify-center bg-gray-100">
<div class="text-center space-y-4 px-4">
    <div class="text-6xl font-black text-yellow-500">404</div>
    <h1 class="text-2xl font-bold">Page Not Found</h1>
    <a href="/login" class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold">Go to Login</a>
</div>
</body></html>
<?php endif; ?>
