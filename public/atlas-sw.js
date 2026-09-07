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
  const hits = (items || []).filter((x) => {
    const left = (x.end || 0) - Date.now();
    return left >= 0 && left <= 36 * 60 * 60 * 1000;
  });
  if (!hits.length) return;
  const today = hits.filter((x) => (x.end || 0) - Date.now() < 24 * 60 * 60 * 1000);
  const body = (today.length ? today : hits)
    .map((h) =>
      (h.end || 0) - Date.now() < 24 * 60 * 60 * 1000
        ? `${h.name}: ochrona kończy się dziś`
        : `${h.name}: ochrona kończy się jutro`,
    )
    .join(". ");
  await self.registration.showNotification("Atlas wędkarski — tarło", {
    body,
    tag: "atlas-tarlo",
  });
}

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "atlas-tarlo") e.waitUntil(checkTarlo());
});

self.addEventListener("push", (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = { body: e.data ? e.data.text() : "" };
  }
  const title = data.title || "Atlas wędkarski";
  e.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "Sygnał z atlasu",
      tag: data.tag || "atlas",
    }),
  );
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
