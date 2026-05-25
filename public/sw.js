/* ════════════════════════════════════════════
   MARFLOW · Service Worker
   - Recibe push notifications cuando la app está cerrada
   - Las muestra con la API nativa de Notification
   - Al hacer click, abre/enfoca la app
   ════════════════════════════════════════════ */

// Skip waiting para que el SW nuevo reemplace al viejo de inmediato
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Recibe push del servidor (Edge Function)
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "MarFlow", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "MarFlow";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "marflow-notif",
    data: {
      url: data.url || "/",
    },
    // En iOS estos no siempre se respetan, pero no hacen daño
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Al hacer click en la notificación: abre/enfoca la app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una pestaña abierta, enfocarla
        for (const client of clientList) {
          if ("focus" in client) {
            return client.focus();
          }
        }
        // Si no hay ninguna, abrir nueva
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
