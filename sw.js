const CACHE_NAME = 'yt-nuclear-v60';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
    e.waitUntil(self.clients.claim());
    // Purga total de caché para que los cambios entren al segundo 1
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
});

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
                    const hackerScript = `
                    <script>
                        (function() {
                            // 1. ATAQUE DE PROTOTIPOS: ANULAR LA PAUSA (SEGUNDO PLANO)
                            const originalPause = HTMLMediaElement.prototype.pause;
                            HTMLMediaElement.prototype.pause = function() {
                                // Si YouTube intenta pausar el video por "falta de visibilidad", bloqueamos la orden
                                if (this.classList.contains('video-stream') && !this.ended && document.visibilityState === 'hidden') {
                                    console.log("Intento de pausa bloqueado - Modo Background Activo");
                                    return; 
                                }
                                return originalPause.apply(this, arguments);
                            };

                            // Forzamos el estado de visibilidad perpetuo
                            Object.defineProperties(document, {
                                'hidden': { get: () => false },
                                'visibilityState': { get: () => 'visible' }
                            });

                            // 2. SECUESTRO DE JSON (Elimina anuncios antes de que el reproductor los pida)
                            const orgParse = JSON.parse;
                            JSON.parse = function() {
                                const res = orgParse.apply(this, arguments);
                                if (res && res.adPlacements) res.adPlacements = [];
                                if (res && res.playerAds) res.playerAds = [];
                                if (res && res.adSlots) res.adSlots = [];
                                if (res && res.masthead) delete res.masthead;
                                return res;
                            };

                            // 3. EXTERMINADOR DE BANNERS DINÁMICOS (SCROLL)
                            const exterminate = () => {
                                // Buscamos cualquier elemento que contenga la palabra "Anuncio" o "Publicitado"
                                const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
                                let node;
                                while(node = walk.nextNode()) {
                                    if (node.textContent.includes('Anuncio') || node.textContent.includes('Publicitado')) {
                                        let container = node.parentElement.closest('ytm-rich-item-renderer') || node.parentElement.closest('ytm-ad-slot-renderer');
                                        if (container) container.remove();
                                    }
                                }
                                // Limpieza de contenedores conocidos
                                document.querySelectorAll('ytm-ad-slot-renderer, .ad-unit, ytm-promoted-video-renderer, ytm-companion-ad-renderer').forEach(el => el.remove());
                            };

                            // 4. AUTO-SKIP DE VIDEOS (16x Speed)
                            const autoSkip = () => {
                                const video = document.querySelector('video');
                                if (document.querySelector('.ad-showing, .ad-interrupting')) {
                                    if (video) {
                                        video.muted = true;
                                        video.playbackRate = 16; 
                                        if (isFinite(video.duration)) video.currentTime = video.duration - 0.1;
                                    }
                                    document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern')?.click();
                                }
                            };

                            // Bucle de ejecución agresivo (cada 50ms)
                            setInterval(() => {
                                exterminate();
                                autoSkip();
                            }, 50);

                            // Cambiar Logo a Premium (Inyección Estética)
                            const changeLogo = () => {
                                const logo = document.querySelector('ytm-masthead-logo-renderer .header-logo-icon');
                                if (logo) logo.style.content = "url('https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Premium_logo_2017.svg')";
                            };
                            setInterval(changeLogo, 1000);

                            // SponsorBlock Integration
                            const vId = new URLSearchParams(window.location.search).get('v');
                            if (vId && window._lastV !== vId) {
                                window._lastV = vId;
                                fetch('https://sponsor.ajay.app/api/skipSegments?videoID='+vId+'&category=["sponsor","intro"]')
                                .then(r => r.json()).then(s => { window._s = s; }).catch(() => {});
                            }
                            if (window._s && document.querySelector('video')) {
                                const v = document.querySelector('video');
                                window._s.forEach(seg => {
                                    if (v.currentTime >= seg.segment[0] && v.currentTime < seg.segment[1]) v.currentTime = seg.segment[1];
                                });
                            }
                        })();
                    </script>
                    <style>
                        /* Bloqueo por CSS preventivo */
                        ytm-ad-slot-renderer, .ad-showing, .ad-interrupting, 
                        ytm-promoted-video-renderer, ytm-rich-item-renderer:has([aria-label*="Anuncio"]),
                        ytm-rich-item-renderer:has(.ytm-ad-slot-renderer),
                        .ytp-paid-content-overlay { display: none !important; height: 0 !important; }
                        
                        /* Forzar logo Premium */
                        ytm-masthead-logo-renderer .header-logo-icon {
                            content: url('https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Premium_logo_2017.svg') !important;
                            width: 100px !important;
                        }
                    </style>`;

                    const modified = html.replace('<head>', '<head>' + hackerScript);
                    return new Response(modified, { headers: response.headers });
                });
            })
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
