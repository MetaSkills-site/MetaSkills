const CACHE_NAME = "metaskills-cache-v0.007"; // Increment version to trigger update
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/apple-touch-icon.png",
  "/favicon-32x32.png",
  "/fonts/Asana-Math.woff",
  "/fonts/Klimaks-Bold.otf",
  "/fonts/Klimaks-BoldItalic.otf",
  "/fonts/MADE.otf",
  "/fonts/NotoSans-Regular.woff",
  "/fonts/charter_bold-webfont.woff",
  "/fonts/charter_bold_italic-webfont.woff",
  "/fonts/charter_italic-webfont.woff",
  "/fonts/charter_regular-webfont.woff",
  "/fonts/dancingscript.woff2",
  "/fonts/handlee.woff2",
  "/fonts/quicksand.woff2",
  "https://esm.run/mathlive",
];

// Helper function to clear all caches
async function clearAllCaches() {
  console.log("[Service Worker] Clearing all caches due to error");
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map((cacheName) => {
      console.log(`[Service Worker] Deleting cache: ${cacheName}`);
      return caches.delete(cacheName);
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log(`[Service Worker] Installing version: ${CACHE_NAME}`);
        console.log("[Service Worker] Caching app shell");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch(async (error) => {
        console.error("[Service Worker] Installation failed:", error);
        await clearAllCaches();
        throw error; // Re-throw to mark installation as failed
      }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log(
                `[Service Worker] Updating to new version. Deleting old cache: ${cache}`,
              );
              return caches.delete(cache);
            }
          }),
        );
      })
      .catch(async (error) => {
        console.error("[Service Worker] Activation failed:", error);
        await clearAllCaches();
        throw error;
      }),
  );
  console.log(`[Service Worker] Activated version: ${CACHE_NAME}`);
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Bypass service worker for all API requests to allow native network execution and cookie handling
  if (url.pathname.startsWith("/api")) {
    return;
  }

  // Ignore non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Cache fonts, images, scripts, styles (Cache First)
  if (
    url.pathname.startsWith("/fonts/") ||
    url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2|otf|ttf)$/)
  ) {
    event.respondWith(
      caches
        .match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((networkResponse) => {
              if (
                !networkResponse ||
                networkResponse.status !== 200 ||
                networkResponse.type !== "basic"
              ) {
                return networkResponse;
              }
              const responseToCache = networkResponse.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch(async (error) => {
                  console.error("[Service Worker] Cache put failed:", error);
                  await clearAllCaches();
                });
              return networkResponse;
            })
            .catch(async (error) => {
              console.error(
                "[Service Worker] Fetch failed for asset:",
                url.pathname,
                error,
              );
              await clearAllCaches();
              throw error;
            });
        })
        .catch(async (error) => {
          console.error("[Service Worker] Cache match failed:", error);
          await clearAllCaches();
          return fetch(event.request);
        }),
    );
    return;
  }

  // Navigation (Network First, then Offline Page)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async (error) => {
        console.warn(
          "[Service Worker] Network fetch failed for navigation:",
          error.message,
        );
        // Don't clear cache for network failures during navigation
        // as this is expected when offline
        const offlinePage = await caches.match("/offline.html");
        if (!offlinePage) {
          console.error("[Service Worker] Offline page not in cache");
        }
        return offlinePage;
      }),
    );
    return;
  }

  // Default (Network First with Cache Fallback)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            })
            .catch(async (error) => {
              console.error(
                "[Service Worker] Cache put failed in default handler:",
                error,
              );
              await clearAllCaches();
            });
        }
        return response;
      })
      .catch(() => {
        // Don't log or clear cache for network failures
        // Just fall back to cache
        return caches.match(event.request);
      }),
  );
});

// Listen for errors globally
self.addEventListener("error", async (event) => {
  console.error("[Service Worker] Global error detected:", event.error);
  await clearAllCaches();
});

// Listen for unhandled promise rejections
self.addEventListener("unhandledrejection", async (event) => {
  console.error("[Service Worker] Unhandled rejection:", event.reason);
  await clearAllCaches();
});
