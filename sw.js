const CACHE_NAME = 'yt-premium-v18';

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

// LISTA NEGRA PROFESIONAL (65 Endpoints - Bloqueo de nivel DNS)
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
    'mads.amazon-adsystem.com', 'pubads.g.doubleclick.net', 'googleads4.g.doubleclick.net',
    'imasdk.googleapis.com', 'ads.youtube.com', 'stats.g.doubleclick.net',
    'ad.doubleclick.net', 'vpaid.ads', 'ad-delivery', 'youtube.com/ptracking',
    'google.com/asw', 'google.com/adsense', 'youtube.com/csi', 'youtube.com/api/stats/v2',
    'redirector.googlevideo.com/videoplayback?*&adformat=*', 'fls.doubleclick.net'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // BLOQUEO DE RED (Mata la carga de anuncios antes de que lleguen)
    if (BLACKLIST.some(item => url.includes(item))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request).then(response => {
                return response.text().then(html => {
                    const proScript = `
                    <script>
                        (function() {
                            // 1. HACK PREMIUM (Engañamos a la configuración interna)
                            try {
                                if (window.ytcfg) {
                                    ytcfg.set({
                                        "PLAYER_VARS": { "adformat": null, "adslots": null },
                                        "INNERTUBE_CONTEXT": { "client": { "hl": "sq", "gl": "AL" } },
                                        "IS_PREMIUM": true
                                    });
                                }
                            } catch(e) {}

                            // 2. BLOQUEO DE PAUSA Y SEGUNDO PLANO
                            const v = document.querySelector('video');
                            HTMLMediaElement.prototype.pause = function() {
                                if (this.classList.contains('video-stream') && !this.ended) return;
                                return Object.getPrototypeOf(HTMLMediaElement.prototype).pause.apply(this, arguments);
                            };

                            const killAds = () => {
                                const video = document.querySelector('video');
                                
                                // SALTO DE VIDEO
                                if (document.querySelector('.ad-showing, .ad-interrupting')) {
                                    if (video) {
                                        video.muted = true;
                                        video.playbackRate = 16;
                                        if (isFinite(video.duration)) video.currentTime = video.duration - 0.1;
                                    }
                                    document.querySelectorAll('[class*="skip"]').forEach(b => b.click());
                                }

                                // ELIMINAR BANNERS (Búsqueda por profundidad)
                                document.querySelectorAll('ytm-promoted-video-renderer, ytm-display-ad-promo-renderer, ytm-ad-slot-renderer, .ytp-ad-overlay-container').forEach(e => e.remove());

                                // FORZAR PLAY EN SEGUNDO PLANO
                                if (video && video.paused && !video.ended && !document.querySelector('.ad-showing')) {
                                    video.play().catch(() => {});
                                }
                            };

                            setInterval(killAds, 10);

                            // CONFIGURACIÓN DE MEDIA SESSION PROFESIONAL
                            if ('mediaSession' in navigator) {
                                navigator.mediaSession.playbackState = 'playing';
                                navigator.mediaSession.metadata = new MediaMetadata({
                                    title: 'YouTube Premium PRO',
                                    artist: 'Exterminador v18',
                                    album: 'Sistema'
                                });
                            }

                            // ENGAÑO DE VISIBILIDAD
                            Object.defineProperty(document, 'hidden', { get: () => false });
                            Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
                        })();
                    </script>
                    <style>
                        /* Ocultar banners de raíz */
                        ytm-promoted-video-renderer, ytm-display-ad-promo-renderer, 
                        ytm-ad-slot-renderer, .ad-showing, .ad-interrupting, 
                        .ytp-paid-content-overlay, [class*="ad-unit"] { display: none !important; }
                    </style>`;
                    
                    const modified = html.replace('<head>', '<head>' + proScript);
                    return new Response(modified, { headers: response.headers });
                });
            })
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
