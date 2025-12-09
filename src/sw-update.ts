/**
 * Service Worker Update Handler
 * Forces immediate activation and clears old caches
 */

export const registerSWUpdate = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      // Check for updates every 5 minutes
      setInterval(() => {
        registration.update();
      }, 5 * 60 * 1000);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available - prompt user or auto-reload
            console.log('[SW] New version available');
            
            // Auto-reload for seamless update
            if (confirm('New version available. Reload to update?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });
    });

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed, reloading...');
    });
  }
};

/**
 * Clear all service worker caches
 * Call this to force fresh load
 */
export const clearSWCaches = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => {
        console.log('[SW] Deleting cache:', name);
        return caches.delete(name);
      })
    );
    console.log('[SW] All caches cleared');
  }

  // Unregister service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(reg => {
        console.log('[SW] Unregistering:', reg.scope);
        return reg.unregister();
      })
    );
    console.log('[SW] All service workers unregistered');
  }
};

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).clearSWCaches = clearSWCaches;
}
