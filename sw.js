const CACHE_NAME = 'yt-ultra-v14-final';

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

// 1. SUPER LISTA NEGRA (35 Endpoints de publicidad y rastreo)
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
    'mads', 'amazon-adsystem', 'adnxs', 'smartadserver'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // CAPA 1: FIREWALL DE RED (Bloqueo instantáneo)
    if (BLACKLIST.some(item => url.includes(item))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    // CAPA 2: INYECTOR DE NÚCLEO (Modifica YouTube antes de que abra)
    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request, { headers: { 'Accept-Language': 'sq-AL' } }).then(response => {
                return response.text().then(html => {
                    const nuclearScript = `
                    <style>
                        /* Ocultar todo lo que tenga rastro de publicidad */
                        ytm-promoted-video-renderer, ytm-display-ad-promo-renderer, 
                        ytm-inline-ad-renderer, .ad-showing, .ad-interrupting,
                        .ytp-paid-content-overlay, .ytp-ad-overlay-container,
                        ytm-companion-ad-renderer, [class*="ad-"], [id*="ad-"] { 
                            display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; 
                        }
                    </style>
                    <script>
                        (function() {
                            // BLOQUEO DE EVENTOS DE SALIDA (Para segundo plano)
                            const stopEvents = (e) => {
                                e.stopImmediatePropagation();
                            };
                            window.addEventListener('visibilitychange', stopEvents, true);
                            window.addEventListener('blur', stopEvents, true);
                            Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
                            Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });

                            // HACK DE REPRODUCCIÓN CONTINUA
                            const forceAction = () => {
                                const video = document.querySelector('video');
                                if (video) {
                                    // 1. Si YouTube pausa el video al salir, le damos PLAY de inmediato
                                    if (video.paused && !video.ended && !document.querySelector('.ad-showing')) {
                                        video.play().catch(() => {});
                                    }
                                    // 2. Si detecta anuncio, lo acelera 16 veces y lo salta
                                    if (document.querySelector('.ad-showing, .ad-interrupting')) {
                                        video.muted = true;
                                        video.playbackRate = 16;
                                        if (isFinite(video.duration)) video.currentTime = video.duration - 0.1;
                                        document.querySelectorAll('[class*="skip"]').forEach(btn => btn.click());
                                    }
                                }
                                // 3. Borrar banners y carteles de contenido pago
                                document.querySelectorAll('.ytp-paid-content-overlay, ytm-promoted-video-renderer, ytm-display-ad-promo-renderer').forEach(el => el.remove());
                            };

                            // Ejecución constante cada 40ms para ganar a los scripts de YouTube
                            setInterval(forceAction, 40);

                            // CONFIGURACIÓN DE MEDIA SESSION (Segundo plano nativo)
                            if ('mediaSession' in navigator) {
                                navigator.mediaSession.playbackState = 'playing';
                                navigator.mediaSession.setActionHandler('play', () => { document.querySelector('video')?.play(); });
                                navigator.mediaSession.setActionHandler('pause', () => { document.querySelector('video')?.pause(); });
                            }
                        })();
                    </script>`;
                    
                    // Inyectamos al principio para que sea lo primero que lea el navegador
                    const cleanHtml = html.replace('<head>', '<head>' + nuclearScript);
                    return new Response(cleanHtml, { headers: response.headers });
                });
            }).catch(() => fetch(event.request))
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
