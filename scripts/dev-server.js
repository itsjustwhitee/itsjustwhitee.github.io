// Local dev server that behaves like GitHub Pages, not just a plain static
// file server: unmatched routes get 404.html (with a real 404 status) instead
// of a bare server error, and directory requests resolve to index.html.
// No dependencies - Node's built-in http/fs only.
//
// Usage: node scripts/dev-server.js [port]   (default port 8080)
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.argv[2]) || 8080;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

function send(res, status, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    // Dev server: never let the browser cache anything, so edits show up on
    // the next reload instead of silently serving a stale version.
    res.writeHead(status, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
    let filePath = path.normalize(path.join(ROOT, urlPath));

    // Guard against path traversal outside the site root
    if (!filePath.startsWith(ROOT)) {
        filePath = path.join(ROOT, '404.html');
    }

    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
        fs.stat(filePath, (err2, stats2) => {
            if (!err2 && stats2.isFile()) {
                send(res, 200, filePath);
            } else {
                // GitHub Pages behavior: serve 404.html content with a real 404 status
                send(res, 404, path.join(ROOT, '404.html'));
            }
        });
    });
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use - dev server is probably already running at http://localhost:${PORT}/`);
        process.exit(0);
    }
    throw err;
});

server.listen(PORT, () => {
    console.log(`Dev server (GitHub-Pages-like 404 handling) running at http://localhost:${PORT}/`);
});
