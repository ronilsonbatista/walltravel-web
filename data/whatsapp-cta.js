/**
 * Central WhatsApp CTA builder.
 * Prefills `text=` from click origin: vitrine | grupo | site.
 * User-visible message is separate from analytics attribution.
 */

import { getWhatsappNumber } from "./platform-api.js";

/** @typedef {'vitrine' | 'grupo' | 'site'} WhatsAppContext */

/**
 * Contextual PT-BR templates. No em dash in copy.
 * @param {WhatsAppContext} context
 * @param {string} [title]
 * @param {{ comingSoon?: boolean }} [opts]
 */
export function messageForContext(context, title, opts = {}) {
  const name = String(title || "").trim();
  const ctx = normalizeContext(context);

  if (ctx === "vitrine") {
    if (name) {
      return `Olá! Vim pela vitrine do site e tenho interesse no planejamento "${name}".`;
    }
    return "Olá! Vim pela vitrine do site e gostaria de planejar uma experiência sob medida.";
  }

  if (ctx === "grupo") {
    if (opts.comingSoon) {
      if (name) {
        return `Olá! Vim pela página de viagens em grupo e quero ser avisado quando a expedição "${name}" abrir.`;
      }
      return "Olá! Vim pela página de viagens em grupo e quero ser avisado quando novas expedições abrirem.";
    }
    if (name) {
      return `Olá! Vim pela página de viagens em grupo e quero saber mais sobre a expedição "${name}".`;
    }
    return "Olá! Vim pela página de viagens em grupo e gostaria de falar com um especialista.";
  }

  // site (default): header, float, home, como-funciona, sobre, etc.
  if (name) {
    return `Olá! Vim pelo site da WallTravel e tenho interesse em "${name}".`;
  }
  return "Olá! Vim pelo site da WallTravel e gostaria de falar com um especialista.";
}

/**
 * @param {string} [pageType]
 * @param {string} [placement]
 * @returns {WhatsAppContext}
 */
export function contextFromPageType(pageType, placement) {
  const type = String(pageType || "GENERIC").toUpperCase();
  const place = String(placement || "").toLowerCase();

  if (type === "VITRINE" || place === "product" || place === "package" || place === "category") {
    return "vitrine";
  }
  if (type === "GROUP" || type === "GROUPS" || type === "COMING_SOON") {
    return "grupo";
  }
  return "site";
}

function normalizeContext(context) {
  const c = String(context || "site").toLowerCase();
  if (c === "vitrine" || c === "grupo" || c === "site") return c;
  if (c === "group" || c === "groups") return "grupo";
  if (c === "package" || c === "product") return "vitrine";
  return "site";
}

/**
 * Shared WhatsApp URL helper.
 * @param {object} opts
 * @param {string} [opts.phone] digits or formatted number
 * @param {WhatsAppContext} [opts.context]
 * @param {string} [opts.title] package or expedition name
 * @param {boolean} [opts.comingSoon]
 * @param {string} [opts.customMessage] full override (forms / rare cases)
 * @returns {{ href: string, message: string, number: string, context: WhatsAppContext }}
 */
export function buildWhatsAppUrl({
  phone,
  context = "site",
  title,
  comingSoon = false,
  customMessage,
} = {}) {
  const number = String(phone || getWhatsappNumber()).replace(/\D/g, "");
  const ctx = normalizeContext(context);
  const message =
    customMessage && String(customMessage).trim()
      ? String(customMessage).trim()
      : messageForContext(ctx, title, { comingSoon });
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  return { href, message, number, context: ctx };
}

/**
 * @param {object} opts
 * @param {string} [opts.source] analytics source
 * @param {string} [opts.pageType] HOME | VITRINE | GROUP | COMING_SOON | …
 * @param {string} [opts.path] current path
 * @param {object|string} [opts.entity] { name, slug, comingSoon } or string name
 * @param {string} [opts.placement] nav | hero | float | slide | form | …
 * @param {string} [opts.customMessage] overrides template
 * @param {string} [opts.number] WhatsApp digits
 * @param {WhatsAppContext} [opts.context] explicit context (wins over pageType map)
 * @returns {{ href: string, message: string, number: string, analytics: object }}
 */
export function buildWhatsAppCTA(opts = {}) {
  const entity =
    typeof opts.entity === "string" ? { name: opts.entity } : opts.entity || null;
  const path =
    opts.path ||
    (typeof window !== "undefined" ? window.location?.pathname || "/" : "/");
  const comingSoon =
    Boolean(entity?.comingSoon) ||
    String(opts.pageType || "").toUpperCase() === "COMING_SOON";

  // Category listings name a category, not a product title.
  const placement = String(opts.placement || "").toLowerCase();
  const isCategoryListing =
    placement === "category" ||
    placement === "category-empty" ||
    placement === "category-filter-empty";
  const title = entity?.name || entity?.title || "";
  const context = opts.context || contextFromPageType(opts.pageType, opts.placement);

  let customMessage = opts.customMessage;
  if (!customMessage && isCategoryListing && title && context === "vitrine") {
    customMessage = `Olá! Vim pela vitrine do site e gostaria de um roteiro sob medida na categoria "${title}".`;
  }

  const built = buildWhatsAppUrl({
    phone: opts.number,
    context,
    title: isCategoryListing ? undefined : title,
    comingSoon,
    customMessage,
  });

  return {
    href: built.href,
    message: built.message,
    number: built.number,
    analytics: {
      source: opts.source || "storefront",
      pageType: opts.pageType || "GENERIC",
      context: built.context,
      path,
      entity: entity?.slug || entity?.name || null,
      placement: opts.placement || null,
    },
  };
}

/** Apply buildWhatsAppCTA() to elements with [data-wa-cta]. */
export function hydrateWhatsAppCTAs(root = document) {
  root.querySelectorAll("[data-wa-cta]").forEach((el) => {
    const cta = buildWhatsAppCTA({
      source: el.getAttribute("data-wa-source") || "storefront",
      pageType: el.getAttribute("data-wa-page-type") || "HOME",
      path: el.getAttribute("data-wa-path") || undefined,
      placement: el.getAttribute("data-wa-placement") || undefined,
      customMessage: el.getAttribute("data-wa-message") || undefined,
      context: el.getAttribute("data-wa-context") || undefined,
      entity: el.getAttribute("data-wa-entity")
        ? { name: el.getAttribute("data-wa-entity") }
        : null,
    });
    el.setAttribute("href", cta.href);
    el.setAttribute("data-storefront-cta", el.getAttribute("data-storefront-cta") || "whatsapp");
    el.setAttribute("data-wa-analytics", JSON.stringify(cta.analytics));
  });
}
