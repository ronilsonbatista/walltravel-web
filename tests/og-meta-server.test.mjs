import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyInstitucionalDocument,
  buildOgHtml,
  defaultMeta,
  isSocialCrawler,
  parseOgRoute,
  resolveOgMeta,
  resolveSiteOrigin,
  toAbsoluteImageUrl,
  CANONICAL_ORIGIN,
  DEFAULT_OG_IMAGE_PATH,
} from "../data/og-meta-server.js";
import handler, {
  resetInstitucionalDocumentCache,
} from "../api/institucional-document.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const AURORA = `${CANONICAL_ORIGIN}/images/vitrine/noruega-aurora.jpg`;

describe("isSocialCrawler", () => {
  it("detects WhatsApp and Facebook", () => {
    assert.equal(isSocialCrawler("WhatsApp/2.23.20.0"), true);
    assert.equal(
      isSocialCrawler("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"),
      true,
    );
  });

  it("ignores browsers and Googlebot", () => {
    assert.equal(
      isSocialCrawler(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120",
      ),
      false,
    );
    assert.equal(isSocialCrawler("Googlebot/2.1"), false);
  });
});

describe("parseOgRoute", () => {
  it("parses product, group and vitrine slugs", () => {
    assert.deepEqual(parseOgRoute("https://www.walltravel.com.br/viagens/turquia-completa"), {
      kind: "product",
      slug: "turquia-completa",
      pathname: "/viagens/turquia-completa",
    });
    assert.deepEqual(parseOgRoute("https://www.walltravel.com.br/grupos/grecia/"), {
      kind: "group",
      slug: "grecia",
      pathname: "/grupos/grecia",
    });
    assert.deepEqual(parseOgRoute("https://www.walltravel.com.br/vitrine/maldivas"), {
      kind: "vitrine-slug",
      slug: "maldivas",
      pathname: "/vitrine/maldivas",
    });
    assert.equal(parseOgRoute("https://www.walltravel.com.br/").kind, "default");
    assert.equal(parseOgRoute("https://www.walltravel.com.br/como-funciona").kind, "default");
  });
});

describe("toAbsoluteImageUrl / resolveSiteOrigin", () => {
  it("keeps HTTPS CDN covers and absolutizes relative paths", () => {
    const cover =
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=80";
    assert.equal(toAbsoluteImageUrl(cover, CANONICAL_ORIGIN), cover);
    assert.equal(
      toAbsoluteImageUrl("/images/vitrine/noronha.jpg", CANONICAL_ORIGIN),
      `${CANONICAL_ORIGIN}${DEFAULT_OG_IMAGE_PATH}`,
    );
  });

  it("uses www for production hosts and preview origin otherwise", () => {
    assert.equal(
      resolveSiteOrigin("https://walltravel.com.br/viagens/x", {
        host: "walltravel.com.br",
      }),
      CANONICAL_ORIGIN,
    );
    assert.equal(
      resolveSiteOrigin("https://walltravel-web-abc.vercel.app/viagens/x", {
        host: "walltravel-web-abc.vercel.app",
        "x-forwarded-proto": "https",
      }),
      "https://walltravel-web-abc.vercel.app",
    );
  });
});

