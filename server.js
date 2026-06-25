// Servidor estático simples — sem dependências externas (só Node puro)
// Uso: node server.js  (depois acesse http://localhost:3000/src/features/portal-agro/portal-agro.html)

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname; // serve a partir da raiz do projeto

const MIME_TYPES = {
  '.html': 'text/html',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // Página inicial -> redireciona direto pro portal
  if (reqPath === '/') {
    res.writeHead(302, { Location: '/src/features/portal-agro/portal-agro.html' });
    return res.end();
  }

  const filePath = path.join(ROOT, reqPath);

  // Proteção simples contra path traversal (ex: ../../etc/passwd)
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Acesso negado');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 - Arquivo não encontrado: ' + reqPath);
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em: http://localhost:${PORT}`);
  console.log(`Abra: http://localhost:${PORT}/src/features/portal-agro/portal-agro.html`);
});
