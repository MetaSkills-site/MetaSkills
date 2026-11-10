/**
 * FILE PURPOSE: Low-level browser Cache API management utilities.
 * Allows manual cache invalidation and Service Worker resets during development or update cycles.
 *
 * DEPENDENCIES:
 * - Browser Cache API (caches global)
 * - Browser ServiceWorker API (navigator.serviceWorker)
 *
 * EXPORTS:
 * - clearAllCaches: Iteratively deletes all registered cache storages.
 * - clearCache: Deletes a specific cache by its name.
 * - getCacheNames: Returns keys of all active caches.
 * - clearCachesAndReload: Force-clears storage and triggers window reload.
 * - resetServiceWorker: Unregisters all service workers and purges caches for a clean slate.
 *
 * INTERCONNECT:
 * - Exposed via window.cacheUtils for manual debugging and recovery.
 * - Used during major updates to ensure users don't have stale assets.
 */

/**
 * Clear all browser caches registered via the Cache API
 * @returns {Promise<void>}
 */
export async function clearAllCaches() {
  try {
    // Fetch names of all existing caches in the browser storage
    const cacheNames = await caches.keys();
    // Concurrently delete each cache by name
    await Promise.all(
      cacheNames.map((cacheName) => {
        console.log(`Deleting cache: ${cacheName}`);
        return caches.delete(cacheName);
      }),
    );
    console.log("All caches cleared successfully");
  } catch (error) {
    console.error("Failed to clear caches:", error);
    throw error;
  }
}

/**
 * Clear specific cache by name
 * @param {string} cacheName - Name of the cache to clear
 * @returns {Promise<boolean>}
 */
export async function clearCache(cacheName) {
  try {
    const deleted = await caches.delete(cacheName);
    if (deleted) {
      console.log(`Cache "${cacheName}" deleted successfully`);
    } else {
      console.warn(`Cache "${cacheName}" not found`);
    }
    return deleted;
  } catch (error) {
    console.error(`Failed to clear cache "${cacheName}":`, error);
    throw error;
  }
}

/**
 * Get all cache names
 * @returns {Promise<string[]>}
 */
export async function getCacheNames() {
  try {
    return await caches.keys();
  } catch (error) {
    console.error("Failed to get cache names:", error);
    return [];
  }
}

/**
 * Clear all caches and reload the page
 * @returns {Promise<void>}
 */
export async function clearCachesAndReload() {
  await clearAllCaches();
  window.location.reload();
}

/**
 * Unregister all service workers and clear caches
 * Useful for complete reset
 * @returns {Promise<void>}
 */
export async function resetServiceWorker() {
  try {
    // Unregister all service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => {
        console.log("Unregistering service worker");
        return registration.unregister();
      }),
    );

    // Clear all caches
    await clearAllCaches();

    console.log("Service worker reset complete");
  } catch (error) {
    console.error("Failed to reset service worker:", error);
    throw error;
  }
}

// Make functions available globally for debugging
if (typeof window !== "undefined") {
  window.cacheUtils = {
    clearAllCaches,
    clearCache,
    getCacheNames,
    clearCachesAndReload,
    resetServiceWorker,
  };
  console.log("Cache utilities available at window.cacheUtils");
}
