const CACHE_NAME = 'yt-nuclear-v17-5ms';

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

// LISTA NEGRA DEFINITIVA (50 dominios de bloqueo total)
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
    'youtube.com/api/stats/ads/v2', 'google.com/ads/measurement', 'google.ad.smart',
    'imasdk.googleapis.com', 'youtube.com/pagead', 'stats.g.doubleclick.net', 
    'ads.youtube.com', 'pagead-google.l.google.com', 'ad.doubleclick.net',
    'adservice.google.com.ar', 'adservice.google.com', 'analytic-google.com'
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
                return response.text().then(html => {
                    const nuclearScript = `
                    <style>
                        /* Bloqueo visual agresivo */
                        [ad-unit], [class*="ad-"], [id*="ad-"], [class*="promo"], 
                        ytm-promoted-video-renderer, ytm-display-ad-promo-renderer,
                        ytm-inline-ad-renderer, .ytp-ad-overlay-container,
                        ytm-companion-ad-renderer, ytm-merch-shelf-renderer,
                        .yt-ad-label, #player-ads, .ad-showing, .ad-interrupting,
                        .ytp-paid-content-overlay, ytm-ad-slot-renderer { 
                            display: none !important; visibility: hidden !important; 
                            height: 0px !important; pointer-events: none !important;
                        }
                    </style>
                    <script>
                        (function() {
                            // BLOQUEO DE PAUSA (Inmortalidad del audio)
                            const originalPause = HTMLMediaElement.prototype.pause;
                            HTMLMediaElement.prototype.pause = function() {
                                if (!this.ended && this.readyState > 2) return; 
                                return originalPause.apply(this, arguments);
                            };

                            const killAll = () => {
                                const video = document.querySelector('video');
                                
                                // 1. SALTO DE ANUNCIO INSTANTÁNEO
                                if (document.querySelector('.ad-showing, .ad-interrupting')) {
                                    if (video) {
                                        video.muted = true;
                                        video.playbackRate = 16;
                                        if (isFinite(video.duration)) video.currentTime = video.duration - 0.1;
                                    }
                                    document.querySelectorAll('[class*="skip"]').forEach(b => b.click());
                                }

                                // 2. LIMPIEZA DE BANNERS POR TEXTO
                                document.querySelectorAll('span, div, a').forEach(el => {
                                    const t = el.innerText.toLowerCase();
                                    if (t === 'anuncio' || t === 'anuncios' || t === 'promocionado' || t === 'ads') {
                                        el.closest('ytm-item-section-renderer')?.remove();
                                        el.closest('ytm-ad-slot-renderer')?.remove();
                                        el.parentElement?.remove();
                                    }
                                });

                                // 3. AUTO-PLAY SI SE PAUSA EN SEGUNDO PLANO
                                if (video && video.paused && !video.ended && !document.querySelector('.ad-showing')) {
                                    video.play().catch(() => {});
                                }
                            };

                            // EJECUCIÓN CADA 5 MILISEGUNDOS
                            setInterval(killAll, 5);

                            // MEDIA SESSION (Identidad de reproductor de música)
                            if ('mediaSession' in navigator) {
                                navigator.mediaSession.playbackState = 'playing';
                                navigator.mediaSession.metadata = new MediaMetadata({
                                    title: 'YouTube Premium PRO',
                                    artist: 'Audio Infinito',
                                    album: 'Sistema'
                                });
                            }

                            Object.defineProperty(document, 'hidden', { get: () => false });
                            Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
                            window.addEventListener('blur', (e) => e.stopImmediatePropagation(), true);
                        })();
                    </script>`;
                    
                    const modified = html.replace('<head>', '<head>' + nuclearScript);
                    return new Response(modified, { headers: response.headers });
                });
            })
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
