const CACHE_NAME = 'yt-ultra-v11';

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

// LISTA NEGRA DE DOMINIOS (Matamos el 100% de los anuncios de red)
const BLACKLIST = [
    'doubleclick.net', 'googleadservices', 'pagead', 'adservice.google',
    'youtube.com/api/stats/ads', 'innertube/v1/log_event', 'ad_status',
    'securepubads', 'googlesyndication', 'ads/stats/watch', 'pixel.google'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // CAPA 1: FIREWALL INSTANTÁNEO
    if (BLACKLIST.some(item => url.includes(item))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    // CAPA 2: PROXY INVERSO (Intercepta y limpia el HTML antes de que abra)
    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request, { headers: { 'Accept-Language': 'sq-AL' } }).then(response => {
                return response.text().then(html => {
                    const nuclearScript = `
                    <style>
                        /* Elimina carteles de "Contenido Pago", Banners, y Promociones */
                        ytm-promoted-video-renderer, ytm-display-ad-promo-renderer, 
                        ytm-inline-ad-renderer, .ad-showing, .ad-interrupting,
                        .pyv-afc-ads-container, #player-ads, ytm-companion-ad-renderer,
                        .ytp-paid-content-overlay, .ytp-paid-content-overlay-text,
                        [class*="ad-"], [id*="ad-"] { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; pointer-events: none !important; }
                    </style>
                    <script>
                        (function() {
                            // BLOQUEO INTERNO DE FETCH (Para que nada de Google Ads pase)
                            const originalFetch = window.fetch;
                            window.fetch = function() {
                                if (arguments[0] && typeof arguments[0] === 'string' && (arguments[0].includes('ads') || arguments[0].includes('log_event'))) {
                                    return Promise.resolve(new Response('', { status: 200 }));
                                }
                                return originalFetch.apply(this, arguments);
                            };

                            // EXTERMINADOR DE VIDEO (Cada 30ms para ser mil veces más rápido)
                            const scan = () => {
                                const video = document.querySelector('video');
                                if (document.querySelector('.ad-showing, .ad-interrupting')) {
                                    if (video && isFinite(video.duration)) {
                                        video.muted = true;
                                        video.playbackRate = 16;
                                        video.currentTime = video.duration - 0.1;
                                    }
                                    document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button-slot')?.click();
                                }
                                
                                // Eliminar el cartel de "Contiene anuncios pagos" de raíz
                                document.querySelectorAll('.ytp-paid-content-overlay').forEach(el => el.remove());
                            };
                            
                            setInterval(scan, 30);

                            // ACTIVAR SEGUNDO PLANO (Hack de visibilidad)
                            Object.defineProperty(document, 'hidden', { get: () => false });
                            Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
                            
                            // HACK DE MEDIA SESSION (Para que no se corte al bloquear pantalla)
                            if ('mediaSession' in navigator) {
                                navigator.mediaSession.setActionHandler('play', () => { document.querySelector('video')?.play(); });
                                navigator.mediaSession.setActionHandler('pause', () => { document.querySelector('video')?.pause(); });
                            }
                        })();
                    </script>`;
                    
                    const cleanHtml = html.replace('<head>', '<head>' + nuclearScript);
                    return new Response(cleanHtml, { headers: response.headers });
                });
            }).catch(() => fetch(event.request))
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
