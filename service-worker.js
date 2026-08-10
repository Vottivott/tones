const CACHE_NAME = "tone-raindrops-v53";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./bird_square_strict.gif",
  "./shuffle.svg",
  "./medals/bronze.png",
  "./medals/silver.png",
  "./medals/gold.png",
  "./medals/platinum.png",
  "./meaning_images/aunt.jpg",
  "./meaning_images/chair.jpg",
  "./meaning_images/clothes.jpg",
  "./meaning_images/dad.jpg",
  "./meaning_images/eight.jpg",
  "./meaning_images/fortune.jpg",
  "./meaning_images/hemp.jpg",
  "./meaning_images/history.jpg",
  "./meaning_images/hold.jpg",
  "./meaning_images/horse.jpg",
  "./meaning_images/is.jpg",
  "./meaning_images/mother.jpg",
  "./meaning_images/pull.jpg",
  "./meaning_images/scold.jpg",
  "./meaning_images/teacher.jpg",
  "./meaning_images/ten.jpg",
  "./tone_grid_images/1.png",
  "./tone_grid_images/11.png",
  "./tone_grid_images/12.png",
  "./tone_grid_images/13.png",
  "./tone_grid_images/14.png",
  "./tone_grid_images/2.png",
  "./tone_grid_images/21.png",
  "./tone_grid_images/22.png",
  "./tone_grid_images/23.png",
  "./tone_grid_images/24.png",
  "./tone_grid_images/3.png",
  "./tone_grid_images/31.png",
  "./tone_grid_images/32.png",
  "./tone_grid_images/33.png",
  "./tone_grid_images/34.png",
  "./tone_grid_images/4.png",
  "./tone_grid_images/41.png",
  "./tone_grid_images/42.png",
  "./tone_grid_images/43.png",
  "./tone_grid_images/44.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
