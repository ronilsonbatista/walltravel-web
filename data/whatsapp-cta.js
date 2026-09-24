/**
 * Central WhatsApp CTA builder.
 * User-visible message is separate from analytics attribution.
 */

import { getWhatsappNumber } from "./platform-api.js";

/** Configurable templates (CMS Site Settings can override via window.__WT_WA_TEMPLATES__). */
const DEFAULT_TEMPLATES = {
  HOME: "Olá! Gostaria de planejar minha próxima viagem personalizada com a WallTravel.",
  HOME_SLIDE: (entity) =>
    `Olá! Gostaria de planejar uma viagem para ${entity || "este destino"} com a WallTravel.`,
  VITRINE: "Olá! Quero explorar a vitrine WallTravel e planejar uma experiência sob medida.",
  VITRINE_CATEGORY: (entity) =>
    `Olá! Gostaria de conhecer as experiências da categoria ${entity || ""} da WallTravel.`.trim(),
  VITRINE_PRODUCT: (entity) =>
    `Olá! Gostaria de planejar a experiência ${entity || ""} com a WallTravel.`.trim(),
  GROUP: (entity) =>
    `Olá! Quero saber mais sobre ${entity || "esta viagem em grupo"} da WallTravel.`,
  GROUP_COMING_SOON: (entity) =>
    `Olá! Quero ser avisado quando ${entity || "este grupo"} da WallTravel abrir.`,
  HONEYMOON: "Olá! Gostaria de planejar uma viagem de lua de mel com a WallTravel.",
  SERVICE: (entity) =>
    `Olá! Gostaria de saber mais sobre ${entity || "os serviços"} com a WallTravel.`,
  ABOUT: "Olá! Gostaria de saber mais sobre a WallTravel.",
  GENERIC: "Olá! Gostaria de falar com um especialista WallTravel.",
};

function templates() {
  const override =
    typeof window !== "undefined" && window.__WT_WA_TEMPLATES__
      ? window.__WT_WA_TEMPLATES__
      : null;
  return { ...DEFAULT_TEMPLATES, ...(override || {}) };
}

function resolveMessage({ pageType, entity, customMessage, placement }) {
  if (customMessage && String(customMessage).trim()) {
    return String(customMessage).trim();
  }
  const t = templates();
  const type = String(pageType || "GENERIC").toUpperCase();
  const name = entity?.name || entity?.title || entity?.slug || "";

  switch (type) {
    case "HOME":
      if (placement === "slide" || placement === "hero-slide") {
        const fn = t.HOME_SLIDE;
        return typeof fn === "function" ? fn(name) : t.HOME;
      }
      return t.HOME;
    case "VITRINE":
      if (placement === "category") {
        const fn = t.VITRINE_CATEGORY;
        return typeof fn === "function" ? fn(name) : t.VITRINE;
      }
      if (placement === "product" || placement === "package") {
        const fn = t.VITRINE_PRODUCT;
        return typeof fn === "function" ? fn(name) : t.VITRINE;
      }
      return t.VITRINE;
    case "GROUP":
    case "GROUPS": {
      const comingSoon = Boolean(entity?.comingSoon);
      const fn = comingSoon ? t.GROUP_COMING_SOON : t.GROUP;
      return typeof fn === "function" ? fn(name || entity?.name) : t.GENERIC;
    }
    case "COMING_SOON": {
      const fn = t.GROUP_COMING_SOON;
      return typeof fn === "function" ? fn(name) : t.GENERIC;
    }
    case "HONEYMOON":
      return t.HONEYMOON;
    case "SERVICE": {
      const fn = t.SERVICE;
      return typeof fn === "function" ? fn(name) : t.GENERIC;
    }
    case "ABOUT":
      return t.ABOUT;
    default:
      return t.GENERIC;
  }
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
 * @returns {{ href: string, message: string, number: string, analytics: object }}
 */
export function buildWhatsAppCTA(opts = {}) {
  const number = String(opts.number || getWhatsappNumber()).replace(/\D/g, "");
  const entity =
    typeof opts.entity === "string" ? { name: opts.entity } : opts.entity || null;
  const path =
    opts.path ||
    (typeof window !== "undefined" ? window.location?.pathname || "/" : "/");
  const message = resolveMessage({
    pageType: opts.pageType,
    entity,
    customMessage: opts.customMessage,
    placement: opts.placement,
  });
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  return {
    href,
    message,
    number,
    analytics: {
      source: opts.source || "storefront",
      pageType: opts.pageType || "GENERIC",
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
      entity: el.getAttribute("data-wa-entity")
        ? { name: el.getAttribute("data-wa-entity") }
        : null,
    });
    el.setAttribute("href", cta.href);
    el.setAttribute("data-storefront-cta", el.getAttribute("data-storefront-cta") || "whatsapp");
    el.setAttribute("data-wa-analytics", JSON.stringify(cta.analytics));
  });
}
