const CACHE_NAME = 'yt-pro-v1';
const BLACKLIST = [
    'doubleclick.net', 'googleads.g.doubleclick.net', 'googlesyndication.com',
    'adservice.google.com', 'googleadservices.com', 'youtube.com/api/stats/ads',
    'youtube.com/pagead', 'video-stats.l.google.com'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url.toLowerCase();
    if (BLACKLIST.some(d => url.includes(d))) {
        event.respondWith(new Response('', { status: 200 }));
    }
});
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => self.clients.claim());
