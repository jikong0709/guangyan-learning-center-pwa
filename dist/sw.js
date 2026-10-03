const CACHE="meihao-learning-center-v5",ASSETS=["./","./index.html","./styles.css","./vocabulary.js","./course-catalog.js","./app.js","./affiliate-carousel.js","./manifest.webmanifest","./icon.svg","./courses/grade6-math/","./courses/grade6-math/index.html","./courses/grade6-math/curriculum.js"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))))});

