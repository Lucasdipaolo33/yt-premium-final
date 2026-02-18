const CACHE_NAME = 'yt-pro-auto-purge-v50';

// --- 1. AUTOMATIZACIÓN TOTAL: LIMPIEZA DE CACHÉ SIN INTERVENCIÓN ---
self.addEventListener('install', e => {
    self.skipWaiting(); // Fuerza la actualización inmediata
});

self.addEventListener('activate', e => {
    e.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Borra absolutamente todo lo anterior automáticamente
            caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))),
            // Limpia el storage de la web de YouTube
            self.registration.unregister().then(() => console.log("Caché purgado automáticamente"))
        ])
    );
});

// --- 2. EL BLOQUEADOR DE RED (Filtros de AdGuard/uBlock) ---
const BLACKLIST = [
    'doubleclick.net', 'googleadservices', 'pagead', 'adservice.google',
    'youtube.com/api/stats/ads', 'innertube/v1/log_event', 'ad_status',
    'securepubads', 'googlesyndication', 'ads/stats/watch', 'pixel.google',
    'api/stats/atr', 'googletagmanager.com', 'tpc.googlesyndication.com',
    'googleads.g.doubleclick.net', 'gen_204', 'imasdk.googleapis.com', 
    'm.youtube.com/api/stats/v2', 'adformat=', 'adunits', 'pwt/', 'doubleclick'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (BLACKLIST.some(item => url.includes(item))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request).then(response => {
                if (!response.headers.get('content-type')?.includes('text/html')) return response;

                return response.text().then(html => {
                    const hackerScript = `
                    <script>
                        (function() {
                            // --- A. EMULACIÓN DE APK: SEGUNDO PLANO FORZADO ---
                            const unlockBackground = () => {
                                // Engaño de visibilidad
                                Object.defineProperties(document, {
                                    'hidden': { get: () => false },
                                    'visibilityState': { get: () => 'visible' }
                                });

                                // Secuestro de eventos de pausa
                                window.addEventListener('pause', e => {
                                    e.stopImmediatePropagation();
                                    const v = document.querySelector('video');
                                    if (v && !v.ended) v.play().catch(() => {});
                                }, true);

                                // Truco de la MediaSession (Nivel Pro)
                                if ('mediaSession' in navigator) {
                                    navigator.mediaSession.playbackState = 'playing';
                                    navigator.mediaSession.setActionHandler('pause', () => {
                                        document.querySelector('video')?.play();
                                    });
                                }
                            };

                            // --- B. EXTERMINADOR DE BANNERS "ENTRE VIDEOS" ---
                            const killBanners = () => {
                                // Buscamos por estructura de datos, no solo por nombre de clase
                                const adElements = document.querySelectorAll('ytm-rich-item-renderer, ytm-ad-slot-renderer, ytm-promoted-video-renderer');
                                adElements.forEach(el => {
                                    if (el.innerHTML.includes('ad-') || el.innerHTML.includes('publicitado') || el.querySelector('[class*="ad-"]')) {
                                        el.remove();
                                    }
                                });
                            };

                            // --- C. INTERCEPTOR DE JSON (Limpieza de raíz) ---
                            const orgParse = JSON.parse;
                            JSON.parse = function() {
                                const res = orgParse.apply(this, arguments);
                                if (res?.adPlacements) res.adPlacements = [];
                                if (res?.playerAds) res.playerAds = [];
                                return res;
                            };

                            // Ejecución constante
                            setInterval(() => {
                                unlockBackground();
                                killBanners();
                                // Salto de anuncios de video
                                const v = document.querySelector('video');
                                if (document.querySelector('.ad-showing')) {
                                    v.playbackRate = 16;
                                    v.currentTime = v.duration - 0.1;
                                    document.querySelector('.ytp-ad-skip-button')?.click();
                                }
                            }, 100);

                            // Auto-limpieza de historial de búsqueda de anuncios
                            try { localStorage.clear(); sessionStorage.clear(); } catch(e){}
                        })();
                    </script>
                    <style>
                        /* Oculta los banners publicitados que aparecen al scrollear */
                        ytm-rich-item-renderer:has(.ytm-ad-slot-renderer),
                        ytm-ad-slot-renderer, .ytp-ad-overlay-container,
                        [class*="ad-unit"], .ad-showing { display: none !important; }
                    </style>`;

                    const modified = html.replace('<head>', '<head>' + hackerScript);
                    return new Response(modified, { headers: response.headers });
                });
            })
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
