<?php
$currentPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$user = currentUser($pdo);
$navItems = [
    ['title' => 'Dashboard', 'url' => '/', 'icon' => 'layout-dashboard'],
    ['title' => 'Book a Carer', 'url' => '/care', 'icon' => 'heart-handshake'],
    ['title' => 'Find a Job', 'url' => '/jobs', 'icon' => 'briefcase'],
    ['title' => 'Get Transport', 'url' => '/transport', 'icon' => 'bus'],
    ['title' => 'MapAble Chat', 'url' => '/chat', 'icon' => 'bot'],
    ['title' => 'Pricing', 'url' => '/pricing', 'icon' => 'dollar-sign'],
    ['title' => 'Budget', 'url' => '/budget', 'icon' => 'wallet'],
    ['title' => 'Invoices', 'url' => '/invoices', 'icon' => 'file-text'],
    ['title' => 'Messages', 'url' => '/messages', 'icon' => 'message-square'],
    ['title' => 'Email', 'url' => '/email', 'icon' => 'mail'],
    ['title' => 'Settings', 'url' => '/settings', 'icon' => 'settings'],
];
$pageTitle = $pageTitle ?? 'MapAble 4.0';
?>
<!DOCTYPE html>
<html lang="en" class="<?= ($_COOKIE['theme'] ?? '') === 'dark' ? 'dark' : '' ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= h($pageTitle) ?> | MapAble 4.0</title>
    <meta name="description" content="MapAble 4.0 - NDIS Support Services. Empowering Independence through Care, Transport, and Employment.">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
    tailwind.config = {
        darkMode: 'class',
        theme: {
            extend: {
                colors: {
                    'map-blue': '#1B6EB5',
                    'map-teal': '#2EAA6E',
                    'map-gold': '#E6A817',
                    'map-navy': '#14578F',
                    'map-dark': '#0F1A2E',
                }
            }
        }
    }
    </script>
    <link rel="stylesheet" href="https://unpkg.com/lucide-static@latest/font/lucide.css">
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body class="bg-gray-100 dark:bg-[#0F1A2E] text-gray-900 dark:text-gray-100 min-h-screen flex">
    <div class="skip-links" role="navigation" aria-label="Skip links">
        <a href="#main-content" data-testid="link-skip-to-content">Skip to main content</a>
        <a href="#sidebar" data-testid="link-skip-to-nav">Skip to navigation</a>
        <a href="#search-input" data-testid="link-skip-to-search">Skip to search</a>
    </div>

    <aside id="sidebar" class="hidden md:flex flex-col w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shrink-0 h-screen sticky top-0" role="complementary" aria-label="Sidebar navigation" data-testid="sidebar">
        <div class="p-4 pb-5">
            <div class="flex items-center gap-3.5 cursor-pointer select-none" data-testid="button-logo-dropdown">
                <img src="/assets/images/logo.png" alt="MapAble" class="w-12 h-12 rounded-lg object-contain" data-testid="img-sidebar-logo">
                <div class="flex flex-col overflow-hidden">
                    <div class="flex items-baseline gap-1.5">
                        <span class="text-xl font-black tracking-tight text-map-gold">MapAble</span>
                        <span class="text-[10px] font-bold text-map-gold/70">4.0</span>
                    </div>
                    <span class="text-[11px] text-gray-500 dark:text-gray-400 leading-none tracking-wide mt-0.5">Empowering Independence</span>
                </div>
            </div>
        </div>
        <nav class="flex-1 overflow-y-auto px-3" aria-label="Main navigation">
            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 px-3 mb-2 uppercase tracking-wider">Navigation</p>
            <?php foreach ($navItems as $item):
                $isActive = $currentPath === $item['url'] || ($item['url'] !== '/' && str_starts_with($currentPath, $item['url']));
            ?>
            <a href="<?= $item['url'] ?>"
               class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 min-h-[44px] transition-colors
                      <?= $isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-map-blue dark:text-blue-300 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800' ?>"
               <?= $isActive ? 'aria-current="page"' : '' ?>
               data-testid="link-nav-<?= strtolower(str_replace(' ', '-', $item['title'])) ?>">
                <i class="icon-<?= $item['icon'] ?> w-4 h-4 <?= $isActive ? 'text-map-teal' : '' ?>" aria-hidden="true"></i>
                <span><?= $item['title'] ?></span>
            </a>
            <?php endforeach; ?>
        </nav>
        <div class="p-4 space-y-2 relative">
            <div class="absolute top-1 left-6 w-1.5 h-1.5 rounded-full bg-map-gold/40" aria-hidden="true"></div>
            <div class="absolute top-3 right-5 w-1 h-1 rounded-full bg-map-gold/30" aria-hidden="true"></div>
            <?php if ($user): ?>
            <div class="flex items-center justify-between px-1">
                <span class="text-xs text-gray-500 dark:text-gray-400 truncate"><?= h($user['full_name']) ?></span>
                <a href="/logout" class="text-gray-400 dark:text-gray-500 p-1 rounded-md" aria-label="Sign out" data-testid="button-logout">
                    <i class="icon-log-out w-3.5 h-3.5"></i>
                </a>
            </div>
            <?php endif; ?>
            <div class="flex items-center justify-center gap-2 py-1.5 px-3 border border-map-teal/30 bg-map-teal/10 text-map-teal rounded-lg text-xs font-semibold" data-testid="badge-ndis-registered">
                <i class="icon-shield-check w-3.5 h-3.5"></i>
                <span>NDIS Registered Provider</span>
            </div>
        </div>
    </aside>

    <div class="flex flex-col flex-1 min-w-0">
        <header class="flex items-center justify-between gap-3 px-4 py-2 sticky top-0 z-40 relative" style="background: linear-gradient(90deg, #14578F, #1B6EB5, #2384C9)" role="banner" data-testid="header-main">
            <div class="flex items-center gap-3">
                <button onclick="toggleMobileMenu()" class="md:hidden text-white/90 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" data-testid="button-mobile-menu" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobile-menu">
                    <img src="/assets/images/logo.png" alt="" class="h-10 w-auto" data-testid="img-header-logo" aria-hidden="true">
                </button>
                <form action="/care" method="get" role="search" aria-label="Search workers and services" class="hidden md:flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 min-w-[240px] lg:min-w-[320px]" data-testid="input-header-search-container">
                    <i class="icon-search w-4 h-4 text-white/70" aria-hidden="true"></i>
                    <input type="search" id="search-input" name="q" placeholder="Search workers, jobs, services..." aria-label="Search workers, jobs, services" class="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/50 w-full" data-testid="input-header-search">
                </form>
            </div>
            <div class="flex items-center gap-1">
                <button onclick="toggleTheme()" class="text-white/90 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" data-testid="button-theme-toggle" aria-label="Toggle dark mode" aria-pressed="false">
                    <i class="icon-moon w-4 h-4 dark:hidden" aria-hidden="true"></i>
                    <i class="icon-sun w-4 h-4 hidden dark:inline" aria-hidden="true"></i>
                </button>
            </div>
        </header>

        <nav id="mobile-menu" class="hidden md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-2 px-4" role="navigation" aria-label="Mobile navigation">
            <?php foreach ($navItems as $item): ?>
            <a href="<?= $item['url'] ?>" class="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-300 min-h-[44px]">
                <i class="icon-<?= $item['icon'] ?> w-4 h-4" aria-hidden="true"></i>
                <span><?= $item['title'] ?></span>
            </a>
            <?php endforeach; ?>
            <a href="/logout" class="flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 min-h-[44px]">
                <i class="icon-log-out w-4 h-4" aria-hidden="true"></i>
                <span>Sign Out</span>
            </a>
        </nav>

        <div class="flex h-[3px] shrink-0" aria-hidden="true" data-testid="accent-tricolor-strip">
            <div class="flex-1 bg-map-teal"></div>
            <div class="flex-1" style="background-color:#1A4B7A"></div>
            <div class="flex-1 bg-map-gold"></div>
        </div>

        <main id="main-content" class="flex-1 overflow-auto" role="main" aria-label="Main content">
