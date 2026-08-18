// BEEDARO Service Worker: ausschliesslich Web Push.
// Bewusst KEIN fetch-Handler und KEIN Caching, damit Deploys nie in einem
// alten Cache haengen bleiben (siehe PWA-Entscheid: App ohne Offline-Cache).

// Neue Service-Worker-Version sofort uebernehmen (statt zu warten, bis alle
// Tabs/die installierte App komplett geschlossen wurden). Gefahrlos, weil wir
// bewusst nichts cachen: die App laedt Inhalte immer frisch vom Server.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Beedaro", message: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Beedaro";
  const options = {
    body: data.message || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { link: data.link || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  const url = link.startsWith("http") ? link : self.location.origin + link;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (win.url.startsWith(self.location.origin) && "focus" in win) {
          win.navigate(url);
          return win.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
