const A="app-v21",T="tiles-v1",F=["./","index.html","app.js","data.js","manifest.json","icon-192.png","icon-512.png","lib/leaflet.js","lib/leaflet.css","lib/images/marker-icon.png","lib/images/layers.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(A).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!=A&&n!=T).map(n=>caches.delete(n)))));self.clients.claim()});
self.addEventListener("fetch",e=>{const u=e.request.url;
 if(u.includes("tile.opentopomap.org")){const key=u.replace(/^https:\/\/[abc]\./,"https://a.");e.respondWith(caches.open(T).then(async c=>{const m=await c.match(key);if(m)return m;try{const r=await fetch(key,{mode:"no-cors"});c.put(key,r.clone());return r}catch(_){return Response.error()}}))}
 else if(u.startsWith(self.location.origin)&&e.request.method=="GET")e.respondWith(fetch(e.request,{cache:"no-cache"}).then(r=>{const c=r.clone();caches.open(A).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
