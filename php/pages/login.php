<?php $pageTitle = 'Sign In'; ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In | MapAble 4.0</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>tailwind.config={theme:{extend:{colors:{'map-blue':'#1B6EB5','map-teal':'#2EAA6E','map-gold':'#E6A817','map-navy':'#14578F','map-dark':'#0F1A2E'}}}}</script>
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body class="min-h-screen flex flex-col" style="background:linear-gradient(135deg,#0F1A2E 0%,#14578F 50%,#1B6EB5 100%)">
    <div class="flex h-[3px] shrink-0">
        <div class="flex-1 bg-map-teal"></div>
        <div class="flex-1" style="background:#1A4B7A"></div>
        <div class="flex-1 bg-map-gold"></div>
    </div>
    <div class="flex-1 flex items-center justify-center px-4 py-12">
        <div class="w-full max-w-md space-y-8">
            <div class="text-center space-y-4">
                <div class="flex justify-center">
                    <img src="/assets/images/logo.png" alt="MapAble" class="w-20 h-20 rounded-2xl shadow-lg" data-testid="img-login-logo">
                </div>
                <div>
                    <h1 class="text-3xl font-black tracking-tight text-white">
                        <span class="text-map-gold">MapAble</span>
                        <span class="text-white/60 text-lg font-bold">4.0</span>
                    </h1>
                    <p class="text-white/60 text-sm mt-1 tracking-wide">Empowering Independence</p>
                </div>
                <div class="flex justify-center gap-6 pt-2">
                    <div class="flex flex-col items-center gap-1"><span class="text-map-teal text-lg">♥</span><span class="text-[10px] text-white/50 font-medium">Care</span></div>
                    <div class="flex flex-col items-center gap-1"><span class="text-map-teal text-lg">🚌</span><span class="text-[10px] text-white/50 font-medium">Transport</span></div>
                    <div class="flex flex-col items-center gap-1"><span class="text-map-teal text-lg">💼</span><span class="text-[10px] text-white/50 font-medium">Employment</span></div>
                    <div class="flex flex-col items-center gap-1"><span class="text-map-teal text-lg">🤖</span><span class="text-[10px] text-white/50 font-medium">AI Chat</span></div>
                </div>
            </div>

            <div class="border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl rounded-xl">
                <div class="pb-4 pt-6 px-6">
                    <h2 class="text-lg font-semibold text-white text-center">Sign in to your account</h2>
                </div>
                <div class="px-6 pb-6">
                    <form method="POST" action="/login" class="space-y-4">
                        <?= csrfField() ?>
                        <?php if (!empty($loginError)): ?>
                        <div class="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5" data-testid="text-login-error">
                            <span>⚠</span>
                            <span><?= h($loginError) ?></span>
                        </div>
                        <?php endif; ?>

                        <div class="space-y-2">
                            <label for="username" class="text-white/80 text-sm block">Username</label>
                            <input id="username" name="username" type="text" required autocomplete="username"
                                class="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-map-teal h-11"
                                placeholder="Enter your username" value="<?= h($_POST['username'] ?? '') ?>" data-testid="input-username">
                        </div>

                        <div class="space-y-2">
                            <label for="password" class="text-white/80 text-sm block">Password</label>
                            <input id="password" name="password" type="password" required autocomplete="current-password"
                                class="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-map-teal h-11"
                                placeholder="Enter your password" data-testid="input-password">
                        </div>

                        <button type="submit" class="btn btn-teal w-full h-11 text-sm font-semibold" data-testid="button-login">
                            Sign In
                        </button>
                    </form>

                    <div class="mt-6 pt-4 border-t border-white/10">
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
                    <span class="text-map-teal/60">✓</span>
                    <span>NDIS Registered Provider</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
