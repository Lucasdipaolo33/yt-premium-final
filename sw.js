const CACHE_NAME = 'yt-elite-final-v100';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
    e.waitUntil(self.clients.claim());
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
});

// LISTA NEGRA DE SERVIDORES DE AD-SHIPPING
const BLACKLIST = ['doubleclick.net', 'googleadservices', 'pagead', 'adservice.google', 'youtube.com/api/stats/ads', 'innertube/v1/log_event', 'securepubads', 'googlesyndication', 'googleads.g.doubleclick.net', 'imasdk.googleapis.com', 'm.youtube.com/api/stats/v2', 'adformat=', 'adunits'];

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // BLOQUEO RADICAL DE PETICIONES
    if (BLACKLIST.some(item => url.includes(item))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    if (url.includes('m.youtube.com')) {
        // MODIFICACIÓN DE CABECERAS PARA ENGAÑAR AL SERVIDOR (User-Agent Spoofing)
        const modifiedRequest = new Request(event.request, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36' }
        });

        event.respondWith(
            fetch(modifiedRequest).then(response => {
                if (!response.headers.get('content-type')?.includes('text/html')) return response;

                return response.text().then(html => {
                    const eliteInjection = `
                    <script>
                        (function() {
                            // 1. EL SECRETO DEL SEGUNDO PLANO (REDEFINIR EL MOTOR DE AUDIO)
                            const hijackAudio = () => {
                                const originalPlay = HTMLMediaElement.prototype.play;
                                HTMLMediaElement.prototype.play = function() {
                                    this.setAttribute('playsinline', 'true');
                                    this.setAttribute('webkit-playsinline', 'true');
                                    return originalPlay.apply(this, arguments);
                                };
                                
                                // Bloqueamos la pausa forzada por visibilidad
                                const originalPause = HTMLMediaElement.prototype.pause;
                                HTMLMediaElement.prototype.pause = function() {
                                    if (document.visibilityState === 'hidden' && this.classList.contains('video-stream')) {
                                        return new Promise(() => {}); // Promesa que nunca se resuelve = nunca pausa
                                    }
                                    return originalPause.apply(this, arguments);
                                };
                            };

                            // 2. REESCRITURA DEL DOM (ELIMINACIÓN DE RAÍZ)
                            const killEverythingAds = () => {
                                const selectors = [
                                    'ytm-ad-slot-renderer', 'ytm-promoted-video-renderer', 
                                    'ytm-rich-item-renderer:has(.ytm-ad-slot-renderer)',
                                    '.ad-showing', '.ad-interrupting', 'ytm-companion-ad-renderer'
                                ];
                                selectors.forEach(s => {
                                    document.querySelectorAll(s).forEach(el => el.remove());
                                });
                            };

                            // 3. ENGAÑO DE PREMIUM (JSON INTERCEPTOR)
                            const orgParse = JSON.parse;
                            JSON.parse = function() {
                                const data = orgParse.apply(this, arguments);
                                if (data && data.playerConfig) {
                                    data.playerConfig.audioConfig = data.playerConfig.audioConfig || {};
                                    data.playerConfig.audioConfig.enableBackgroundPlayback = true; // ACTIVAMOS EL SEGUNDO PLANO EN EL JSON
                                }
                                if (data && data.adPlacements) data.adPlacements = [];
                                return data;
                            };

                            // INICIO DE OPERACIONES
                            hijackAudio();
                            setInterval(() => {
                                killEverythingAds();
                                // Saltar anuncios de video a 16x
                                const v = document.querySelector('video');
                                if (v && document.querySelector('.ad-showing')) {
                                    v.playbackRate = 16;
                                    v.currentTime = v.duration - 0.1;
                                    document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern')?.click();
                                }
                            }, 100);

                            // FORZAR LOGO PREMIUM
                            const fixLogo = () => {
                                const logo = document.querySelector('ytm-masthead-logo-renderer .header-logo-icon');
                                if (logo) logo.style.content = "url('https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Premium_logo_2017.svg')";
                            };
                            setInterval(fixLogo, 500);

                            // BYPASS DE VISIBILIDAD (NIVEL KERNEL)
                            Object.defineProperties(document, {
                                'visibilityState': { get: () => 'visible' },
                                'hidden': { get: () => false }
                            });
                        })();
                    </script>
                    <style>
                        /* ESTILOS DE BLOQUEO TOTAL */
                        ytm-ad-slot-renderer, .ad-showing, .ad-interrupting, 
                        ytm-rich-item-renderer:has(.ytm-ad-slot-renderer),
                        [aria-label*="Anuncio"], .ytp-ad-overlay-container,
                        ytm-brand-video-singleton-renderer { display: none !important; height: 0 !important; }
                    </style>`;

                    const modified = html.replace('<head>', '<head>' + eliteInjection);
                    return new Response(modified, { headers: response.headers });
                });
            })
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
