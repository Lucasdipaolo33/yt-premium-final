const AD_DOMAINS = [
    'doubleclick.net', 'googleads.g.doubleclick.net', 'googlesyndication.com',
    'adservice.google.com', 'googleadservices.com', 'youtube.com/api/stats/ads',
    'youtube.com/pagead', 'video-stats.l.google.com', 'ad_status', 'ptracking',
    'stats/ads', 'api/stats/qoe', 'gen_204?ad', 'log_event?el=ad'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url.toLowerCase();
    if (AD_DOMAINS.some(domain => url.includes(domain))) {
        // Interceptamos y devolvemos una respuesta vacía exitosa (engaño)
        event.respondWith(new Response('', { status: 200, headers: {'Content-Type': 'text/plain'} }));
        return;
    }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