describe("buildOgHtml", () => {
  it("emits absolute og:image and og:url", () => {
    const html = buildOgHtml({
      title: "Turquia Completa | WallTravel",
      description: "Jornada pela Turquia",
      imageUrl:
        "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=80",
      pageUrl: "https://www.walltravel.com.br/viagens/turquia-completa",
    });
    assert.match(html, /property="og:image" content="https:\/\/images\.unsplash\.com/);
    assert.match(
      html,
      /property="og:url" content="https:\/\/www\.walltravel\.com\.br\/viagens\/turquia-completa"/,
    );
    assert.match(html, /name="twitter:image" content="https:\/\/images\.unsplash\.com/);
  });
});

describe("resolveOgMeta", () => {
  it("uses product cover for /viagens/:slug", async () => {
    const meta = await resolveOgMeta({
      requestUrl: "https://www.walltravel.com.br/viagens/turquia-completa",
      headers: { host: "www.walltravel.com.br" },
      apiBase: "https://api.example",
      fetchJson: async (_base, path) => {
        assert.equal(path, "/api/public/storefront/turquia-completa");
        return {
          ok: true,
          item: {
            slug: "turquia-completa",
            name: "Turquia Completa",
            shortDescription: "Istambul e Capadócia",
            coverImageUrl:
              "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=80",
          },
        };
      },
    });
    assert.match(meta.title, /Turquia Completa/);
    assert.equal(
      meta.imageUrl,
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=80",
    );
    assert.equal(meta.pageUrl, "https://www.walltravel.com.br/viagens/turquia-completa");
  });

  it("uses Greece presentation cover for /grupos/grecia", async () => {
    const meta = await resolveOgMeta({
      requestUrl: "https://www.walltravel.com.br/grupos/grecia",
      headers: { host: "www.walltravel.com.br" },
      apiBase: "https://api.example",
      fetchJson: async () => ({
        ok: true,
        item: {
          slug: "grecia",
          name: "Grécia 2027",
          shortDescription: "Atenas e ilhas",
          coverImageUrl: "https://cdn.example/hero-santorini.webp",
        },
      }),
    });
    assert.equal(
      meta.imageUrl,
      "https://www.walltravel.com.br/images/groups/grecia-santorini.webp",
    );
  });

  it("resolves product under /vitrine/:productSlug", async () => {
    const meta = await resolveOgMeta({
      requestUrl: "https://www.walltravel.com.br/vitrine/turquia-completa",
      headers: { host: "www.walltravel.com.br" },
      apiBase: "https://api.example",
      fetchJson: async (_base, path) => {
        if (path.includes("/storefront/turquia-completa")) {
          return {
            ok: true,
            item: {
              slug: "turquia-completa",
              name: "Turquia Completa",
              coverImageUrl: "https://cdn.example/turkey.jpg",
            },
          };
        }
        return { ok: true, items: [] };
      },
    });
    assert.equal(meta.imageUrl, "https://cdn.example/turkey.jpg");
  });

  it("falls back to Noronha default", () => {
    const meta = defaultMeta(CANONICAL_ORIGIN, "/");
    assert.equal(meta.imageUrl, `${CANONICAL_ORIGIN}${DEFAULT_OG_IMAGE_PATH}`);
  });

  it("uses the Norway aurora cabin for /institucional only", async () => {
    const meta = await resolveOgMeta({
      requestUrl: "https://www.walltravel.com.br/institucional/",
      headers: { host: "www.walltravel.com.br" },
      apiBase: "https://api.example",
      fetchJson: async () => {
        throw new Error("institucional must not call the catalog");
      },
    });
    assert.equal(meta.title, "Sobre nós | WallTravel");
    assert.equal(
      meta.description,
      "Escolher bem muda tudo. Viagens sob medida, com pessoas que cuidam de cada detalhe.",
    );
    assert.equal(meta.imageUrl, AURORA);
    assert.equal(meta.pageUrl, "https://www.walltravel.com.br/institucional");
    assert.doesNotMatch(meta.imageUrl, /noronha/);

    const home = await resolveOgMeta({
      requestUrl: "https://www.walltravel.com.br/",
      headers: { host: "www.walltravel.com.br" },
      apiBase: "https://api.example",
      fetchJson: async () => {
        throw new Error("home must not call the catalog");
      },
    });
    assert.equal(home.imageUrl, `${CANONICAL_ORIGIN}${DEFAULT_OG_IMAGE_PATH}`);
  });
});

describe("institucional document", () => {
  const spa = readFileSync(join(root, "index.html"), "utf8");

  it("rewrites share tags and leaves the home Noronha slide", () => {
    const html = applyInstitucionalDocument(spa, CANONICAL_ORIGIN);
    assert.match(html, new RegExp(`property="og:image" content="${AURORA}"`));
    assert.match(html, new RegExp(`name="twitter:image" content="${AURORA}"`));
    assert.match(html, /property="og:title" content="Sobre nós \| WallTravel"/);
    assert.match(html, /property="og:url" content="https:\/\/www\.walltravel\.com\.br\/institucional"/);
    assert.match(html, /<title>Sobre nós \| WallTravel<\/title>/);
    assert.equal((html.match(/noronha\.jpg/g) || []).length, 1);
    assert.match(html, /data-src="\/images\/vitrine\/noronha\.jpg"/);
    assert.match(html, /id="institucional-view"/);
    assert.match(html, /noruega-aurora\.jpg/);
  });

  it("is served for /institucional ahead of the SPA catch-all", () => {
    const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
    const rewrites = vercel.rewrites || [];
    const institucional = rewrites.find((r) => r.source === "/institucional");
    const catchAll = rewrites.find((r) => r.destination === "/");
    assert.equal(institucional?.destination, "/api/institucional-document");
    assert.ok(rewrites.indexOf(institucional) < rewrites.indexOf(catchAll));
    const app = readFileSync(join(root, "index.js"), "utf8");
    assert.match(app, /INSTITUCIONAL_OG_IMAGE_PATH/);
  });

  it("returns the patched document from the edge handler", async () => {
    resetInstitucionalDocumentCache();
    const original = globalThis.fetch;
    globalThis.fetch = async (url) => {
      assert.equal(String(url), "https://www.walltravel.com.br/");
      return new Response(spa, {
        status: 200,
        headers: { "content-type": "text/html" },
      });
    };
    try {
      const res = await handler(
        new Request("https://www.walltravel.com.br/institucional", {
          headers: { host: "www.walltravel.com.br" },
        }),
      );
      assert.equal(res.status, 200);
      assert.equal(res.headers.get("x-walltravel-og"), "institucional");
      const body = await res.text();
      assert.match(body, new RegExp(`property="og:image" content="${AURORA}"`));
      assert.doesNotMatch(body, /property="og:image" content="[^"]*noronha/);
    } finally {
      globalThis.fetch = original;
      resetInstitucionalDocumentCache();
    }
  });
});
