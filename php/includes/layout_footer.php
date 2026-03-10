        </main>
    </div>

    <?php $flash = getFlash(); if ($flash): ?>
    <div id="toast" class="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium
        <?= $flash['type'] === 'success' ? 'bg-map-teal text-white' : 'bg-red-500 text-white' ?>"
        data-testid="toast-message">
        <?= h($flash['message']) ?>
    </div>
    <script>setTimeout(() => document.getElementById('toast')?.remove(), 4000);</script>
    <?php endif; ?>

    <script src="/assets/js/app.js"></script>
</body>
</html>
