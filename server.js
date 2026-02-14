const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 10000;

app.use('/', createProxyMiddleware({
    target: 'https://m.youtube.com',
    changeOrigin: true,
    secure: false,
    followRedirects: false, // EVITA QUE TE MANDE AL YOUTUBE OFICIAL
    cookieDomainRewrite: "", 
    onProxyReq: (proxyReq) => {
        // ENGAÑAMOS A YOUTUBE DICIENDO QUE SOMOS UN CELULAR
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1');
    },
    onProxyRes: function (proxyRes, req, res) {
        let body = [];
        proxyRes.on('data', function (chunk) { body.push(chunk); });
        proxyRes.on('end', function () {
            let html = Buffer.concat(body).toString();
            
            // INYECCIÓN PREMIUM MEJORADA
            const premiumStyle = `
                <style>
                    #premium-bar {
                        position: fixed; top: 0; left: 0; width: 100%; height: 50px;
                        background: #0f0f0f; display: flex; align-items: center;
                        justify-content: center; z-index: 9999999; border-bottom: 1px solid #333;
                    }
                    #premium-bar span { color: white; font-weight: bold; font-size: 20px; font-family: sans-serif; }
                    body { margin-top: 50px !important; }
                    /* Bloqueo de banners */
                    ytm-promoted-video-renderer, .ad-container { display: none !important; }
                </style>
                <div id="premium-bar"><span>YouTube Premium</span></div>
            `;
            
            html = html.replace('<body', '<body style="margin-top:50px !important;"');
            html = html.replace('<body>', '<body>' + premiumStyle);
            res.end(html);
        });
    }
}));

app.listen(PORT, () => { console.log("Servidor Premium Protegido"); });
