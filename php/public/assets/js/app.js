function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    document.cookie = 'theme=' + (isDark ? 'dark' : 'light') + ';path=/;max-age=31536000';
}

function speakDescription(text) {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1;
        u.pitch = 1;
        window.speechSynthesis.speak(u);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const theme = document.cookie.split(';').find(c => c.trim().startsWith('theme='));
    if (theme && theme.includes('dark')) {
        document.documentElement.classList.add('dark');
    }
});
