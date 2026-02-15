const CACHE_NAME = 'yt-premium-final-v6';

// 1. Lista de servidores que activan los anuncios (si los bloqueamos, el reproductor queda limpio)
const ADS_CORE = [
    'ads', 'doubleclick', 'googleads', 'pagead', 'stats/ads', 
    'ptracking', 'adunit', 'log_event', 'vpaid', 'masthead'
];

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url.toLowerCase();

    // FILTRO QUIRÚRGICO: Si la dirección tiene CUALQUIER palabra de la lista negra, la matamos
    if (ADS_CORE.some(word => url.includes(word))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    // INYECCIÓN DE CÓDIGO (Para que el video nunca se detenga)
    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request).then(async (res) => {
                let html = await res.text();
                // Este script engaña al reproductor para que crea que los anuncios ya pasaron
                const antiAdScript = `
                    <script>
                        setInterval(() => {
                            const v = document.querySelector('video');
                            if (document.querySelector('.ad-showing')) {
                                if (v) v.currentTime = v.duration;
                                document.querySelector('.ytp-ad-skip-button')?.click();
                            }
                        }, 250);
                    </script>
                `;
                const modHtml = html.replace('</head>', antiAdScript + '</head>');
                return new Response(modHtml, { headers: res.headers });
            }).catch(() => fetch(event.request))
        );
        return;
    }

    event.respondWith(fetch(event.request));
});
