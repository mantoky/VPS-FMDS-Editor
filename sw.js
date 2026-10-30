// ATENÇÃO: manter em sincronia com APP_VERSION em index.html.
// O checklist FMDS compara as duas e avisa quando divergem.
const APP_VERSION = "2026.10.29-v64-report-lte-two-box";
const CACHE_NAME = `vps-operacional-pwa-${APP_VERSION}`;
// Recursos que devem preferir a rede (config que muda fora do release).
const NETWORK_FIRST = /\/firebase-config\.js$/;
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./firebase-config.js",
  "./icons/icon-pack.js",
  "./vendor/html2canvas.min.js",
  "./vendor/jspdf.umd.min.js",
  "./vps-pwa-icon.svg",
  "./vps-pwa-icon-180.png",
  "./vps-pwa-icon-192.png",
  "./vps-pwa-icon-512.png",
  "./default-background.png",
  "./default-client-logo.png",
  "./default-contractor-logo.png",
  "./icons/target.svg",
  "./icons/clipboard.svg",
  "./icons/alert.svg",
  "./icons/calendar.svg",
  "./icons/tower.svg",
  "./icons/network.svg",
  "./icons/wrench.svg",
  "./icons/antenna.svg"
];

/**
 * Instalação tolerante a falha parcial.
 *
 * `cache.addAll` é tudo-ou-nada: um único 404 (um ícone renomeado, por exemplo)
 * abortava a instalação inteira e o app ficava sem Service Worker, em silêncio.
 * Agora cada item é adicionado isoladamente e as falhas viram aviso no console.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(APP_SHELL.map((url) => cache.add(url)));
      const failed = results
        .map((result, i) => (result.status === "rejected" ? APP_SHELL[i] : null))
        .filter(Boolean);
      if (failed.length) {
        console.warn(`[sw] ${failed.length} item(ns) do app shell falharam no cache:`, failed);
      }
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("vps-operacional-pwa-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      // `clients.claim()` estava fora do waitUntil: a promise podia não ser
      // aguardada e o SW assumia o controle depois do esperado.
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const request = event.request;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/.netlify/functions/") || url.pathname.startsWith("/api/")) {
    return;
  }
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          }
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  /**
   * firebase-config.js carrega credenciais editadas fora do ciclo de release.
   * Em cache-first, trocar as credenciais e recarregar não surtia efeito até o
   * CACHE_NAME mudar. Network-first com fallback ao cache resolve sem perder o
   * funcionamento offline.
   */
  if (NETWORK_FIRST.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
    )
  );
});
