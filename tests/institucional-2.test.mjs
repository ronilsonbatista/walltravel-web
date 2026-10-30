import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const sitemap = readFileSync(join(root, "api/sitemap.js"), "utf8");

function sliceView(id) {
  const start = html.indexOf(`id="${id}"`);
  assert.ok(start > 0, `missing #${id}`);
  const end = html.indexOf("<!-- ===", start + 10);
  assert.ok(end > start, `missing end marker after #${id}`);
  return html.slice(start, end);
}

describe("/institucional-2 comparison page", () => {
  const page = sliceView("institucional-2-view");
  const current = sliceView("institucional-view");

  it("keeps /institucional and adds a separate route", () => {
    assert.match(current, /Escolher bem muda tudo/);
    assert.match(page, /Viagens sob medida, com pessoas que cuidam de cada detalhe/);
    assert.match(page, /Pessoas por trás de cada viagem/);
    assert.match(page, /Seu jeito de viajar\. Nosso cuidado/);
    assert.match(page, /Histórias que ficam/);
    assert.match(page, /Vamos conversar sobre viajar\?/);
    assert.match(page, /Entre em contato/);
    assert.match(html, /href="\/institucional-2"/);
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
    assert.doesNotMatch(page, /pacote/i);
    assert.doesNotMatch(page, /Reclame Aqui/);
    assert.doesNotMatch(page, /Prova social/);
    assert.doesNotMatch(page, /\+35/);
  });

  it("stays out of the sitemap", () => {
    assert.doesNotMatch(sitemap, /institucional-2/);
    assert.doesNotMatch(sitemap, /institucional/);
  });
});
