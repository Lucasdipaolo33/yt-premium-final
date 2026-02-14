const BLACKLIST = [
    'ad_type', 'adunit', 'adsense', 'doubleclick', 'googleads', 'pagead', 
    'ptracking', 'log_event', 'ad_status', 'player_ads', 'api/stats/ads',
    'stats/ads', 'v1/attributions', 'pagead/conversion', 'ad_break'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    
    // Si la URL tiene CUALQUIERA de las palabras prohibidas, se bloquea.
    if (BLACKLIST.some(word => url.toLowerCase().includes(word))) {
        event.respondWith(new Response('', { status: 200 })); 
        return;
    }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
