const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 10000;

// Si entran a la raíz, les mostramos una interfaz de bienvenida limpia
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { background: #0f0f0f; color: white; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .search-box { display: flex; width: 90%; max-width: 500px; }
                input { flex: 1; padding: 12px; border: none; border-radius: 20px 0 0 20px; outline: none; }
                button { padding: 12px 20px; border: none; background: #f00; color: white; border-radius: 0 20px 20px 0; cursor: pointer; font-weight: bold; }
                .logo { display: flex; align-items: center; margin-bottom: 20px; }
                .logo img { height: 40px; margin-right: 10px; }
            </style>
        </head>
        <body>
            <div class="logo">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg">
                <h1>Premium</h1>
            </div>
            <form action="/search" method="get" class="search-box">
                <input type="text" name="q" placeholder="Buscar en YouTube Premium..." required>
                <button type="submit">BUSCAR</button>
            </form>
            <p style="margin-top:20px; color:#aaa; font-size:12px;">Facultad de Programación - Acceso Seguro</p>
        </body>
        </html>
    `);
});

// Cuando buscan, los mandamos al modo "Embed" que no pide validación de Bot
app.get('/search', (req, res) => {
    const query = req.query.q;
    res.redirect(\`/embed?listType=search&list=\${encodeURIComponent(query)}\`);
});

app.use('/', createProxyMiddleware({
    target: 'https://www.youtube.com',
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (SmartTV; mStar; XBMC) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36');
    },
    onProxyRes: function (proxyRes, req, res) {
        let body = [];
        proxyRes.on('data', function (chunk) { body.push(chunk); });
        proxyRes.on('end', function () {
            let html = Buffer.concat(body).toString();
            const premiumOverlay = \`
                <style>
                    #header-p { position: fixed; top: 0; width: 100%; height: 50px; background: #000; display: flex; align-items: center; justify-content: space-around; z-index: 999999; border-bottom: 1px solid #333; }
                    #header-p a { color: white; text-decoration: none; font-weight: bold; background: #333; padding: 5px 15px; border-radius: 15px; font-size: 14px; }
                    body { margin-top: 50px !important; }
                </style>
                <div id="header-p">
                    <span style="color:white; font-weight:bold;">YouTube Premium</span>
                    <a href="/">NUEVA BÚSQUEDA</a>
                </div>
            \`;
            html = html.replace('<body>', '<body>' + premiumOverlay);
            res.end(html);
        });
    }
}));

app.listen(PORT);
