const CACHE_NAME = 'yt-shield-v8';

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // BLOQUEO DE RED: Matamos los servidores de anuncios antes de que respondan
    if (url.includes('doubleclick.net') || url.includes('googleadservices') || url.includes('ads/stats')) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    // INYECCIÓN DE CÓDIGO: Metemos el bloqueador dentro de YouTube
    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request).then(response => {
                return response.text().then(html => {
                    const blockScript = `
                    <script>
                        setInterval(() => {
                            const video = document.querySelector('video');
                            const ad = document.querySelector('.ad-showing, .ad-interrupting');
                            if (ad && video) {
                                video.muted = true;
                                video.playbackRate = 16;
                                video.currentTime = video.duration;
                                document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern')?.click();
                            }
                            // Limpieza visual de banners
                            document.querySelectorAll('ytm-promoted-video-renderer, ytm-display-ad-promo-renderer').forEach(el => el.remove());
                        }, 200);
                    </script>`;
                    const modifiedHtml = html.replace('</head>', blockScript + '</head>');
                    return new Response(modifiedHtml, { headers: response.headers });
                });
            }).catch(() => fetch(event.request))
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
