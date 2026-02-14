const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

app.use('/', createProxyMiddleware({
    target: 'https://m.youtube.com',
    changeOrigin: true,
    cookieDomainRewrite: "onrender.com", // Para que no se rompa el login
    onProxyRes: function (proxyRes, req, res) {
        let body = [];
        proxyRes.on('data', function (chunk) { body.push(chunk); });
        proxyRes.on('end', function () {
            let html = Buffer.concat(body).toString();
            
            // INYECCIÓN DE ESTILO Y LOGO PREMIUM
            const premiumStyle = `
                <style>
                    /* Zócalo Premium Superior */
                    #premium-bar {
                        position: fixed; top: 0; left: 0; width: 100%; height: 48px;
                        background: #0f0f0f; display: flex; align-items: center;
                        justify-content: center; z-index: 999999; border-bottom: 1px solid #333;
                    }
                    #premium-bar img { height: 20px; margin-right: 5px; }
                    #premium-bar span { color: white; font-weight: bold; font-size: 18px; font-family: sans-serif; }
                    
                    /* Ajuste para que YouTube no quede debajo del zócalo */
                    body { margin-top: 48px !important; }
                    
                    /* BLOQUEO DE PUBLICIDAD BÁSICO */
                    .ad-container, .ytp-ad-overlay-container, ytm-promoted-video-renderer { display: none !important; }
                </style>
                <div id="premium-bar">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg">
                    <span>YouTube Premium</span>
                </div>
            `;
            
            // Metemos el código justo después de que empieza el body
            html = html.replace('<body>', '<body>' + premiumStyle);
            res.end(html);
        });
    }
}));

app.listen(PORT, () => {
    console.log("Servidor Premium Activo");
});
