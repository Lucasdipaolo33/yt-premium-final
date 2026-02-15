const CACHE_NAME = 'yt-nuclear-v9';

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // 1. BLOQUEO RADICAL DE RED (Si la URL tiene esto, ni se descarga)
    const BLACKLIST = [
        'doubleclick.net', 'googleadservices', 'pagead', 'adservice.google',
        'youtube.com/api/stats/ads', 'innertube/v1/log_event', 'ad_status'
    ];

    if (BLACKLIST.some(item => url.includes(item))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    // 2. INYECCIÓN QUIRÚRGICA DE CSS Y JS
    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request).then(response => {
                return response.text().then(html => {
                    const powerScript = `
                    <style>
                        /* Oculta banners, sugeridos pagados y cuadros de promo */
                        ytm-promoted-video-renderer, ytm-display-ad-promo-renderer, 
                        ytm-inline-ad-renderer, .ad-showing, .ad-interrupting,
                        .pyv-afc-ads-container, #player-ads { display: none !important; visibility: hidden !important; }
                    </style>
                    <script>
                        (function() {
                            const killAds = () => {
                                const video = document.querySelector('video');
                                // Si hay anuncio de video, lo fulminamos
                                if (document.querySelector('.ad-showing, .ad-interrupting')) {
                                    if (video) {
                                        video.muted = true;
                                        video.playbackRate = 16;
                                        if (video.duration > 0) video.currentTime = video.duration - 0.1;
                                    }
                                    // Click automático en 'Saltar' con todos los nombres de botones posibles
                                    document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button-slot')?.click();
                                }
                                
                                // Eliminar banners que se cargan después
                                const ads = document.querySelectorAll('ytm-promoted-video-renderer, ytm-display-ad-promo-renderer, ytm-inline-ad-renderer');
                                ads.forEach(a => a.remove());
                            };
                            // Ejecución ultra-veloz cada 50ms
                            setInterval(killAds, 50);
                        })();
                    </script>`;
                    
                    const modifiedHtml = html.replace('</head>', powerScript + '</head>');
                    return new Response(modifiedHtml, { headers: response.headers });
                });
            }).catch(() => fetch(event.request))
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
