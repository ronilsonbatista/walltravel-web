import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  experienceInstallmentLine,
  filterExperienceInvestmentNotes,
  renderExperienceDetailPage,
  shortIncludedLines,
} from "../data/experience-render.js";

describe("filterExperienceInvestmentNotes", () => {
  const origins = [
    { uf: "SP", label: "São Paulo", priceFrom: 18015, paymentNote: "PIX" },
    { uf: "RJ", label: "Rio de Janeiro", priceFrom: 19021, paymentNote: "PIX" },
  ];

  it("drops fixed-date notes already shown above the list", () => {
    const notes = filterExperienceInvestmentNotes(
      [
        "Datas fixas: 02/03/2027 a 16/03/2027.",
        "Parcelado: 10x de R$ 2.008,58 (total R$ 20.086).",
      ],
      { dateLabel: "02/03/2027 a 16/03/2027", origins },
    );
    assert.deepEqual(notes, [
      "Parcelado: 10x de R$ 2.008,58 (total R$ 20.086).",
    ]);
  });

  it("drops city PIX lines that duplicate originPrices paymentNote", () => {
    const notes = filterExperienceInvestmentNotes(
      [
        "Datas fixas: 02/03/2027 a 16/03/2027.",
        "São Paulo: R$ 18.015 por pessoa no PIX.",
        "Rio de Janeiro: R$ 19.021 por pessoa no PIX.",
        "A vitrine mostra o valor a partir de São Paulo. Consulte a equipe para outras origens.",
        "Parcelado: 10x de R$ 2.008,58 (total R$ 20.086).",
      ],
      { dateLabel: "02/03/2027 a 16/03/2027", origins },
    );
    assert.deepEqual(notes, [
      "Parcelado: 10x de R$ 2.008,58 (total R$ 20.086).",
    ]);
  });

  it("keeps parcelado when single-origin PIX is only in originPrices", () => {
    const notes = filterExperienceInvestmentNotes(
      ["Parcelado: 10x de R$ 2.008,58 (total R$ 20.086)."],
      {
        dateLabel: "02/03/2027 a 16/03/2027",
        origins: [
          { uf: "SP", label: "São Paulo", priceFrom: 18015, paymentNote: "PIX" },
        ],
      },
    );
    assert.deepEqual(notes, [
      "Parcelado: 10x de R$ 2.008,58 (total R$ 20.086).",
    ]);
  });
});

describe("experience commercial summary", () => {
  it("keeps a short installment line and drops PDF, profit, and valor exibido", () => {
    assert.equal(
      experienceInstallmentLine([
        "Parcelado: 10x de R$ 2.008,58 (total R$ 20.086).",
      ]),
      "10x de R$ 2.008,58",
    );
    assert.equal(
      experienceInstallmentLine([
        "O valor exibido é o PIX à vista para o casal, com saída de São Paulo (GRU).",
        "No cartão: R$ 15.163,34 em até 10x sem juros (9 parcelas de R$ 1.516,33).",
        "PDF interno. Lucro não publicar.",
      ]),
      "Em até 10x sem juros",
    );
    assert.equal(
      experienceInstallmentLine([
        "R$ 26.790,00 por pessoa no PIX, em quarto duplo, saindo de São Paulo. No cartão, R$ 29.033,34 por pessoa em até 10x.",
      ]),
      "Em até 10x",
    );
    assert.equal(
      experienceInstallmentLine(["Datas combinadas com você.", "PDF da cotação."]),
      "",
    );
  });

  it("turns included items into three or four short lines", () => {
    assert.deepEqual(
      shortIncludedLines([
        "Passagem aérea internacional e voos internos",
        "15 noites com café da manhã: 4 em Istambul, 4 na Capadócia, 3 em Kuşadası e 4 em Bodrum",
        "Éfeso com almoço",
        "Trecho de Kuşadası a Bodrum",
        "Suporte WallTravel 24 horas",
      ]),
      ["Voos", "Café da manhã", "Istambul"],
    );
    assert.deepEqual(
      shortIncludedLines([
        "Hospedagem com café da manhã",
        "Traslados terrestres privativos",
        "Passeios de jipe 4x4 privativos",
        "Suporte WallTravel 24h durante a viagem",
      ]),
      ["Café da manhã", "Traslado", "Passeios de jipe 4x4 privativos"],
    );
    assert.deepEqual(
      shortIncludedLines([
        "Passagem aérea internacional conforme a cidade de saída (São Paulo)",
        "Hotéis 4 estrelas com café da manhã",
        "5 noites em Tóquio",
        "Deslocamento interno (trem)",
      ]),
      ["Voos", "Café da manhã", "Tóquio"],
    );
  });

  it("puts price and short lines under the title, before Sobre a viagem", () => {
    const esc = (s) => String(s);
    const html = renderExperienceDetailPage(
      {
        slug: "turquia-completa",
        name: "Turquia Completa",
        destination: "Turquia",
        duration: "15 noites",
        description: "A viagem passa por Istambul, Capadócia, Kuşadası e Bodrum.",
        priceFrom: 26790,
        included: [
          "Passagem aérea internacional e voos internos",
          "15 noites com café da manhã: 4 em Istambul",
          "Trecho de Kuşadası a Bodrum",
        ],
        importantNotes: [
          "O valor exibido é interno.",
          "PDF da operadora.",
          "Lucro não entra na página.",
          "No cartão, R$ 29.033,34 por pessoa em até 10x.",
        ],
        gallery: ["/images/a.jpg", "/images/b.jpg"],
      },
      { name: "Europa", slug: "europa" },
      esc,
      "5511999999999",
    );

    const titleAt = html.indexOf("<h1>Turquia Completa</h1>");
    const priceAt = html.indexOf('class="experience-price"');
    const aboutAt = html.indexOf('id="exp-about"');
    const offerAt = html.indexOf("data-experience-offer");
    const offerEnd = html.indexOf("experience-detail-main");
    const offer = html.slice(offerAt, offerEnd);

    assert.ok(titleAt >= 0 && priceAt > titleAt && aboutAt > priceAt);
    assert.match(offer, /Em até 10x/);
    assert.match(offer, /Voos/);
    assert.match(offer, /Café da manhã/);
    assert.match(offer, /Falar com especialista/);
    assert.doesNotMatch(offer, /valor exibido|PDF|Lucro/i);
    assert.match(html, /id="exp-investment"/);
    assert.match(html, /Sobre a viagem/);
    assert.match(html, /group-hero--gallery/);
    assert.match(html, /data-hero-dot=/);
    assert.match(html, /experience-sticky-cta/);
    assert.match(html, /Falar com especialista/);
  });
});
