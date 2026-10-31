// Local static server for the spike. Serves docs/specimens at /; /word/* is a stub so no-JS links land somewhere.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root='/home/yunus/Work/openarabic-web/docs/specimens'; const T={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.woff2':'font/woff2','.mp3':'audio/mpeg','.png':'image/png'};
http.createServer((q,s)=>{const u=new URL(q.url,'http://x');let p=decodeURIComponent(u.pathname);
 if(p.startsWith('/word/')){s.writeHead(200,{'content-type':T['.html']});return s.end(`<!doctype html><html lang=en><title>Word stub</title><h1>Word page stub ${p}</h1>`)}
 const f=path.join(root,p.startsWith('/')?p:'/'+p); if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end('404')}
 s.writeHead(200,{'content-type':T[path.extname(f)]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(f).pipe(s)
}).listen(4390,'127.0.0.1',()=>console.log('up'));
