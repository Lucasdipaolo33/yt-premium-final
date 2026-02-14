const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 10000;

app.use('/', createProxyMiddleware({
    target: 'https://m.youtube.com',
    changeOrigin: true,
    selfHandleResponse: true, 
    onProxyReq: (proxyReq) => {
        // Simulamos un navegador móvil Android real para evitar el bloqueo de bot
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36');
        proxyReq.setHeader('Accept-Language', 'es-419,es;q=0.9');
    },
    onProxyRes: function (proxyRes, req, res) {
        let body = [];
        proxyRes.on('data', (chunk) => body.push(chunk));
        proxyRes.on('end', () => {
            let html = Buffer.concat(body).toString();
            
            // EL "BLOQUEADOR DE EXTENSIÓN": Borramos scripts de anuncios por nombre
            html = html.replace(/<script\s+src="[^"]*adsbygoogle[^"]*"><\/script>/gi, '');
            html = html.replace(/<script\s+src="[^"]*doubleclick[^"]*"><\/script>/gi, '');

            const scriptPremium = `
                <style>
                    /* Ocultar banners de anuncios y sugerencias de app */
                    .ad-container, .ytp-ad-overlay-container, ytm-promoted-video-renderer, .masthead-ad { display: none !important; }
                    #premium-bar { position: fixed; top: 0; width: 100%; height: 48px; background: #000; z-index: 999999; display: flex; align-items: center; justify-content: center; border-bottom: 2px solid red; }
                </style>
                <div id="premium-bar"><span style="color:white; font-weight:bold; font-family:sans-serif;">YOUTUBE PREMIUM PRO</span></div>
                <script>
                    // TRUCO SEGUNDO PLANO: Engañamos al navegador para que no pause al ocultar la pestaña
                    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
                    Object.defineProperty(document, 'hidden', { get: () => false, configurable: true });
                </script>
            `;
            
            html = html.replace('<head>', '<head>' + scriptPremium);
            res.end(html);
        });
    }
}));

app.listen(PORT, () => console.log("Inyección Premium Lista"));
