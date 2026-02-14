const BLACKLIST = [
    'googleads', 'adsense', 'doubleclick', 'ad_status', 'pagead', 'ptracking',
    'api/stats/ads', 'log_event', 'ad_type', 'adunit', 'ad_break', 'mads'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url.toLowerCase();
    
    // Si la URL es de publicidad, la matamos respondiendo un "Ok" vacío
    if (BLACKLIST.some(pattern => url.includes(pattern))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
