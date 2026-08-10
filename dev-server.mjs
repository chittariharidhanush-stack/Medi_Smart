import http from 'node:http'; import { readFile } from 'node:fs/promises'; import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = process.cwd(); const port = Number(process.env.PORT || 5173);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};

let apiHandler;
try { apiHandler = require('./api/[...path].js'); } catch (e) { console.error('Failed to load API handler', e); }

http.createServer(async (req,res)=>{try{let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(p.startsWith('/api') && apiHandler){return apiHandler(req,res);}if(p==='/')p='/index.html';let file=normalize(join(root,p));if(!file.startsWith(normalize(root)))return res.writeHead(403).end();try{const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});return res.end(data)}catch{const data=await readFile(join(root,'index.html'));res.writeHead(200,{'Content-Type':'text/html'});return res.end(data)}}catch{res.writeHead(500).end('Server error')}}).listen(port,()=>console.log(`Medi Smart running locally at: http://localhost:${port}`));
