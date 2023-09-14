// ClearCache.js

// Function to clear the cache
function clearCache() {
    // Use the Cache API to clear the cache
    if ('caches' in window) {
      caches.keys().then(function (cacheNames) {
        cacheNames.forEach(function (cacheName) {
          caches.delete(cacheName);
        });
      });
    }
  }
  
  export default clearCache;
  