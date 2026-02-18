const CACHE_NAME = 'yt-elite-final-v40';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// BLACKLIST TOTAL (Actualizada con endpoints de trackers de banners móviles)
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
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('text/html')) return response;

                return response.text().then(html => {
                    const ultraScript = `
                    <script>
                        (function() {
                            // --- 1. SEGUNDO PLANO INFINITO (Background Play) ---
                            const forcePlay = () => {
                                const v = document.querySelector('video');
                                if (v && v.paused && !v.ended && window._isAppActive) {
                                    v.play().catch(() => {});
                                }
                            };
                            window._isAppActive = true;
                            
                            // Engañamos a la API de visibilidad
                            Object.defineProperties(document, {
                                'hidden': { get: () => false },
                                'visibilityState': { get: () => 'visible' }
                            });

                            // Bloqueamos el evento de pausa de YouTube
                            window.addEventListener('pause', (e) => {
                                if (document.querySelector('video')?.classList.contains('video-stream')) {
                                    e.stopImmediatePropagation();
                                }
                            }, true);

                            // --- 2. EXTERMINADOR DE BANNERS (Shadow DOM Piercing) ---
                            const deepClean = () => {
                                // Selectores de banners conocidos
                                const selectors = [
                                    'ytm-promoted-video-renderer', 'ytm-ad-slot-renderer', 
                                    'ytm-companion-ad-renderer', 'ytm-carousel-ad-renderer',
                                    '#player-ads', 'ad-placement-render', 'ytm-brand-video-singleton-renderer'
                                ];
                                
                                selectors.forEach(s => {
                                    document.querySelectorAll(s).forEach(el => el.remove());
                                });

                                // Perforar Shadow DOM para buscar banners ocultos
                                const allElements = document.querySelectorAll('*');
                                allElements.forEach(el => {
                                    if (el.shadowRoot) {
                                        selectors.forEach(s => {
                                            el.shadowRoot.querySelectorAll(s).forEach(e => e.remove());
                                        });
                                    }
                                });
                            };

                            // --- 3. INTERCEPTOR DE DATOS (Anti-Publicidad de Raíz) ---
                            const orgParse = JSON.parse;
                            JSON.parse = function() {
                                const res = orgParse.apply(this, arguments);
                                if (res && res.adPlacements) res.adPlacements = [];
                                if (res && res.playerAds) res.playerAds = [];
                                if (res && res.adSlots) res.adSlots = [];
                                if (res && res.masthead) delete res.masthead;
                                return res;
                            };

                            // --- 4. BUCLE DE ALTA FRECUENCIA (Anti-Anuncios en Video) ---
                            setInterval(() => {
                                const video = document.querySelector('video');
                                if (!video) return;

                                if (document.querySelector('.ad-showing, .ad-interrupting')) {
                                    video.muted = true;
                                    video.playbackRate = 16;
                                    if (isFinite(video.duration)) video.currentTime = video.duration - 0.1;
                                    document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern')?.click();
                                }
                                deepClean();
                            }, 100);

                            // --- 5. ACTIVACIÓN DE SPONSORBLOCK ---
                            const getSB = (id) => {
                                fetch('https://sponsor.ajay.app/api/skipSegments?videoID='+id+'&category=["sponsor","intro","selfpromo"]')
                                .then(r => r.json()).then(s => { window._sb = s; }).catch(() => {});
                            };

                            // Monitoreo de cambio de video
                            setInterval(() => {
                                const vId = new URLSearchParams(window.location.search).get('v');
                                if (vId && window._lastId !== vId) {
                                    window._lastId = vId;
                                    getSB(vId);
                                }
                                if (window._sb && video) {
                                    window._sb.forEach(seg => {
                                        if (video.currentTime >= seg.segment[0] && video.currentTime < seg.segment[1]) {
                                            video.currentTime = seg.segment[1];
                                        }
                                    });
                                }
                            }, 500);

                        })();
                    </script>
                    <style>
                        /* Bloqueo estético total */
                        ytm-promoted-video-renderer, ytm-ad-slot-renderer, 
                        .ad-showing, .ad-interrupting, #player-ads, 
                        ytm-companion-ad-renderer, [class*="ad-unit"],
                        ytm-rich-item-renderer:has(ytm-ad-slot-renderer),
                        .ytp-paid-content-overlay, ytm-brand-video-singleton-renderer { 
                            display: none !important; 
                            height: 0 !important; 
                            visibility: hidden !important; 
                            opacity: 0 !important;
                            pointer-events: none !important;
                        }
                    </style>`;

                    const modified = html.replace('<head>', '<head>' + ultraScript);
                    return new Response(modified, { headers: response.headers });
                });
            })
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
