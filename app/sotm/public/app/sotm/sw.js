/* Same-origin application shell only. Personal data stays in IndexedDB. */
const CACHE = "sotm-shell-v12";
const OCR_CACHE = "sotm-ocr-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      const res = await fetch("./index.html", { cache: "reload" });
      if (!res.ok) throw Error("Shell unavailable");
      const html = await res.text();
      const assets = [
        ...html.matchAll(/(?:src|href)="([^"]*assets\/[^"]+)"/g),
      ].map((m) => m[1]);
      await c.addAll([
        "./",
        "./index.html",
        "./app/sotm/logo.svg",
        "./app/sotm/logo.svg?v=3",
        "./app/sotm/wordmark.svg",
        "./app/sotm/favicon.svg",
        ...assets,
      ]);
    })(),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                (k.startsWith("phyrexian-shell-") ||
                  k.startsWith("sotm-shell-")) &&
                k !== CACHE,
            )
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  event.respondWith(
    (async () => {
      const isOCR = url.pathname.includes("/ocr/");
      const cache = await caches.open(isOCR ? OCR_CACHE : CACHE);
      try {
        const response = await fetch(event.request);
        if (
          response.ok &&
          (event.request.mode === "navigate" ||
            url.pathname.includes("/assets/") ||
            isOCR)
        ) {
          await cache.put(event.request, response.clone());
          const keys = await cache.keys();
          if (keys.length > (isOCR ? 12 : 50)) await cache.delete(keys[0]);
        }
        return response;
      } catch {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate")
          return (await cache.match("./index.html")) ?? Response.error();
        return Response.error();
      }
    })(),
  );
});
