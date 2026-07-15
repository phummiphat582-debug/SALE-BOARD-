importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCowDEvUQpBmq7AwUGiC6IuGOudPhi_0kM",
  authDomain: "vehicle-maintenance-64890.firebaseapp.com",
  projectId: "vehicle-maintenance-64890",
  storageBucket: "vehicle-maintenance-64890.firebasestorage.app",
  messagingSenderId: "59942066726",
  appId: "1:59942066726:web:f53cdeae8fb2da80e4a4e7"
});

const firebaseMessaging = firebase.messaging();
firebaseMessaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || payload.data?.title || "Sales Dashboard";
  const body = payload.notification?.body || payload.data?.body || "มีข้อมูลใหม่";
  self.registration.showNotification(title, {
    body,
    icon: "icon-192.png",
    badge: "icon-192.png",
    tag: "sale-board-data",
    renotify: true,
    data: { url: "./index.html" }
  });
});

const CACHE_NAME = "dashboard-cache-v4";
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

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
