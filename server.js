const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del Proxy
app.use('/', createProxyMiddleware({
    target: 'https://m.youtube.com',
    changeOrigin: true,
    selfHandleResponse: true, // Esto nos permite modificar el código de YouTube
    onProxyRes: function (proxyRes, req, res) {
        let body = [];
        proxyRes.on('data', function (chunk) { body.push(chunk); });
        proxyRes.on('end', function () {
            body = Buffer.concat(body).toString();
            
            // EL TRUCO: Inyectamos nuestro CSS y JS "Premium" antes de que cierre el </head>
            const injectCode = `
                <link rel="icon" href="https://www.youtube.com/s/desktop/c07166ca/img/favicon_32x32.png">
                <style>
                    /* Ocultar anuncios */
                    .ad-container, .ytp-ad-overlay-container, #player-ads { display: none !important; }
                    /* Cambiar logo o estilos si querés */
                </style>
                <script>
                    console.log("YouTube Premium activado");
                    // Aquí pondremos el código de segundo plano después
                </script>
            `;
            body = body.replace('</head>', injectCode + '</head>');
            
            res.end(body);
        });
    }
}));

app.listen(PORT, () => {
    console.log(`Servidor Premium corriendo en puerto ${PORT}`);
});
