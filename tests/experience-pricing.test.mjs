import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterExperienceInvestmentNotes } from "../data/experience-render.js";

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

  it("keeps PIX and parcelado lines for single-origin listings", () => {
    const notes = filterExperienceInvestmentNotes(
      [
        "PIX: R$ 18.015 por pessoa.",
        "Parcelado: 10x de R$ 2.008,58 (total R$ 20.086).",
      ],
      {
        dateLabel: "02/03/2027 a 16/03/2027",
        origins: [],
      },
    );
    assert.deepEqual(notes, [
      "PIX: R$ 18.015 por pessoa.",
      "Parcelado: 10x de R$ 2.008,58 (total R$ 20.086).",
    ]);
  });
});
