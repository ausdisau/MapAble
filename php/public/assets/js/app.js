function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    document.cookie = 'theme=' + (isDark ? 'dark' : 'light') + ';path=/;max-age=31536000';
    const btn = document.querySelector('[data-testid="button-theme-toggle"]');
    if (btn) btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    announce(isDark ? 'Dark mode enabled' : 'Light mode enabled');
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const btn = document.querySelector('[data-testid="button-mobile-menu"]');
    if (!menu) return;
    const isHidden = menu.classList.toggle('hidden');
    if (btn) btn.setAttribute('aria-expanded', isHidden ? 'false' : 'true');
    if (!isHidden) {
        const firstLink = menu.querySelector('a');
        if (firstLink) firstLink.focus();
    }
    announce(isHidden ? 'Navigation menu closed' : 'Navigation menu opened');
}

function announce(message) {
    const el = document.getElementById('a11y-announcer');
    if (el) {
        el.textContent = '';
        requestAnimationFrame(() => { el.textContent = message; });
    }
}

function speakDescription(text) {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1;
        u.pitch = 1;
        u.lang = 'en-AU';
        window.speechSynthesis.speak(u);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const theme = document.cookie.split(';').find(c => c.trim().startsWith('theme='));
    if (theme && theme.includes('dark')) {
        document.documentElement.classList.add('dark');
        const btn = document.querySelector('[data-testid="button-theme-toggle"]');
        if (btn) btn.setAttribute('aria-pressed', 'true');
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const menu = document.getElementById('mobile-menu');
            const btn = document.querySelector('[data-testid="button-mobile-menu"]');
            if (menu && !menu.classList.contains('hidden')) {
                menu.classList.add('hidden');
                if (btn) {
                    btn.setAttribute('aria-expanded', 'false');
                    btn.focus();
                }
            }
        }
    });
});
