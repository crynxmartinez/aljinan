// Service Worker Unregister Script
// This clears all caches and unregisters the service worker

self.addEventListener('install', () => {
  // Skip waiting and activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Delete all caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Unregister this service worker
      return self.registration.unregister();
    }).then(() => {
      // Reload all clients to get fresh content
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach(client => client.navigate(client.url));
    })
  );
});
