const blacklist = [
    'googleadservices.com',
    'doubleclick.net',
    'googlesyndication.com',
    'adservice.google.com',
    'youtube.com/pagead/',
    'youtube.com/ptracking'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (blacklist.some(adSite => url.includes(adSite))) {
        event.respondWith(new Response('', { status: 204 }));
    }
});
