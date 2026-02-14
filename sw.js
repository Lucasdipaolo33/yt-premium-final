const ASSETS_TO_BLOCK = [
    'googleads.g.doubleclick.net',
    'googlesyndication.com',
    'pubads.g.doubleclick.net',
    'securepubads.g.doubleclick.net',
    'youtube.com/api/stats/ads',
    'youtube.com/pagead',
    'video-stats.l.google.com',
    'adservice.google.com',
    'googleadservices.com'
];

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (ASSETS_TO_BLOCK.some(domain => url.host.includes(domain) || url.pathname.includes(domain))) {
        // Bloqueo total: devolvemos una respuesta vacía pero exitosa para engañar al reproductor
        event.respondWith(new Response('', { status: 200 }));
        return;
    }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
