const CACHE_NAME = 'yt-industrial-v21-sponsorblock';

// 1. ACTIVACIÓN Y PURGA
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))))
        ])
    );
});

// 2. BLACKLIST REFORZADA (Bloqueo de peticiones de anuncios)
const BLACKLIST = [
    'doubleclick.net', 'googleadservices', 'pagead', 'adservice.google',
    'youtube.com/api/stats/ads', 'innertube/v1/log_event', 'ad_status',
    'securepubads', 'googlesyndication', 'ads/stats/watch', 'pixel.google',
    'youtube.com/api/stats/qoe', 'youtube.com/api/stats/playback',
    'google-analytics.com', 'googletagservices.com', 'google.com/ads',
    'youtube.com/api/stats/delay', 'api/stats/atr', 'googletagmanager.com',
    'pagead2.googlesyndication.com', 'tpc.googlesyndication.com',
    'googleads.g.doubleclick.net', 'www.google.com/pagead', 's.youtube.com/api/stats',
    'gen_204', 'play.google.com/log', 'imasdk.googleapis.com', 'youtube.com/ptracking',
    'm.youtube.com/api/stats/v2', 'adformat=', 'adunits', 'pwt/', 'fastlane'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Bloqueo inmediato si la URL está en la lista negra
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
                    const finalScript = `
                    <script>
                        (function() {
                            // --- A. INTEGRACIÓN SPONSORBLOCK ---
                            const skipSponsors = (videoId) => {
                                fetch('https://sponsor.ajay.app/api/skipSegments?videoID=' + videoId + '&category=["sponsor","selfpromo","interaction","intro"]')
                                .then(r => r.json())
                                .then(segments => {
                                    window._segments = segments;
                                    console.log("SponsorBlock cargado para: " + videoId);
                                }).catch(() => {});
                            };

                            // --- B. INTERCEPTOR DE DATOS (Anti-Server Side Ads) ---
                            const cleanYTData = (obj) => {
                                if (!obj) return;
                                if (obj.adSlots) obj.adSlots = [];
                                if (obj.adPlacements) obj.adPlacements = [];
                                if (obj.playerAds) obj.playerAds = [];
                                if (obj.adBreakService) delete obj.adBreakService;
                                if (obj.IS_PREMIUM !== undefined) obj.IS_PREMIUM = true;
                            };

                            // Secuestro de JSON.parse para limpiar datos de anuncios en el vuelo
                            const orgParse = JSON.parse;
                            JSON.parse = function() {
                                const res = orgParse.apply(this, arguments);
                                cleanYTData(res);
                                return res;
                            };

                            // --- C. BUCLE DE EJECUCIÓN (5ms) ---
                            setInterval(() => {
                                const video = document.querySelector('video');
                                if (!video) return;

                                // 1. Saltar anuncio tradicional si aparece
                                if (document.querySelector('.ad-showing, .ad-interrupting')) {
                                    video.muted = true;
                                    video.playbackRate = 16;
                                    if (isFinite(video.duration)) video.currentTime = video.duration - 0.1;
                                    document.querySelectorAll('.ytp-ad-skip-button, .ytp-ad-skip-button-modern').forEach(b => b.click());
                                }

                                // 2. Lógica SponsorBlock (Saltar segmentos grabados)
                                if (window._segments) {
                                    const curr = video.currentTime;
                                    window._segments.forEach(s => {
                                        if (curr >= s.segment[0] && curr < s.segment[1]) {
                                            video.currentTime = s.segment[1];
                                        }
                                    });
                                }

                                // 3. Detección de videoID para SponsorBlock
                                const params = new URLSearchParams(window.location.search);
                                const vId = params.get('v');
                                if (vId && window._lastVId !== vId) {
                                    window._lastVId = vId;
                                    skipSponsors(vId);
                                }

                                // 4. Limpieza de interfaz
                                document.querySelectorAll('ytm-promoted-video-renderer, ytm-ad-slot-renderer, #player-ads, .ytp-ad-overlay-container').forEach(e => e.remove());
                            }, 50);

                            // --- D. BACKGROUND PLAY & PREMIUM TRICKS ---
                            Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
                            Object.defineProperty(document, 'hidden', { get: () => false });
                            window.ytcfg = window.ytcfg || {};
                            const oldSet = window.ytcfg.set;
                            window.ytcfg.set = function() {
                                if (arguments[0]) {
                                    arguments[0].IS_PREMIUM = true;
                                    if (arguments[0].PLAYER_VARS) arguments[0].PLAYER_VARS.adformat = null;
                                }
                                return oldSet ? oldSet.apply(this, arguments) : null;
                            };
                        })();
                    </script>
                    <style>
                        .ad-showing, .ad-interrupting, ytm-promoted-video-renderer, 
                        ytm-ad-slot-renderer, .ytp-ad-overlay-container, 
                        .ytp-paid-content-overlay, ytm-companion-ad-renderer { display: none !important; }
                    </style>`;

                    const modified = html.replace('<head>', '<head>' + finalScript);
                    return new Response(modified, { headers: response.headers });
                });
            })
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
