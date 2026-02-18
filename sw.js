const CACHE_NAME = 'yt-bypass-v70-ULTIMATE';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
    e.waitUntil(self.clients.claim());
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
});

// LISTA NEGRA AGRESIVA (Bloqueo de Scripts de anuncios)
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
                    const nuclearScript = `
                    <script>
                        (function() {
                            // --- 1. SEGUNDO PLANO (PICTURE IN PICTURE FORZADO) ---
                            // Esto hace que el video no se detenga al salir de la app
                            const setupBackground = () => {
                                const video = document.querySelector('video');
                                if (video) {
                                    video.setAttribute('pip', 'true');
                                    video.setAttribute('playsinline', 'true');
                                    video.setAttribute('webkit-playsinline', 'true');
                                    
                                    // Hack para MediaSession
                                    if ('mediaSession' in navigator) {
                                        navigator.mediaSession.playbackState = 'playing';
                                        // Evitamos que YT pause el video al perder el foco
                                        navigator.mediaSession.setActionHandler('pause', () => { video.play(); });
                                    }
                                }
                            };

                            // --- 2. ELIMINACIÓN DE BANNERS POR 'DOM MUTATION' ---
                            // Detecta el banner antes de que se dibuje y lo destruye
                            const observer = new MutationObserver(() => {
                                // Selectores de banners de scroll (Publicitados)
                                const adSelectors = [
                                    'ytm-promoted-video-renderer', 'ytm-ad-slot-renderer', 
                                    'ytm-companion-ad-renderer', 'ytm-carousel-ad-renderer',
                                    'ytm-rich-item-renderer:has(.ytm-ad-slot-renderer)',
                                    '[class*="ad-unit"]', '.ad-showing'
                                ];
                                
                                adSelectors.forEach(s => {
                                    document.querySelectorAll(s).forEach(el => {
                                        el.style.display = 'none';
                                        el.remove();
                                    });
                                });

                                // Si detecta anuncio en video: velocidad 16x
                                const v = document.querySelector('video');
                                if (document.querySelector('.ad-showing')) {
                                    if (v) {
                                        v.muted = true;
                                        v.playbackRate = 16;
                                        if (isFinite(v.duration)) v.currentTime = v.duration - 0.1;
                                    }
                                    document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern')?.click();
                                }
                                setupBackground();
                            });

                            observer.observe(document.body, { childList: true, subtree: true });

                            // --- 3. CAMBIO DE IDENTIDAD (Logo Premium) ---
                            setInterval(() => {
                                const logo = document.querySelector('ytm-masthead-logo-renderer .header-logo-icon');
                                if (logo) {
                                    logo.style.content = "url('https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Premium_logo_2017.svg')";
                                    logo.style.width = "90px";
                                }
                            }, 500);

                            // --- 4. HACK DE VISIBILIDAD (Para que no se de cuenta que bloqueaste el cel) ---
                            window.addEventListener('visibilitychange', e => e.stopImmediatePropagation(), true);
                            window.addEventListener('blur', e => e.stopImmediatePropagation(), true);
                            Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
                            Object.defineProperty(document, 'hidden', { get: () => false });

                        })();
                    </script>
                    <style>
                        /* ESTILO AGRESIVO: Si existe, se oculta */
                        ytm-ad-slot-renderer, .ad-showing, .ad-interrupting, 
                        ytm-promoted-video-renderer, ytm-rich-item-renderer:has([aria-label*="Anuncio"]),
                        ytm-rich-item-renderer:has(.ytm-ad-slot-renderer),
                        ytm-companion-ad-renderer, .ytp-paid-content-overlay,
                        ytm-brand-video-singleton-renderer { 
                            display: none !important; 
                            height: 0px !important; 
                            width: 0px !important;
                            opacity: 0 !important;
                            pointer-events: none !important;
                        }
                    </style>`;

                    const modified = html.replace('<head>', '<head>' + nuclearScript);
                    return new Response(modified, { headers: response.headers });
                });
            })
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
