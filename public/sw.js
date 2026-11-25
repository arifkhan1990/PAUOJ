/* global self */

// Minimal push-only service worker. It intentionally does not intercept
// fetches or cache responses; the app keeps its normal network behaviour.
const DEFAULT_URL = "/dashboard/notifications";
const FALLBACK_TITLE = "PAU OJ";
const ICON = "/brand/pauoj-mark.png";

function toSameOriginUrl(raw) {
  const fallback = new URL(DEFAULT_URL, self.location.origin).href;
  if (typeof raw !== "string" || raw.trim() === "") return fallback;
  try {
    const url = new URL(raw, self.location.origin);
    return url.origin === self.location.origin ? url.href : fallback;
  } catch {
    return fallback;
  }
}

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  if (!payload || typeof payload !== "object") payload = {};

  const title =
    typeof payload.title === "string" && payload.title.trim() !== ""
      ? payload.title
      : FALLBACK_TITLE;
  const body = typeof payload.body === "string" ? payload.body : "";
  const url = toSameOriginUrl(payload.url);
  const tag = typeof payload.tag === "string" ? payload.tag : undefined;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      data: { url },
      icon: ICON,
      badge: ICON,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = toSameOriginUrl(event.notification.data?.url);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientList) => {
        for (const client of clientList) {
          let clientUrl;
          try {
            clientUrl = new URL(client.url);
          } catch {
            continue;
          }
          if (clientUrl.origin !== self.location.origin) continue;

          await client.focus();
          if (clientUrl.href !== target) {
            try {
              await client.navigate(target);
            } catch {
              // Some browsers refuse programmatic navigation; the focused
              // window is still the best available result.
            }
          }
          return;
        }
        return self.clients.openWindow(target);
      }),
  );
});
