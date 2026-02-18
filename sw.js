const CACHE_NAME = 'yt-hacker-final-v90';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Filtros de Red de Grado Industrial
const ADBLOCK_LIST = [
    'doubleclick.net', 'googleadservices', 'pagead', 'adservice.google',
    'youtube.com/api/stats/ads', 'innertube/v1/log_event', 'ad_status',
    'securepubads', 'googlesyndication', 'ads/stats/watch', 'pixel.google',
    'googleads.g.doubleclick.net', 'gen_204', 'imasdk.googleapis.com', 
    'm.youtube.com/api/stats/v2', 'adformat=', 'adunits'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // BLOQUEO DE PETICIONES ANTES DE QUE SALGAN
    if (ADBLOCK_LIST.some(item => url.includes(item))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request, {
                headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36' }
            }).then(response => {
                if (!response.headers.get('content-type')?.includes('text/html')) return response;

                return response.text().then(html => {
                    const injection = `
                    <script>
                        (function() {
                            // 1. ANULAR TODA DETECCIÓN DE VISIBILIDAD (HACK DE SEGUNDO PLANO)
                            const block = (e) => { e.stopImmediatePropagation(); };
                            window.addEventListener('visibilitychange', block, true);
                            window.addEventListener('blur', block, true);
                            window.addEventListener('pagehide', block, true);
                            
                            Object.defineProperties(document, {
                                'visibilityState': { get: () => 'visible' },
                                'hidden': { get: () => false }
                            });

                            // 2. FORZAR AUDIO Y VIDEO (Background Play)
                            setInterval(() => {
                                const v = document.querySelector('video');
                                if (v) {
                                    v.setAttribute('playsinline', 'true');
                                    v.setAttribute('webkit-playsinline', 'true');
                                    if (v.paused && !v.ended && document.visibilityState === 'visible') {
                                        // Esto evita que se pause al bloquear
                                    }
                                }
                                // Auto-click en Skip Ads
                                document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern')?.click();
                            }, 200);

                            // 3. EXTERMINADOR DE BANNERS (Búsqueda por Atributo Oculto)
                            const killAds = () => {
                                // Buscamos elementos que tengan datos de anuncios en su configuración interna
                                document.querySelectorAll('ytm-rich-item-renderer, ytm-ad-slot-renderer').forEach(el => {
                                    if (el.hasAttribute('ad-presentation') || el.innerHTML.includes('ad-slot') || el.innerText.includes('Anuncio')) {
                                        el.remove();
                                    }
                                });
                            };
                            
                            const observer = new MutationObserver(killAds);
                            observer.observe(document.documentElement, { childList: true, subtree: true });

                            // 4. INTERCEPTOR DE JSON (Limpieza de respuesta del servidor)
                            const originalParse = JSON.parse;
                            JSON.parse = function() {
                                const data = originalParse.apply(this, arguments);
                                if (data && data.adPlacements) data.adPlacements = [];
                                if (data && data.playerAds) data.playerAds = [];
                                return data;
                            };
                        })();
                    </script>
                    <style>
                        /* ELIMINAR BANNERS DE SCROLL Y PUBLICITADOS */
                        ytm-ad-slot-renderer, .ad-showing, ytm-promoted-video-renderer,
                        ytm-rich-item-renderer:has(.ytm-ad-slot-renderer),
                        [aria-label*="Anuncio"], .ytp-ad-overlay-container {
                            display: none !important;
                            height: 0px !important;
                        }
                    </style>`;
                    
                    const modified = html.replace('<head>', '<head>' + injection);
                    return new Response(modified, { headers: response.headers });
                });
            })
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
