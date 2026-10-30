import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const sitemap = readFileSync(join(root, "api/sitemap.js"), "utf8");
const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));

function sliceView(id) {
  const start = html.indexOf(`id="${id}"`);
  assert.ok(start > 0, `missing #${id}`);
  const end = html.indexOf("<!-- ===", start + 10);
  assert.ok(end > start, `missing end marker after #${id}`);
  return html.slice(start, end);
}

describe("/institucional editorial page", () => {
  const page = sliceView("institucional-view");

  it("is the short editorial layout on the main route", () => {
    assert.equal((html.match(/id="institucional-view"/g) || []).length, 1);
    assert.doesNotMatch(html, /id="institucional-2-view"/);
    assert.match(page, /institucional-mast/);
    assert.match(page, /noruega-aurora/);
    assert.doesNotMatch(page, /i2-collage/);
    assert.match(page, /Escolher bem muda tudo/);
    assert.match(page, /Viagens sob medida, com pessoas que cuidam de cada detalhe/);
    assert.match(page, /Pessoas por trás de cada viagem/);
    assert.match(page, /Seu jeito de viajar\. Nosso cuidado/);
    assert.match(page, /Histórias que ficam/);
    assert.match(page, /data-i2-reviews/);
    assert.match(page, /Quem viajou com a gente/);
    assert.doesNotMatch(page, /Se quiser, a gente conversa/);
    assert.doesNotMatch(page, /Sem pressa/);
    assert.doesNotMatch(page, /Falar com a gente/);
    assert.doesNotMatch(page, /i2-close/);
    assert.doesNotMatch(page, /Vamos conversar sobre viajar/);
    assert.doesNotMatch(page, /Entre em contato/);
    assert.match(page, /<h3>Escuta<\/h3>/);
    assert.match(page, /<h3>Curadoria<\/h3>/);
    assert.match(page, /<h3>Acompanhamento<\/h3>/);
    assert.doesNotMatch(html, /href="\/institucional-2"/);
    assert.match(html, /class="sobre-nos-arrow" href="\/institucional"/);
    assert.doesNotMatch(html, /i2-nav-item/);
  });

  it("uses approved names, quotes, and secondary team stats", () => {
    assert.match(page, /Milena Medeiros/);
    assert.match(page, /Itália e França/);
    assert.match(page, /Daniela Costa/);
    assert.match(page, /Maldivas e Noruega/);
    assert.match(page, /Depoimento resumido e adaptado/);
    assert.match(page, /anos de experiência da equipe/);
    assert.match(page, /viajantes atendidos/);
    assert.equal((page.match(/Sócio/g) || []).length, 3);
    assert.doesNotMatch(page, /—/);
    const withoutReviews = page.replace(/<blockquote class="i2-review-slide[\s\S]*?<\/blockquote>/g, "");
    assert.doesNotMatch(withoutReviews, /pacote/i);
    assert.doesNotMatch(page, /Reclame Aqui/);
    assert.doesNotMatch(page, /Prova social/);
    assert.doesNotMatch(page, /\+35/);
    assert.doesNotMatch(withoutReviews, /24h/);
    assert.doesNotMatch(page, /5,0|5\.0/);
    assert.doesNotMatch(page, /lucas biasotto/i);
  });

  it("closes with the approved quotes and the existing Google reviews link", () => {
    const css = readFileSync(join(root, "index.css"), "utf8");
    const social = readFileSync(join(root, "data/institucional-social.js"), "utf8");
    const google = social.match(/INSTITUCIONAL_GOOGLE_REVIEWS_URL\s*=\s*\n?\s*"([^"]+)"/);
    assert.ok(google, "missing Google reviews URL");
    assert.match(page, /data-i2-reviews/);
    assert.equal((page.match(/Milena Medeiros/g) || []).length, 2);
    assert.equal((page.match(/Daniela Costa/g) || []).length, 2);
    const slides = [...page.matchAll(/<blockquote class="i2-review-slide[^"]*">([\s\S]*?)<\/blockquote>/g)].map((m) => m[1]);
    assert.equal(slides.length, 22);
    assert.match(slides[0], /Obrigada, Walace!/);
    assert.match(slides[0], /Christina/);
    assert.match(slides[10], /Milena Medeiros/);
    assert.match(slides[11], /Daniela Costa/);
    assert.match(slides[2], /acampamento da Larissa/);
    assert.match(page, /★★★★★/);
    assert.match(page, /aria-label="5 estrelas"/);
    assert.match(page, /data-institucional-social="google"/);
    assert.ok(page.includes(google[1].replaceAll("&", "&amp;")));
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
    assert.match(css, /\.i2-review-slide/);
  });

  it("redirects the comparison URL and stays out of the sitemap and the menu", () => {
    const redirect = (vercel.redirects || []).find((r) => r.source === "/institucional-2");
    assert.ok(redirect);
    assert.equal(redirect.destination, "/institucional");
    assert.equal(redirect.permanent, true);
    assert.doesNotMatch(sitemap, /institucional-2/);
    assert.doesNotMatch(sitemap, /institucional/);
    const nav = html.slice(html.indexOf('aria-label="Principal"'), html.indexOf("</nav>"));
    assert.match(nav, />Vitrine</);
    assert.match(nav, />Black</);
    assert.match(nav, />Expedições em grupo</);
    assert.match(nav, />Como funciona</);
    assert.doesNotMatch(nav, /Sobre nós|Viagem|Equipe|Cuidado|Histórias/);
  });
});
