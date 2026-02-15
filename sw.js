const CACHE_NAME = 'yt-premium-v1';

// LISTA NEGRA DE SERVIDORES DE ANUNCIOS (De aquí vienen los banners y los cortes)
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
    'static.doubleclick.net'
];

// 1. INSTALACIÓN RÁPIDA
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

// 2. ACTIVACIÓN INMEDIATA
self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});

// 3. EL FILTRO INTERCEPTOR (Aquí está la magia)
self.addEventListener('fetch', (event) => {
    const url = event.request.url.toLowerCase();

    // Si la petición es para uno de los servidores de la lista negra...
    if (BLACKLIST.some(domain => url.includes(domain))) {
        // Bloqueamos la petición devolviendo una respuesta vacía (status 200 pero sin datos)
        event.respondWith(new Response('', {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/plain' }
        }));
        return;
    }

    // Si no es un anuncio, dejamos que la petición pase normal
    event.respondWith(
        fetch(event.request).catch(() => {
            // Esto evita que la app se caiga si no hay internet
            return caches.match(event.request);
        })
    );
});
