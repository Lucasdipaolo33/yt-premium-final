const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', async (req, res) => {
    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Simular un celular real para que no pida login
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1');

        // BLOQUEADOR DE PUBLICIDAD (Como una extensión)
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            if (request.url().includes('doubleclick') || request.url().includes('adservice')) {
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto('https://m.youtube.com', { waitUntil: 'networkidle2' });
        
        // Inyectar el zócalo Premium
        await page.evaluate(() => {
            const header = document.createElement('div');
            header.style = "position:fixed; top:0; width:100%; height:40px; background:black; color:white; z-index:9999; display:flex; align-items:center; justify-content:center; font-weight:bold;";
            header.innerText = "YOUTUBE PREMIUM - MODO NAVEGADOR";
            document.body.prepend(header);
            document.body.style.marginTop = "40px";
        });

        const content = await page.content();
        await browser.close();
        res.send(content);
    } catch (e) {
        res.send("Error al iniciar navegador virtual: " + e.message);
    }
});

app.listen(PORT, () => console.log("Navegador Virtual Iniciado"));
