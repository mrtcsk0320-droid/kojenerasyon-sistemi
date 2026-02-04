const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const port = 8113;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Proxy API requests to backend
  if (req.url.startsWith('/api/')) {
    const proxyReq = http.request({
      hostname: 'localhost',
      port: 3000,
      path: req.url, // Backend'de /api prefix'i var
      method: req.method,
      headers: {
        ...req.headers,
        'host': 'localhost:3000'
      }
    }, (proxyRes) => {
      // Copy headers but override CORS headers
      const headers = { ...proxyRes.headers };
      headers['Access-Control-Allow-Origin'] = '*';
      headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    });
    
    req.on('error', (err) => {
      console.error('Proxy error:', err);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway');
    });
    
    req.pipe(proxyReq);
    return;
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve index.html for root and SPA routes
  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // Remove query string for file path resolution
  if (filePath.includes('?')) {
    filePath = filePath.split('?')[0];
  }
  
  // Handle SPA routes - return index.html for all non-file requests
  if (!path.extname(filePath)) {
    filePath = '/index.html';
  }
  
  filePath = path.join(__dirname, filePath);

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if(error.code == 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, () => {
  console.log(`🚀 Local server running at http://localhost:${port}`);
  console.log(`📱 Test: http://localhost:${port}`);
  console.log(`🔥 Enerji sayfası: http://localhost:${port}#energy`);
});
