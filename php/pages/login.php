<?php $pageTitle = 'Sign In'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In | MapAble 4.0</title>
    <meta name="description" content="Sign in to MapAble 4.0 — your NDIS support platform for care, transport, and employment services.">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config={theme:{extend:{colors:{'map-blue':'#1B6EB5','map-teal':'#2EAA6E','map-gold':'#E6A817','map-navy':'#14578F','map-dark':'#0F1A2E'}}}}</script>
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body class="min-h-screen flex flex-col" style="background:linear-gradient(135deg,#0F1A2E 0%,#14578F 50%,#1B6EB5 100%)">
    <div class="skip-links" role="navigation" aria-label="Skip links">
        <a href="#login-form" data-testid="link-skip-to-login">Skip to sign in form</a>
    </div>
    <div class="flex h-[3px] shrink-0" aria-hidden="true">
        <div class="flex-1 bg-map-teal"></div>
        <div class="flex-1" style="background:#1A4B7A"></div>
        <div class="flex-1 bg-map-gold"></div>
    </div>
    <main class="flex-1 flex items-center justify-center px-4 py-12" role="main" aria-label="Sign in">
        <div class="w-full max-w-md space-y-8">
            <div class="text-center space-y-4">
                <div class="flex justify-center">
                    <a href="/" aria-label="MapAble home page">
                        <img src="/assets/images/logo.png" alt="MapAble logo" class="w-20 h-20 rounded-2xl shadow-lg" data-testid="img-login-logo">
                    </a>
                </div>
                <div>
                    <h1 class="text-3xl font-black tracking-tight text-white">
                        <span class="text-map-gold">MapAble</span>
                        <span class="text-white/60 text-lg font-bold">4.0</span>
                    </h1>
                    <p class="text-white/60 text-sm mt-1 tracking-wide">Empowering Independence</p>
                </div>
                <div class="flex justify-center gap-6 pt-2" aria-label="Available services" role="list">
                    <div role="listitem" class="flex flex-col items-center gap-1"><span class="text-map-teal text-lg" aria-hidden="true">♥</span><span class="text-[10px] text-white/50 font-medium">Care</span></div>
                    <div role="listitem" class="flex flex-col items-center gap-1"><span class="text-map-teal text-lg" aria-hidden="true">🚌</span><span class="text-[10px] text-white/50 font-medium">Transport</span></div>
                    <div role="listitem" class="flex flex-col items-center gap-1"><span class="text-map-teal text-lg" aria-hidden="true">💼</span><span class="text-[10px] text-white/50 font-medium">Employment</span></div>
                    <div role="listitem" class="flex flex-col items-center gap-1"><span class="text-map-teal text-lg" aria-hidden="true">🤖</span><span class="text-[10px] text-white/50 font-medium">AI Chat</span></div>
                </div>
            </div>

            <?php
                $flashError = '';
                if (!empty($_SESSION['login_error'])) {
                    $flashError = $_SESSION['login_error'];
                    unset($_SESSION['login_error']);
                }
            ?>
            <div class="border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-xl">
                <div class="pb-4 pt-6 px-6">
                    <h2 class="text-lg font-semibold text-white text-center">Sign in to your account</h2>
                    <p class="text-xs text-white/50 text-center mt-1">Australian Disability Ltd Services</p>
                </div>
                <div class="px-6 pb-6">
                    <?php if (!empty($loginError) || !empty($flashError)): ?>
                    <div class="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4" role="alert" aria-live="assertive" id="login-error" data-testid="text-login-error">
                        <span aria-hidden="true">⚠</span>
                        <span><?= h($loginError ?: $flashError) ?></span>
                    </div>
                    <?php endif; ?>

                    <?php if (AUTH0_ENABLED): ?>
                    <div class="space-y-3 mb-5">
                        <a href="/auth/login/google" class="flex items-center justify-center gap-3 w-full h-11 bg-white text-gray-700 font-medium text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors" data-testid="button-login-google">
                            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z"/></svg>
                            Sign in with Google
                        </a>
                        <a href="/auth/login/microsoft" class="flex items-center justify-center gap-3 w-full h-11 bg-[#2F2F2F] text-white font-medium text-sm rounded-lg border border-[#2F2F2F] hover:bg-[#404040] transition-colors" data-testid="button-login-microsoft">
                            <svg width="18" height="18" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>
                            Sign in with Microsoft
                        </a>
                        <a href="/auth/login" class="flex items-center justify-center gap-2 w-full h-9 text-white/60 text-xs hover:text-white/80 transition-colors" data-testid="link-login-auth0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            More sign-in options
                        </a>
                    </div>

                    <div class="flex items-center gap-3 mb-5">
                        <div class="flex-1 h-px bg-white/10"></div>
                        <span class="text-[11px] text-white/40 whitespace-nowrap">or sign in with a demo account</span>
                        <div class="flex-1 h-px bg-white/10"></div>
                    </div>
                    <?php endif; ?>

                    <form method="POST" action="/login" id="login-form" class="space-y-4" <?= (!empty($loginError) || !empty($flashError)) ? 'aria-describedby="login-error"' : '' ?>>
                        <?= csrfField() ?>

                        <div class="space-y-2">
                            <label for="username" class="text-white/80 text-sm block">Username</label>
                            <input id="username" name="username" type="text" required autocomplete="username"
                                class="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-map-teal h-11"
                                placeholder="Enter your username" value="<?= h($_POST['username'] ?? '') ?>" aria-required="true" data-testid="input-username">
                        </div>

                        <div class="space-y-2">
                            <label for="password" class="text-white/80 text-sm block">Password</label>
                            <input id="password" name="password" type="password" required autocomplete="current-password"
                                class="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-map-teal h-11"
                                placeholder="Enter your password" aria-required="true" data-testid="input-password">
                        </div>

                        <button type="submit" class="btn btn-teal w-full h-11 text-sm font-semibold" data-testid="button-login">
                            Sign In
                        </button>
                    </form>

                    <div class="mt-4 pt-3 border-t border-white/10">
                        <p class="text-[11px] text-white/40 text-center mb-3">Demo Accounts</p>
                        <div class="grid grid-cols-2 gap-2">
                            <button type="button" onclick="document.getElementById('username').value='demo_participant';document.getElementById('password').value='hashed_password';"
                                class="text-xs text-white/60 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-left" data-testid="button-demo-participant">
                                <span class="font-medium text-white/80 block">Participant</span>
                                <span class="text-[10px]">Jordan Lee</span>
                            </button>
                            <button type="button" onclick="document.getElementById('username').value='alex_m';document.getElementById('password').value='hashed_password';"
                                class="text-xs text-white/60 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-left" data-testid="button-demo-carer">
                                <span class="font-medium text-white/80 block">Carer</span>
                                <span class="text-[10px]">Alex Mehmet</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex justify-center">
                <div class="flex items-center gap-2 text-white/30 text-xs">
                    <span class="text-map-teal/60" aria-hidden="true">✓</span>
                    <span>NDIS Registered Provider</span>
                </div>
            </div>
            <button type="button" onclick="speakDescription('MapAble 4.0 sign in page. Sign in with Google, Microsoft, or a MapAble account to access care, transport, employment, and AI assistant services.')" class="audio-desc-link text-white/40 hover:text-white/70 mx-auto flex items-center gap-1.5 mt-2" aria-label="Listen to page description" data-testid="button-audio-desc-login">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                <span>Listen to page description</span>
            </button>
        </div>
    </main>
    <footer role="contentinfo" class="sr-only">
        <p>MapAble 4.0 by Australian Disability Ltd. NDIS Registered Provider.</p>
    </footer>
    <script src="/assets/js/app.js"></script>
</body>
</html>
