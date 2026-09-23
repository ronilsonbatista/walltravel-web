/**
 * Phase 14 event contract — hooks only (no persistence / dashboard).
 * Platform will ingest these later.
 */

const EVENT_NAMES = new Set([
  "vitrine_view",
  "category_view",
  "package_view",
  "viagem_view",
  "whatsapp_click",
  "specialist_cta_click",
  "storefront_api_fallback",
  "storefront_api_ok",
]);

/**
 * @param {string} name
 * @param {Record<string, unknown>} [payload]
 */
export function trackStorefrontEvent(name, payload = {}) {
  if (!EVENT_NAMES.has(name)) return;
  const detail = {
    name,
    payload,
    at: new Date().toISOString(),
    source: "walltravel-web",
  };
  try {
    window.dispatchEvent(new CustomEvent("walltravel:storefront", { detail }));
  } catch {
    /* ignore */
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[storefront-event]", detail);
  }
}

export function bindWhatsappTracking(root = document) {
  root.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest?.("a[href*='wa.me'], a[href*='whatsapp']");
      if (!a) return;
      trackStorefrontEvent("whatsapp_click", {
        href: a.getAttribute("href"),
        path: window.location.pathname,
      });
    },
    true,
  );
}
