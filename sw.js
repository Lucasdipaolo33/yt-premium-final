const CACHE_NAME = 'yt-exterminator-v4';

const BLACKLIST = [
    'googleads.g.doubleclick.net', 'doubleclick.net', 'googlesyndication.com',
    'adservice.google.com', 'googleadservices.com', 'youtube.com/api/stats/ads',
    'youtube.com/pagead', 'video-stats.l.google.com', 'pubads.g.doubleclick.net'
];

// GUERRERO TOTAL: Detecta, Acelera y Salta
const SCRIPT_EXTERMINADOR = `
    const exterminate = () => {
        // 1. Limpieza de Banners y Shorts Publicitarios
        const adElements = document.querySelectorAll('ytm-promoted-video-renderer, ytm-display-ad-promo-renderer, .ad-showing, .ad-interrupting, ytm-inline-ad-renderer');
        adElements.forEach(el => el.remove());

        // 2. Ataque al Reproductor de Video
        const video = document.querySelector('video');
        const adOverlay = document.querySelector('.ytp-ad-player-overlay, .ytp-ad-message-container');

        if (adOverlay || document.querySelector('.ad-showing')) {
            if (video && video.currentTime > 0) {
                video.muted = true;
                video.playbackRate = 16; // Velocidad luz
                video.currentTime = video.duration - 0.1; // Salto al final
            }
            // Click automático en el botón "Saltar" si aparece
            document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern')?.click();
        }
    };
    setInterval(exterminate, 300); // Ejecución ultra rápida
`;

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url.toLowerCase();

    // Bloqueo de Red (Guerrero 1)
    if (BLACKLIST.some(d => url.includes(d))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    // Inyección de ADN (Guerrero 2)
    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request).then(async (res) => {
                let html = await res.text();
                const modHtml = html.replace('</head>', `
                    <style>
                        ytm-promoted-video-renderer, ytm-display-ad-promo-renderer, 
                        ytm-inline-ad-renderer, .ad-showing { display: none !important; }
                    </style>
                    <script>${SCRIPT_EXTERMINADOR}</script></head>
                `);
                return new Response(modHtml, { headers: res.headers });
            }).catch(() => fetch(event.request))
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
