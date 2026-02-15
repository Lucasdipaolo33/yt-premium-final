const CACHE_NAME = 'yt-military-v15';

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

// LISTA NEGRA ULTRA-REFORZADA
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
    'bid.g.doubleclick.net', 'gen_204', 'play.google.com/log', 'partnerad.l.google.com'
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
                    const bruteForceScript = `
                    <script>
                        (function() {
                            // HACK 1: PICTURE-IN-PICTURE FORZADO
                            // Esto obliga al video a flotar, impidiendo que Android lo pause
                            const enablePiP = async () => {
                                const v = document.querySelector('video');
                                if (v && !document.pictureInPictureElement) {
                                    try { await v.requestPictureInPicture(); } catch(e) {}
                                }
                            };

                            // HACK 2: AUDIO KEEP-ALIVE (Engaño de Hardware)
                            // Creamos un contexto de audio que Android no puede silenciar
                            const context = new (window.AudioContext || window.webkitAudioContext)();
                            const silentNode = context.createBufferSource();
                            silentNode.loop = true;
                            silentNode.start();

                            // HACK 3: ANTI-PAUSA AGRESIVO
                            // Sobrescribimos el método pause de YouTube
                            const originalPause = HTMLMediaElement.prototype.pause;
                            HTMLMediaElement.prototype.pause = function() {
                                if (this.classList.contains('video-stream') && !this.ended) {
                                    console.log("YouTube intentó pausar, pero no lo dejamos.");
                                    return; // Bloquea la orden de pausa
                                }
                                return originalPause.apply(this, arguments);
                            };

                            // HACK 4: EXTERMINADOR DE ANUNCIOS (Cada 10ms - Potencia máxima)
                            const kill = () => {
                                const v = document.querySelector('video');
                                if (document.querySelector('.ad-showing, .ad-interrupting')) {
                                    if (v) {
                                        v.muted = true;
                                        v.playbackRate = 16;
                                        v.currentTime = v.duration - 0.1;
                                    }
                                    document.querySelectorAll('[class*="skip"]').forEach(b => b.click());
                                }
                                // Borrar carteles de "Contenido Pago" de forma violenta
                                document.querySelectorAll('.ytp-paid-content-overlay, ytm-promoted-video-renderer, .ad-overlay').forEach(e => e.remove());
                            };
                            
                            setInterval(kill, 10);

                            // CAPA DE VISIBILIDAD ETERNA
                            Object.defineProperty(document, 'hidden', { get: () => false });
                            Object.defineProperty(document, 'visibilityState', { get: () => 'visible' });
                            window.addEventListener('blur', (e) => e.stopImmediatePropagation(), true);
                        })();
                    </script>
                    <style>
                        /* Ocultar banners de raíz */
                        ytm-promoted-video-renderer, ytm-display-ad-promo-renderer, 
                        .ad-showing, .ad-interrupting, .ytp-paid-content-overlay { 
                            display: none !important; 
                        }
                    </style>`;
                    
                    const modified = html.replace('<head>', '<head>' + bruteForceScript);
                    return new Response(modified, { headers: response.headers });
                });
            })
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
