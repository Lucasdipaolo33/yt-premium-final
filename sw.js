const CACHE_NAME = 'yt-pro-industrial-v25';

// 1. INSTALACIÓN Y LIMPIEZA INMEDIATA
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))));
});

// 2. LISTA NEGRA DE DOMINIOS PUBLICITARIOS (uBlock Level)
const BLACKLIST = [
    'doubleclick.net', 'googleadservices', 'pagead', 'adservice.google',
    'youtube.com/api/stats/ads', 'innertube/v1/log_event', 'ad_status',
    'securepubads', 'googlesyndication', 'ads/stats/watch', 'pixel.google',
    'youtube.com/api/stats/qoe', 'youtube.com/api/stats/playback',
    'google-analytics.com', 'googletagservices.com', 'google.com/ads',
    'api/stats/atr', 'googletagmanager.com', 'tpc.googlesyndication.com',
    'googleads.g.doubleclick.net', 'gen_204', 'play.google.com/log',
    'imasdk.googleapis.com', 'youtube.com/ptracking', 'ad-delivery',
    'm.youtube.com/api/stats/v2', 'adformat=', 'adunits', 'pwt/'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Bloqueo de red: Si la URL es de anuncios, respondemos vacío
    if (BLACKLIST.some(item => url.includes(item))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request).then(response => {
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('text/html')) return response;

                return response.text().then(html => {
                    const injectedCode = `
                    <script>
                        (function() {
                            // A. LÓGICA SPONSORBLOCK (Salto de segmentos integrados)
                            const loadSponsorBlock = (videoId) => {
                                fetch('https://sponsor.ajay.app/api/skipSegments?videoID=' + videoId + '&category=["sponsor","selfpromo","interaction","intro"]')
                                .then(r => r.json()).then(segments => { window._ytSegments = segments; })
                                .catch(() => {});
                            };

                            // B. INTERCEPTOR DE DATOS PARA MÓVIL (Limpia el JSON de YouTube)
                            const cleanData = (obj) => {
                                if (!obj) return;
                                ['adSlots', 'adPlacements', 'playerAds', 'adBreakService'].forEach(key => delete obj[key]);
                                if (obj.IS_PREMIUM !== undefined) obj.IS_PREMIUM = true;
                            };

                            const orgParse = JSON.parse;
                            JSON.parse = function() {
                                const res = orgParse.apply(this, arguments);
                                cleanData(res);
                                return res;
                            };

                            // C. ELIMINACIÓN AGRESIVA (Cada 50ms para móviles)
                            setInterval(() => {
                                const v = document.querySelector('video');
                                if (!v) return;

                                // 1. Saltar anuncio tradicional (Mute + Speed 16x)
                                if (document.querySelector('.ad-showing, .ad-interrupting')) {
                                    v.muted = true;
                                    v.playbackRate = 16;
                                    if (isFinite(v.duration)) v.currentTime = v.duration - 0.1;
                                    document.querySelectorAll('.ytp-ad-skip-button, .ytp-ad-skip-button-modern').forEach(b => b.click());
                                }

                                // 2. Ejecutar SponsorBlock
                                if (window._ytSegments) {
                                    window._ytSegments.forEach(s => {
                                        if (v.currentTime >= s.segment[0] && v.currentTime < s.segment[1]) {
                                            v.currentTime = s.segment[1];
                                        }
                                    });
                                }

                                // 3. Detectar cambio de video
                                const vId = new URLSearchParams(window.location.search).get('v');
                                if (vId && window._currentVId !== vId) {
                                    window._currentVId = vId;
                                    loadSponsorBlock(vId);
                                }

                                // 4. Limpieza de interfaz (Banners y Shorts publicitarios)
                                const selectors = 'ytm-promoted-video-renderer, ytm-ad-slot-renderer, #player-ads, .ytp-ad-overlay-container, ytm-companion-ad-renderer, ytm-rich-item-renderer:has(ytm-ad-slot-renderer)';
                                document.querySelectorAll(selectors).forEach(el => el.remove());
                            }, 50);

                            // D. TRUCO DE SEGUNDO PLANO (Background Play)
                            Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
                            Object.defineProperty(document, 'hidden', { get: () => false });
                        })();
                    </script>
                    <style>
                        /* Ocultar rastro de anuncios por CSS */
                        .ad-showing, .ad-interrupting, ytm-promoted-video-renderer, 
                        ytm-ad-slot-renderer, .ytp-ad-overlay-container, 
                        ytm-companion-ad-renderer, [class*="ad-unit"] { display: none !important; visibility: hidden !important; }
                    </style>`;

                    const modifiedHtml = html.replace('<head>', '<head>' + injectedCode);
                    return new Response(modifiedHtml, { headers: response.headers });
                });
            })
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
