const CACHE_NAME = 'yt-albania-v7';

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    let url = new URL(event.request.url);

    // 1. EL TRUCO DE ALBANIA (Inyección de Región)
    if (url.hostname.includes('youtube.com')) {
        let modified = false;
        if (!url.searchParams.has('gl')) {
            url.searchParams.set('gl', 'AL');
            url.searchParams.set('persist_gl', '1');
            modified = true;
        }

        if (modified) {
            event.respondWith(
                fetch(new Request(url.toString(), event.request)).catch(() => fetch(event.request))
            );
            return;
        }
    }

    // 2. BLOQUEO DE RED (Seguimos matando los servidores de anuncios conocidos)
    const ADS = ['googleads', 'doubleclick', 'ads/stats', 'pagead', 'ptracking'];
    if (ADS.some(path => url.href.includes(path))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    // 3. INYECCIÓN DE ADN (El limpiador visual de respaldo)
    if (url.hostname.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request).then(async (res) => {
                let html = await res.text();
                const script = `
                <script>
                    // Forzamos cookies de región en el navegador
                    document.cookie = "PREF=f1=50000000&gl=AL; domain=.youtube.com; path=/";
                    
                    setInterval(() => {
                        const v = document.querySelector('video');
                        if (document.querySelector('.ad-showing, .ad-interrupting')) {
                            if (v) {
                                v.muted = true;
                                v.playbackRate = 16;
                                v.currentTime = v.duration - 0.1;
                            }
                            document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern')?.click();
                        }
                        // Borrar banners de la interfaz
                        document.querySelectorAll('ytm-promoted-video-renderer, ytm-display-ad-promo-renderer').forEach(e => e.remove());
                    }, 300);
                </script>`;
                return new Response(html.replace('</head>', script + '</head>'), { headers: res.headers });
            }).catch(() => fetch(event.request))
        );
        return;
    }

    event.respondWith(fetch(event.request));
});
