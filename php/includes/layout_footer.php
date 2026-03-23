        </main>

        <footer role="contentinfo" class="sr-only" aria-label="Application information">
            <p>MapAble 4.0 by Australian Disability Ltd. NDIS Registered Provider. WCAG 2.2 AA Compliant.</p>
        </footer>
    </div>

    <div aria-live="assertive" aria-atomic="true" role="alert" id="toast-region" class="fixed bottom-4 right-4 z-50">
        <?php $flash = getFlash(); if ($flash): ?>
        <div id="toast" class="px-4 py-3 rounded-lg shadow-lg text-sm font-medium
            <?= $flash['type'] === 'success' ? 'bg-map-teal text-white' : 'bg-red-500 text-white' ?>"
            data-testid="toast-message">
            <?= h($flash['message']) ?>
        </div>
        <script>setTimeout(() => document.getElementById('toast')?.remove(), 4000);</script>
        <?php endif; ?>
    </div>

    <div aria-live="polite" aria-atomic="true" id="a11y-announcer" class="sr-only" role="status" data-testid="text-a11y-announcer"></div>

    <script src="/assets/js/app.js"></script>
</body>
</html>
