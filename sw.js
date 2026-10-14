const C='zauch-v2';
const A=['./','index.html','style.css','srs.js','app.js','words.json','manifest.json','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600&family=Manrope:wght@400;500;600;700&display=swap'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A.filter(u=>!u.startsWith('http'))).then(()=>c.add(A[A.length-1]).catch(()=>{}))));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim();});
// network-first: новые слова подтягиваются, офлайн — из кэша
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true})));});
