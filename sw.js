const AD_PATTERNS = [
    /ad_type|adunit|adsense|doubleclick|googleads|pagead|ptracking|log_event|ad_status|player_ads/i,
    /youtube.com\/api\/stats\/ads/i,
    /youtube.com\/pagead\//i,
    /googleadservices.com/i
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Lógica de Undetectable AdBlocker: si es un anuncio, respondemos con "éxito vacío" 
    // para que YouTube crea que se cargó y no bloquee el video.
    if (AD_PATTERNS.some(pattern => pattern.test(url))) {
        event.respondWith(new Response('', { 
            status: 200, 
            headers: { 'Content-Type': 'text/plain' } 
        }));
        return;
    }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
