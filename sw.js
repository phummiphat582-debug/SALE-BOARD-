const CACHE_NAME = "dashboard-cache-v7";
const urlsToCache = [
  "./",
  "./index.html"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const existing = list.find(client => "focus" in client);
    return existing ? existing.focus() : clients.openWindow("./index.html");
  }));
});

self.addEventListener("push", event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Sales Dashboard";
  const body = data.body || "มีข้อมูลใหม่";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    list.forEach(client => client.postMessage({ type: "push-notification", title, body }));
  }));
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "icon-192.png",
    badge: "icon-192.png",
    tag: "sale-board-data",
    renotify: true,
    timestamp: Date.now(),
    vibrate: [120, 60, 120],
    data: { url: "./index.html" }
  }));
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
