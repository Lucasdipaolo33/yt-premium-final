const CACHE_NAME = 'yt-pro-v2';

// 1. LISTA NEGRA REFORZADA (Corta la conexión con los servidores de anuncios)
const BLACKLIST = [
    'googleads.g.doubleclick.net',
    'doubleclick.net',
    'googlesyndication.com',
    'adservice.google.com',
    'googleadservices.com',
    'youtube.com/api/stats/ads',
    'youtube.com/pagead',
    'video-stats.l.google.com',
    'pubads.g.doubleclick.net',
    'ad.doubleclick.net',
    'static.doubleclick.net',
    'ytimg.com/pagead', // Bloquea imágenes de anuncios
    'google.com/pagead'
];

// 2. REGLAS COSMÉTICAS (Para desaparecer banners "Patrocinados" y botones)
const AD_STYLES = `
    ytm-promoted-video-renderer, 
    ytm-display-ad-promo-renderer, 
    .ad-showing, 
    .ad-interrupting, 
    .ytp-ad-overlay-container, 
    .ytp-ad-message-container,
    ytm-companion-ad-renderer { 
        display: none !important; 
    }
`;

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());

self.addEventListener('fetch', (event) => {
    const url = event.request.url.toLowerCase();

    // A. BLOQUEO DE RED: Si es un servidor de anuncios, matamos la petición
    if (BLACKLIST.some(domain => url.includes(domain))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    // B. INYECCIÓN COSMÉTICA: Si es la página de YouTube, le inyectamos el CSS "veneno"
    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request).then(async (response) => {
                let html = await response.text();
                // Insertamos nuestro estilo justo antes de cerrar el head
                const cleanHtml = html.replace('</head>', `<style>${AD_STYLES}</style></head>`);
                return new Response(cleanHtml, {
                    headers: response.headers
                });
            }).catch(() => fetch(event.request))
        );
        return;
    }

    // C. NAVEGACIÓN NORMAL
    event.respondWith(fetch(event.request));
});
