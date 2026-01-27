/* src/utils/progressToast.js */

/**
 * Show an XP toast using the global progressManager if it exists.
 *
 * @param {Object} opts
 * @param {string} opts.message   Text to display (e.g. "+10 XP")
 * @param {string} [opts.className]  Optional CSS class for custom styling
 * @param {number} [opts.timeout]    Duration in ms (default 3000)
 * @returns {boolean} true if a toast was shown, false otherwise
 */
function showXPToast(opts) {
  var manager = window.progressManager;

  // 1️⃣ Guard – make sure the function is really there
  if (manager && typeof manager.showXPToast === "function") {
    manager.showXPToast(opts.message, {
      className: opts.className,
      timeout: opts.timeout,
    });
    return true;
  }

  // 2️⃣ Optional simple fallback using the Notification API
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(opts.message);
    return true;
  }

  // 3️⃣ Nothing available – log a warning for debugging
  console.warn("progressManager.showXPToast is not defined");
  return false;
}

/* Export for use in other scripts (works in both modules and classic scripts) */
if (typeof module !== "undefined" && module.exports) {
  // CommonJS (Node/Electron, etc.)
  module.exports = showXPToast;
} else {
  // Browser global – attach to window so you can call it directly
  window.showXPToast = showXPToast;
}

