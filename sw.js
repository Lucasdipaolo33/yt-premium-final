const BLACKLIST = [
    'doubleclick.net', 'googleads.g.doubleclick.net', 'googlesyndication.com',
    'adservice.google.com', 'googleadservices.com', 'youtube.com/api/stats/ads',
    'youtube.com/pagead', 'video-stats.l.google.com', 'ad_status', 'ptracking',
    'stats/ads', 'api/stats/qoe', '/log_event?el=ad'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url.toLowerCase();
    if (BLACKLIST.some(domain => url.includes(domain))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }
});
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
