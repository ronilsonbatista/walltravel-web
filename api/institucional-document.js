/**
 * Serves the SPA document for /institucional with institutional share tags.
 * The catch-all rewrite would otherwise return the home shell, whose
 * og:image is the Noronha photo.
 */

import {
  applyInstitucionalDocument,
  resolveSiteOrigin,
} from "../data/og-meta-server.js";

export const config = { runtime: "edge" };

let spaHtmlPromise = null;

export function resetInstitucionalDocumentCache() {
  spaHtmlPromise = null;
}

async function loadSpaIndexHtml(requestUrl) {
  if (!spaHtmlPromise) {
    const indexUrl = new URL("/", requestUrl);
    spaHtmlPromise = fetch(indexUrl, {
      headers: {
        accept: "text/html",
        "x-wt-index-fetch": "1",
      },
      redirect: "follow",
      signal:
        typeof AbortSignal !== "undefined" && AbortSignal.timeout
          ? AbortSignal.timeout(4000)
          : undefined,
    })
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok || !text.includes('id="institucional-view"')) {
          throw new Error("spa_index_unavailable");
        }
        return text;
      })
      .catch((err) => {
        spaHtmlPromise = null;
        throw err;
      });
  }
  return spaHtmlPromise;
}

export default async function handler(request) {
  if (request.headers.get("x-wt-index-fetch") === "1") {
    return new Response("index fetch loop", { status: 508 });
  }

  const siteOrigin = resolveSiteOrigin(request.url, request.headers);
  try {
    const html = applyInstitucionalDocument(
      await loadSpaIndexHtml(request.url),
      siteOrigin,
    );
    return new Response(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=0, must-revalidate",
        "x-walltravel-og": "institucional",
      },
    });
  } catch {
    return new Response("Institucional page unavailable", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
