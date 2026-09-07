/* Atlas wędkarski — lokalne powiadomienia o końcu ochrony. */
self.addEventListener("install", (e) => {
  e.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("message", (e) => {
  const data = e.data;
  if (!data || data.type !== "tarlo") return;
  e.waitUntil(
    caches.open("atlas-tarlo").then((c) =>
      c.put("/__tarlo.json", new Response(JSON.stringify(data.items ?? []))),
    ),
  );
});

async function checkTarlo() {
  const cache = await caches.open("atlas-tarlo");
  const res = await cache.match("/__tarlo.json");
  if (!res) return;
  const items = await res.json();
  const hits = (items || []).filter((x) => x && x.days <= 1);
  if (!hits.length) return;
  const body =
    hits[0].days === 0
      ? hits.map((h) => `${h.name}: ochrona kończy się dziś`).join(". ")
      : hits.map((h) => `${h.name}: ochrona kończy się jutro`).join(". ");
  await self.registration.showNotification("Atlas wędkarski — tarło", {
    body,
    tag: "atlas-tarlo",
  });
}

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "atlas-tarlo") e.waitUntil(checkTarlo());
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cl) => {
      if (cl[0]) return cl[0].focus();
      return self.clients.openWindow("/");
    }),
  );
});
