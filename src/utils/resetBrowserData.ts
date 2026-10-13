/**
 * Clears this site's localStorage, Cache Storage and any service workers.
 * Leaves sessionStorage (tab-only, used to count each visit once) and IndexedDB (Firebase admin login) alone.
 */
export function resetBrowserData() {
  try { localStorage.clear(); } catch { /* storage blocked */ }

  // Cache Storage + service workers are async, so we don't block the first render on them.
  (async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch { /* ignore */ }
  })();

  console.info('[Shuppaa] Cleared local storage and cache on page load.');
}
