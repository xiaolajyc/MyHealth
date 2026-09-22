const VERSION="2026-09-23-v2.13";
const CACHE=`my-health-${VERSION}`;
const SHELL=["./","./index.html","./manifest.json","./icon-192.png","./icon-512.png","./apple-touch-icon-180.png"];

self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("my-health-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("message",event=>{if(event.data==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",event=>{
 if(event.request.method!=="GET")return;
 const u=new URL(event.request.url);
 if(u.origin!==location.origin)return;
 event.respondWith(
  fetch(event.request,{cache:"no-store"}).then(r=>{
   if(r.ok)caches.open(CACHE).then(c=>c.put(event.request,r.clone()));
   return r;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match("./index.html")))
 );
});