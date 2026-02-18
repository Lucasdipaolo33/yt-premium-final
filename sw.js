const CACHE_NAME = 'yt-elite-v30';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

const BLACKLIST = [
    'doubleclick.net', 'googleadservices', 'pagead', 'adservice.google',
    'youtube.com/api/stats/ads', 'innertube/v1/log_event', 'ad_status',
    'securepubads', 'googlesyndication', 'ads/stats/watch', 'pixel.google',
    'youtube.com/api/stats/qoe', 'youtube.com/api/stats/playback',
    'google-analytics.com', 'googletagservices.com', 'google.com/ads',
    'api/stats/atr', 'googletagmanager.com', 'tpc.googlesyndication.com',
    'googleads.g.doubleclick.net', 'gen_204', 'play.google.com/log',
    'imasdk.googleapis.com', 'youtube.com/ptracking', 'ad-delivery',
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
                    const eliteScript = `
                    <script>
                        (function() {
                            // 1. ANULACIÓN DE ADS EN EL MOTOR (JSON e ytcfg)
                            const purify = (obj) => {
                                if (!obj) return;
                                const adKeywords = ['adSlots', 'adPlacements', 'playerAds', 'adBreakService', 'masthead', 'promoted'];
                                adKeywords.forEach(key => { if(obj[key]) delete obj[key]; });
                                if (obj.IS_PREMIUM !== undefined) obj.IS_PREMIUM = true;
                                if (obj.playerConfig) {
                                    obj.playerConfig.adPlacementRenderer = null;
                                }
                            };

                            // Hijacking global para interceptar datos antes de que se rendericen
                            const orgParse = JSON.parse;
                            JSON.parse = function() {
                                const res = orgParse.apply(this, arguments);
                                purify(res);
                                return res;
                            };

                            // 2. SPONSORBLOCK & AUTO-SKIP (Deep Loop)
                            const killAds = () => {
                                const v = document.querySelector('video');
                                if (!v) return;

                                // Si hay rastro de anuncio en el player o clases de anuncio
                                if (document.querySelector('.ad-showing, .ad-interrupting, .ytp-ad-player-overlay')) {
                                    v.muted = true;
                                    v.playbackRate = 16;
                                    if (isFinite(v.duration)) v.currentTime = v.duration - 0.1;
                                    const skip = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .videoAdUiSkipButton');
                                    if (skip) skip.click();
                                }

                                // Limpieza de Banners en Shadow DOM y Root
                                const adSelectors = [
                                    'ytm-promoted-video-renderer', 'ytm-ad-slot-renderer', 
                                    'ytm-companion-ad-renderer', '#player-ads', 
                                    'ad-placement-render', 'ytm-carousel-ad-renderer'
                                ];
                                adSelectors.forEach(s => {
                                    document.querySelectorAll(s).forEach(el => el.remove());
                                });
                            };

                            // 3. SPONSORBLOCK API INTEGRATION
                            const getSponsors = (id) => {
                                fetch('https://sponsor.ajay.app/api/skipSegments?videoID='+id+'&category=["sponsor","intro","selfpromo"]')
                                .then(r => r.json()).then(s => { window._s_b = s; }).catch(e => {});
                            };

                            // 4. MONITOR DE CAMBIOS (MutationObserver)
                            const observer = new MutationObserver(() => {
                                killAds();
                                const vId = new URLSearchParams(window.location.search).get('v');
                                if(vId && window._v_i_d !== vId) {
                                    window._v_i_d = vId;
                                    getSponsors(vId);
                                }
                                // Salto de Sponsors grabados
                                const video = document.querySelector('video');
                                if(video && window._s_b) {
                                    window._s_b.forEach(seg => {
                                        if(video.currentTime >= seg.segment[0] && video.currentTime < seg.segment[1]) {
                                            video.currentTime = seg.segment[1];
                                        }
                                    });
                                }
                            });

                            observer.observe(document.documentElement, { childList: true, subtree: true });
                            setInterval(killAds, 100);

                            // 5. BYPASS DE VISIBILIDAD (Para que siga sonando al bloquear)
                            Object.defineProperties(document, {
                                'visibilityState': { get: () => 'visible' },
                                'hidden': { get: () => false }
                            });
                        })();
                    </script>
                    <style>
                        /* Bloqueo por CSS (Layout Shifting Prevention) */
                        ytm-promoted-video-renderer, ytm-ad-slot-renderer, 
                        .ad-showing, .ad-interrupting, #player-ads, 
                        .ytp-ad-overlay-container, ytm-companion-ad-renderer,
                        ytm-rich-item-renderer:has(ytm-ad-slot-renderer),
                        [class*="ad-unit"], .ytp-paid-content-overlay { 
                            display: none !important; height: 0 !important; pointer-events: none !important; 
                        }
                    </style>`;

                    const modified = html.replace('<head>', '<head>' + eliteScript);
                    return new Response(modified, { headers: response.headers });
                });
            })
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
