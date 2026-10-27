import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("sitemap wiring", () => {
  it("rewrites /sitemap.xml to the edge API (not SPA catch-all)", () => {
    const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
    const rewrite = (vercel.rewrites || []).find((r) => r.source === "/sitemap.xml");
    assert.ok(rewrite, "missing /sitemap.xml rewrite");
    assert.equal(rewrite.destination, "/api/sitemap");
  });

  it("301s legacy japao-essencial slug to São Paulo variant", () => {
    const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
    const redirect = (vercel.redirects || []).find(
      (r) => r.source === "/viagens/japao-essencial",
    );
    assert.ok(redirect);
    assert.equal(redirect.destination, "/viagens/japao-essencial-sao-paulo");
    assert.equal(redirect.permanent, true);
  });

  it("robots.txt advertises the sitemap", () => {
    const robots = readFileSync(join(root, "public/robots.txt"), "utf8");
    assert.match(robots, /Sitemap:\s*https:\/\/www\.walltravel\.com\.br\/sitemap\.xml/);
  });
});
