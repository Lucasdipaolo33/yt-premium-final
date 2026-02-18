const CACHE_NAME = 'yt-industrial-v20-extreme';

// 1. ACTIVACIÓN Y LIMPIEZA
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))))
        ])
    );
});

// 2. BLACKLIST AMPLIADA (Nuevos endpoints detectados)
const BLACKLIST = [
    'doubleclick.net', 'googleadservices', 'pagead', 'adservice.google',
    'youtube.com/api/stats/ads', 'innertube/v1/log_event', 'ad_status',
    'securepubads', 'googlesyndication', 'ads/stats/watch', 'pixel.google',
    'youtube.com/api/stats/qoe', 'youtube.com/api/stats/playback',
    'google-analytics.com', 'googletagservices.com', 'google.com/ads',
    'youtube.com/api/stats/delay', 'api/stats/atr', 'googletagmanager.com',
    'pagead2.googlesyndication.com', 'tpc.googlesyndication.com',
    'googleads.g.doubleclick.net', 'www.google.com/pagead', 's.youtube.com/api/stats',
    'get_midroll_info', 'adclick.g.doubleclick.net', 'static.doubleclick.net',
    'bid.g.doubleclick.net', 'gen_204', 'play.google.com/log', 'partnerad.l.google.com',
    'mads.amazon-adsystem', 'pubads.g.doubleclick', 'googleads4.g.doubleclick',
    'imasdk.googleapis.com', 'stats.g.doubleclick', 'youtube.com/ptracking',
    'ad-delivery', 'vpaid.ads', 'google.com/asw', 'youtube.com/csi',
    'm.youtube.com/api/stats/v2', 'adformat=', 'adunits', 'pwt/', 'fastlane',
    'sb.scorecardresearch.com', 'youtube.com/api/stats/ads', 
    'youtube.com/error_204', 'google.com/pagead', 'pagead2.googleadservices'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // A. BLOQUEO DE RED (Si es anuncio, ni siquiera se pide)
    if (BLACKLIST.some(item => url.includes(item))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    // B. MODIFICACIÓN DEL HTML DE YOUTUBE MÓVIL
    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Si la respuesta no es HTML, la pasamos tal cual
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('text/html')) {
                        return response;
                    }

                    return response.text().then(html => {
                        const extremeScript = `
                        <script>
                            (function() {
                                // 1. FORZAR ESTADO PREMIUM EN CUALQUIER VARIABLE
                                const forcePremium = () => {
                                    if (window.ytcfg && window.ytcfg.data_) {
                                        const d = window.ytcfg.data_;
                                        if (d.EXPERIMENT_FLAGS) d.EXPERIMENT_FLAGS.control_notification_for_external_ads = false;
                                        d.IS_PREMIUM = true;
                                        d.LOGGED_IN = true;
                                    }
                                    window.ytplayer = window.ytplayer || {};
                                    window.ytplayer.config = window.ytplayer.config || {};
                                    if (window.ytplayer.config.args) {
                                        window.ytplayer.config.args.is_premium = "1";
                                        window.ytplayer.config.args.ad_device_id = "";
                                    }
                                };

                                // 2. ESCÁNER DE ANUNCIOS (Detección de rastro en el player)
                                const killAds = () => {
                                    const video = document.querySelector('video');
                                    const adShowing = document.querySelector('.ad-showing, .ad-interrupting, .ytp-ad-player-overlay');
                                    
                                    if (adShowing && video) {
                                        video.muted = true;
                                        video.playbackRate = 16;
                                        if (isFinite(video.duration)) video.currentTime = video.duration - 0.1;
                                        
                                        // Clic automático en botones de "Saltar"
                                        const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .videoAdUiSkipButton');
                                        if (skipBtn) skipBtn.click();
                                    }

                                    // Borrar banners y elementos publicitarios dinámicos
                                    const selectors = [
                                        'ytm-promoted-video-renderer', 'ytm-ad-slot-renderer', 
                                        '#player-ads', '.ytp-ad-overlay-container', 'ytm-companion-ad-renderer'
                                    ];
                                    selectors.forEach(s => {
                                        document.querySelectorAll(s).forEach(el => el.remove());
                                    });
                                };

                                // Ejecución continua
                                setInterval(() => {
                                    forcePremium();
                                    killAds();
                                }, 100); 

                                // 3. PROTECCIÓN CONTRA PAUSAS (Background Play)
                                Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
                                Object.defineProperty(document, 'hidden', { get: () => false });
                            })();
                        </script>
                        <style>
                            /* Ocultar anuncios por CSS para que no parpadeen */
                            .ad-showing, .ad-interrupting, ytm-promoted-video-renderer, 
                            ytm-ad-slot-renderer, .ytp-ad-overlay-container, 
                            .ytp-paid-content-overlay { display: none !important; }
                        </style>`;

                        const modifiedHtml = html.replace('<head>', '<head>' + extremeScript);
                        return new Response(modifiedHtml, {
                            headers: response.headers
                        });
                    });
                })
                .catch(() => fetch(event.request))
        );
        return;
    }

    event.respondWith(fetch(event.request));
});
