/**
 * Phase 14 analytics client — first-party batch + optional beacon.
 * GA4 is server-side only (platform adapter). Consent-aware.
 */

import { getPlatformApiBase } from "./platform-api.js";

const EVENT_NAMES = new Set([
  "page_view",
  "storefront_view",
  "category_view",
  "product_view",
  "group_view",
  "filter_apply",
  "search",
  "itinerary_interact",
  "gallery_interact",
  "journey_interact",
  "whatsapp_click",
  "specialist_cta",
  "form_start",
  "form_submit",
  // legacy aliases (accepted by platform)
  "vitrine_view",
  "category_view",
  "package_view",
  "viagem_view",
  "specialist_cta_click",
]);

const SESSION_KEY = "wt_analytics_session";
const CONSENT_KEY = "wt_analytics_consent";
const QUEUE_KEY = "wt_analytics_queue";

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `e_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionKey() {
  try {
    let key = sessionStorage.getItem(SESSION_KEY);
    if (!key) {
      key = `s_${uuid()}`;
      sessionStorage.setItem(SESSION_KEY, key);
    }
    return key;
  } catch {
    return `s_${uuid()}`;
  }
}

export function getAnalyticsConsent() {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "denied") return false;
    if (v === "granted") return true;
  } catch {
    /* ignore */
  }
  // Default: allow first-party analytics (LGPD: document + allow opt-out)
  return true;
}

export function setAnalyticsConsent(granted) {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
  } catch {
    /* ignore */
  }
}

function readUtm() {
  try {
    const params = new URLSearchParams(window.location.search);
    const pick = (k) => params.get(k);
    const utm = {
      utm_source: pick("utm_source"),
      utm_medium: pick("utm_medium"),
      utm_campaign: pick("utm_campaign"),
      utm_term: pick("utm_term"),
      utm_content: pick("utm_content"),
    };
    const has = Object.values(utm).some(Boolean);
    if (has) {
      sessionStorage.setItem("wt_utm_last", JSON.stringify(utm));
      if (!sessionStorage.getItem("wt_utm_first")) {
        sessionStorage.setItem("wt_utm_first", JSON.stringify(utm));
      }
      return utm;
    }
    const last = sessionStorage.getItem("wt_utm_last");
    return last ? JSON.parse(last) : {};
  } catch {
    return {};
  }
}

function enqueue(event) {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    const q = raw ? JSON.parse(raw) : [];
    q.push(event);
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-40)));
  } catch {
    /* ignore */
  }
}

function drainQueue() {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    sessionStorage.removeItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function flush(events) {
  const base = getPlatformApiBase();
  if (!base || !events.length) return;

  const body = JSON.stringify({ events });
  const url = `${base}/api/public/analytics/events`;

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(url, blob);
      if (ok) return;
    }
  } catch {
    /* fall through */
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    events.forEach(enqueue);
  }
}

let flushTimer = null;
const pending = [];

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    const batch = pending.splice(0, 25);
    const queued = drainQueue();
    flush([...queued, ...batch]);
  }, 800);
}

/**
 * @param {string} name
 * @param {Record<string, unknown>} [payload]
 */
export function trackStorefrontEvent(name, payload = {}) {
  if (!EVENT_NAMES.has(name)) return;
  if (!getAnalyticsConsent()) return;

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

  const path = window.location.pathname;
  const event = {
    event_id: uuid(),
    session_key: getSessionKey(),
    name,
    occurred_at: new Date().toISOString(),
    path,
    referrer: document.referrer || null,
    title: document.title || null,
    product_slug: payload.productSlug || payload.slug || null,
    category_slug: payload.categorySlug || payload.category || null,
    group_slug: payload.groupSlug || (path.startsWith("/grupos/") ? path.split("/")[2] : null),
    search_query: payload.q || payload.search || null,
    filter_key: payload.filterKey || null,
    filter_value: payload.filterValue || null,
    utm: readUtm(),
    props: {
      ...payload,
      // strip likely PII if form fields leaked
    },
    consent_analytics: getAnalyticsConsent(),
  };

  // Remove PII-ish keys from props client-side too
  if (event.props && typeof event.props === "object") {
    for (const k of Object.keys(event.props)) {
      if (/email|phone|whatsapp|nome|name|mensagem|message/i.test(k)) {
        delete event.props[k];
      }
    }
  }

  pending.push(event);
  if (pending.length >= 10) {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = null;
    const batch = pending.splice(0, 25);
    flush(batch);
  } else {
    scheduleFlush();
  }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", detail);
  }
}

export function bindWhatsappTracking(root = document) {
  root.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest?.("a[href*='wa.me'], a[href*='whatsapp']");
      if (!a) return;
      trackStorefrontEvent("whatsapp_click", {
        path: window.location.pathname,
      });
    },
    true,
  );
}

export function bindAnalyticsPageHooks(root = document) {
  trackStorefrontEvent("page_view", { path: window.location.pathname });

  root.addEventListener(
    "focusin",
    (e) => {
      const form = e.target.closest?.("form.group-lead-form, form[data-analytics-form]");
      if (!form || form.dataset.analyticsStarted) return;
      form.dataset.analyticsStarted = "1";
      trackStorefrontEvent("form_start", {
        groupSlug: form.getAttribute("data-group-slug"),
      });
    },
    true,
  );

  root.addEventListener(
    "submit",
    (e) => {
      const form = e.target.closest?.("form.group-lead-form, form[data-analytics-form]");
      if (!form) return;
      trackStorefrontEvent("form_submit", {
        groupSlug: form.getAttribute("data-group-slug"),
      });
    },
    true,
  );

  window.addEventListener("pagehide", () => {
    if (pending.length) {
      const batch = pending.splice(0, 25);
      flush(batch);
    }
  });
}

export function trackGroupInteraction(kind, payload = {}) {
  if (kind === "itinerary") {
    trackStorefrontEvent("itinerary_interact", payload);
  } else if (kind === "gallery") {
    trackStorefrontEvent("gallery_interact", payload);
  } else if (kind === "journey") {
    trackStorefrontEvent("journey_interact", payload);
  }
}
