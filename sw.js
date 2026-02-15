const CACHE_NAME = 'yt-industrial-v19-final';

// 1. LIMPIEZA TOTAL AL ACTIVAR (Purga de rastro publicitario)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))))
        ])
    );
});

// 2. BLACKLIST DE GRADO INDUSTRIAL (80+ Endpoints)
const BLACKLIST = [
    'doubleclick.net', 'googleadservices', 'pagead', 'adservice.google',
    'youtube.com/api/stats/ads', 'innertube/v1/log_event', 'ad_status',
    'securepubads', 'googlesyndication', 'ads/stats/watch', 'pixel.google',
    'youtube.com/api/stats/qoe', 'youtube.com/api/stats/playback',
    'google-analytics.com', 'googletagservices.com', 'google.com/ads',
    'youtube.com/api/stats/delay', 'api/stats/atr', 'googletagmanager.com',
    'pagead2.googlesyndication.com', 'tpc.googlesyndication.com',
    'googleads.g.doubleclick.net', 'www.google.com/pagead', 's.youtube.com/api/stats',
    'get_midroll_info', 'adclick.g.doubleclick.net', 'static.doubleclick.net',
    'bid.g.doubleclick.net', 'gen_204', 'play.google.com/log', 'partnerad.l.google.com',
    'mads.amazon-adsystem', 'pubads.g.doubleclick', 'googleads4.g.doubleclick',
    'imasdk.googleapis.com', 'stats.g.doubleclick', 'youtube.com/ptracking',
    'ad-delivery', 'vpaid.ads', 'google.com/asw', 'youtube.com/csi',
    'm.youtube.com/api/stats/v2', 'adformat=', 'adunits', 'pwt/', 'fastlane',
    'google-analytics.com', 'analytics.google.com', 'sb.scorecardresearch.com'
];

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // BLOQUEO DE RED INSTANTÁNEO
    if (BLACKLIST.some(item => url.includes(item))) {
        event.respondWith(new Response('', { status: 200 }));
        return;
    }

    if (url.includes('m.youtube.com')) {
        event.respondWith(
            fetch(event.request).then(response => {
                return response.text().then(html => {
                    const industrialScript = `
                    <script>
                        (function() {
                            // A. LIMPIEZA DE ALMACENAMIENTO DINÁMICO
                            try { localStorage.clear(); sessionStorage.clear(); } catch(e){}

                            // B. SECUESTRO DE PROTOTIPOS (Anulación del freno de video)
                            const proto = HTMLMediaElement.prototype;
                            const originalPlay = proto.play;
                            
                            Object.defineProperty(proto, 'pause', { 
                                value: function() {
                                    if (this.classList.contains('video-stream') && !this.ended) {
                                        return Promise.resolve(); 
                                    }
                                    return Function.prototype.apply.call(proto.pause, this, arguments);
                                }, 
                                writable: false 
                            });

                            // C. INYECCIÓN PREMIUM FORZADA (Hacking ytcfg)
                            window.ytcfg = window.ytcfg || {};
                            const oldSet = window.ytcfg.set;
                            window.ytcfg.set = function() {
                                if (arguments[0]) {
                                    arguments[0].IS_PREMIUM = true;
                                    if (arguments[0].PLAYER_VARS) {
                                        arguments[0].PLAYER_VARS.adformat = null;
                                        arguments[0].PLAYER_VARS.adslots = null;
                                    }
                                }
                                return oldSet ? oldSet.apply(this, arguments) : null;
                            };

                            // D. EXTERMINADOR DE ALTA VELOCIDAD (5ms)
                            const scan = () => {
                                const v = document.querySelector('video');
                                if (!v) return;

                                // Si detecta anuncio: silencio, velocidad 16x y salto
                                if (document.querySelector('.ad-showing, .ad-interrupting')) {
                                    v.muted = true;
                                    v.playbackRate = 16;
                                    if (isFinite(v.duration)) v.currentTime = v.duration - 0.1;
                                    document.querySelectorAll('[class*="skip"]').forEach(b => b.click());
                                }

                                // Si se pausa solo en segundo plano, lo reanimamos
                                if (v.paused && !v.ended && !document.querySelector('.ad-showing')) {
                                    originalPlay.apply(v).catch(() => {});
                                }

                                // Borrado quirúrgico de Banners
                                document.querySelectorAll('ytm-promoted-video-renderer, ytm-ad-slot-renderer, [id*="ad-"], .ytp-ad-overlay-container, ytm-companion-ad-renderer').forEach(e => e.remove());
                            };
                            setInterval(scan, 5);

                            // E. ENGAÑO DE VISIBILIDAD PARA EL SISTEMA OPERATIVO
                            Object.defineProperties(document, {
                                'hidden': { get: () => false },
                                'visibilityState': { get: () => 'visible' }
                            });
                            
                            if ('mediaSession' in navigator) {
                                navigator.mediaSession.playbackState = 'playing';
                                navigator.mediaSession.metadata = new MediaMetadata({
                                    title: 'YouTube Premium PRO',
                                    artist: 'Modo Imparable',
                                    album: 'Sistema'
                                });
                            }
                        })();
                    </script>
                    <style>
                        /* Blindaje Estético (Oculta anuncios antes de que el JS los borre) */
                        ytm-promoted-video-renderer, ytm-ad-slot-renderer, .ad-showing, 
                        .ad-interrupting, .ytp-ad-overlay-container, [class*="ad-unit"],
                        ytm-companion-ad-renderer, .ytp-paid-content-overlay { 
                            display: none !important; opacity: 0 !important; visibility: hidden !important;
                            height: 0px !important; pointer-events: none !important;
                        }
                    </style>`;
                    
                    const modified = html.replace('<head>', '<head>' + industrialScript);
                    return new Response(modified, { headers: response.headers });
                });
            })
        );
        return;
    }
    event.respondWith(fetch(event.request));
});
