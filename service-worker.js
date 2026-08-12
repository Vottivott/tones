const CACHE_NAME = "tone-raindrops-v80";
const ASSETS = [
  "./",
  "./index.html",
  "./collector.html",
  "./styles.css",
  "./collector.css",
  "./app.js",
  "./voice-forest.js",
  "./collector.js",
  "./voice-model.json",
  "./voice-model-tone-perfect.json",
  "./supabase-voice-setup.sql",
  "./supabase-delete-ma-ba.sql",
  "./supabase-delete-latest-tang3.sql",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./bird_square_strict.gif",
  "./shuffle.svg",
  "./medals/bronze.png",
  "./medals/silver.png",
  "./medals/gold.png",
  "./medals/platinum.png",
  "./meaning_images/air.jpg",
  "./meaning_images/aunt.jpg",
  "./meaning_images/bamboo.jpg",
  "./meaning_images/belly.jpg",
  "./meaning_images/bend.jpg",
  "./meaning_images/bite.jpg",
  "./meaning_images/boil.jpg",
  "./meaning_images/boat.jpg",
  "./meaning_images/book.jpg",
  "./meaning_images/capital.jpg",
  "./meaning_images/cat.jpg",
  "./meaning_images/celebrate.jpg",
  "./meaning_images/center.jpg",
  "./meaning_images/chair.jpg",
  "./meaning_images/chicken.jpg",
  "./meaning_images/clothes.jpg",
  "./meaning_images/color.jpg",
  "./meaning_images/country.jpg",
  "./meaning_images/cross.jpg",
  "./meaning_images/dad.jpg",
  "./meaning_images/eight.jpg",
  "./meaning_images/emotion.jpg",
  "./meaning_images/evening.jpg",
  "./meaning_images/exchange.jpg",
  "./meaning_images/eye.jpg",
  "./meaning_images/flag.jpg",
  "./meaning_images/fortune.jpg",
  "./meaning_images/fruit.jpg",
  "./meaning_images/gamble.jpg",
  "./meaning_images/gasp.jpg",
  "./meaning_images/guess.jpg",
  "./meaning_images/green.jpg",
  "./meaning_images/hair.jpg",
  "./meaning_images/hat.jpg",
  "./meaning_images/hemp.jpg",
  "./meaning_images/heavy.jpg",
  "./meaning_images/history.jpg",
  "./meaning_images/hold.jpg",
  "./meaning_images/home.jpg",
  "./meaning_images/horse.jpg",
  "./meaning_images/house.jpg",
  "./meaning_images/hot.jpg",
  "./meaning_images/hug.jpg",
  "./meaning_images/insect.jpg",
  "./meaning_images/invite.jpg",
  "./meaning_images/is.jpg",
  "./meaning_images/joy.jpg",
  "./meaning_images/lie-down.jpg",
  "./meaning_images/life.jpg",
  "./meaning_images/medicine.jpg",
  "./meaning_images/mother.jpg",
  "./meaning_images/mouse.jpg",
  "./meaning_images/name.jpg",
  "./meaning_images/package.jpg",
  "./meaning_images/pig.jpg",
  "./meaning_images/play.jpg",
  "./meaning_images/pot.jpg",
  "./meaning_images/province.jpg",
  "./meaning_images/pull.jpg",
  "./meaning_images/rabbit.jpg",
  "./meaning_images/read.jpg",
  "./meaning_images/release.jpg",
  "./meaning_images/remember.jpg",
  "./meaning_images/ripe.jpg",
  "./meaning_images/rise.jpg",
  "./meaning_images/rope.jpg",
  "./meaning_images/ring.jpg",
  "./meaning_images/salt.jpg",
  "./meaning_images/scold.jpg",
  "./meaning_images/several.jpg",
  "./meaning_images/seven.jpg",
  "./meaning_images/shake.jpg",
  "./meaning_images/seed.jpg",
  "./meaning_images/skewer.jpg",
  "./meaning_images/slow.jpg",
  "./meaning_images/smoke.jpg",
  "./meaning_images/soup.jpg",
  "./meaning_images/square.jpg",
  "./meaning_images/star.jpg",
  "./meaning_images/sugar.jpg",
  "./meaning_images/swallow.jpg",
  "./meaning_images/talent.jpg",
  "./meaning_images/teacher.jpg",
  "./meaning_images/ten.jpg",
  "./meaning_images/ten-thousand.jpg",
  "./meaning_images/thin.jpg",
  "./meaning_images/treasure.jpg",
  "./meaning_images/tree.jpg",
  "./meaning_images/urgent.jpg",
  "./meaning_images/victory.jpg",
  "./meaning_images/visit.jpg",
  "./meaning_images/waist.jpg",
  "./meaning_images/wake.jpg",
  "./meaning_images/walk.jpg",
  "./meaning_images/wear.jpg",
  "./meaning_images/vegetable.jpg",
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
