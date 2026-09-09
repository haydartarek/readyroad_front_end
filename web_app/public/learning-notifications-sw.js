self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { return; }
  if (typeof data.body !== "string") return;
  let url;
  try { url = new URL(data.url, self.location.origin); } catch { return; }
  if (url.origin !== self.location.origin) return;
  event.waitUntil(self.registration.showNotification("RijVia", {
    body: data.body, tag: typeof data.tag === "string" ? data.tag : undefined,
    icon: "/apple-touch-icon.png", data: { url: url.href },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? "/", self.location.origin);
  if (url.origin !== self.location.origin) return;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
    const client = clients.find((item) => new URL(item.url).origin === self.location.origin);
    if (client) { await client.navigate(url.href); await client.focus(); }
    else await self.clients.openWindow(url.href);
  }));
});
