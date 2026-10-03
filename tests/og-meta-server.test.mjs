import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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
});
