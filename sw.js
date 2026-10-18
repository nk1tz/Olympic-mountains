const V=24,A="hdl-app-v"+V,T="hdl-tiles-v1",F=["./","index.html","app.js?v="+V,"data.js?v="+V,"manifest.json","icon-192.png","icon-512.png","lib/leaflet.js","lib/leaflet.css"];
// Precache with cache:"reload" so a deploy made minutes ago is not served from the HTTP cache (GitHub Pages sends max-age=600).
self.addEventListener("install",e=>{e.waitUntil(caches.open(A).then(c=>c.addAll(F.map(u=>new Request(u,{cache:"reload"})))));self.skipWaiting()});
// Only touch this app's own caches ("hdl-"); other sites on the same origin keep theirs.
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith("hdl-")&&n!=A&&n!=T).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const u=e.request.url;if(e.request.method!="GET")return;
 // Map tiles: cache first. OpenTopoMap allows CORS, so responses carry a real status and only good tiles are stored.
 if(u.includes("tile.opentopomap.org")){const key=u.replace(/^https:\/\/[abc]\./,"https://a.");e.respondWith(caches.open(T).then(async c=>{const m=await c.match(key);if(m)return m;const r=await fetch(key,{mode:"cors"});if(r.ok)e.waitUntil(c.put(key,r.clone()));return r}))}
 // App shell: cache first, refresh in the background. index.html reloads once when a new worker takes over.
 else if(u.startsWith(self.location.origin))e.respondWith(caches.open(A).then(async c=>{const m=await c.match(e.request,{ignoreSearch:true});const net=fetch(e.request,{cache:"no-cache"}).then(r=>{if(r.ok)e.waitUntil(c.put(e.request,r.clone()));return r});if(m){e.waitUntil(net.catch(()=>{}));return m}return net}))});
