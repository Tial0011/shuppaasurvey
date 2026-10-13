/**
 * When true, every full page load / reload wipes this site's localStorage and Cache Storage.
 * Handy while testing (it removes the "You've already responded" memory so you can resubmit).
 * IMPORTANT: set to false before the real campaign. With it on, anyone can submit again by reloading.
 */
export const CLEAR_BROWSER_DATA_ON_LOAD = true;
