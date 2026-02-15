const CACHE_NAME = 'yt-pro-v3'; // Cambiamos el nombre para forzar la limpieza

const BLACKLIST = [
    'googleads.g.doubleclick.net', 'doubleclick.net', 'googlesyndication.com',
    'adservice.google.com', 'googleadservices.com', 'youtube.com/api/stats/ads',
    'youtube.com/pagead', 'video-stats.l.google.com', 'pubads.g.doubleclick.net'
];

// REGLAS DEL GUERRERO 2 (El exterminador visual)
const INJECTED_SCRIPT = `
    const clean = () => {
        // Borra banners patrocinados
        document.querySelectorAll('ytm-promoted-video-renderer, ytm-display-ad-promo-renderer, .ad-showing, .ad-interrupting').forEach(el => el.remove());
        
        // Salta anuncios de video automáticamente
        const video = document.querySelector('video');
        if (document.querySelector('.ytp-ad-player-overlay')) {
            if (video) video.currentTime = video.duration || 0;
            document.querySelector('.ytp-ad-skip-button')?.click();
        }
    };
    setInterval(clean, 500); // Ejecuta la limpieza cada medio segundo
`;

self.addEventListener('install', (e) => self.skipWaiting());

// LIMPIEZA AUTOMÁTICA DE CACHÉ VIEJA
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url.toLowerCase();

    // BLOQUEO DE RED (Guerrero 1)
    if (BLACKLIST.some(d => url.includes(d))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    // INYECCIÓN DEL GUERRERO 2 (Se mete en el ADN de la página)
    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request).then(async (res) => {
                let html = await res.text();
                // Inyectamos el script exterminador y el estilo de ocultado
                const modifiedHtml = html.replace('</head>', 
                    `<style>ytm-promoted-video-renderer{display:none!important;}</style>
                     <script>${INJECTED_SCRIPT}</script></head>`);
                
                return new Response(modifiedHtml, { headers: res.headers });
            }).catch(() => fetch(event.request))
        );
        return;
    }

    event.respondWith(fetch(event.request));
});
