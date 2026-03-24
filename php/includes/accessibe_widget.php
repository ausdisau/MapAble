<?php $accessibeSiteKey = getenv('ACCESSIBE_SITE_KEY') ?: 'YOUR_ACCESSIBE_SITE_KEY_HERE'; ?>
<script>
(function(){
    var siteKey = <?= json_encode($accessibeSiteKey) ?>;
    if (!siteKey || siteKey === 'YOUR_ACCESSIBE_SITE_KEY_HERE') {
        console.warn('accessiBe: Skipping initialization — placeholder site key detected. Set ACCESSIBE_SITE_KEY environment variable with your real key.');
        return;
    }
    var s = document.createElement('script');
    var h = document.querySelector('head') || document.body;
    s.src = 'https://acsbapp.com/apps/app/dist/js/app.js';
    s.async = true;
    s.onload = function(){
        acsbJS.init({
            statementLink: '',
            footerHtml: '',
            hideMobile: false,
            hideTrigger: false,
            language: 'en',
            position: 'left',
            leadColor: '#1B6EB5',
            triggerColor: '#1B6EB5',
            triggerRadius: '50%',
            triggerPositionX: 'left',
            triggerPositionY: 'bottom',
            triggerIcon: 'people',
            triggerSize: 'medium',
            triggerOffsetX: 20,
            triggerOffsetY: 20,
            mobile: {
                triggerSize: 'small',
                triggerPositionX: 'left',
                triggerPositionY: 'bottom',
                triggerOffsetX: 10,
                triggerOffsetY: 10,
                triggerRadius: '50%'
            },
            siteKey: siteKey
        });
    };
    s.onerror = function(){ console.warn('accessiBe: Failed to load widget script from CDN.'); };
    h.appendChild(s);
})();
</script>
