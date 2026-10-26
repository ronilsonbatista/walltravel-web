import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterPublicItinerary,
  isDisplayableItinerary,
  isHospedagemItineraryDay,
  mapGroup,
  mapProduct,
} from "../data/platform-api.js";
import { renderItineraryAccordion } from "../data/group-render.js";

describe("hospedagem itinerary filter", () => {
  it("detects title Hospedagem (case-insensitive)", () => {
    assert.equal(isHospedagemItineraryDay({ day: 1, title: "Hospedagem" }), true);
    assert.equal(isHospedagemItineraryDay({ day: 1, title: " hospedagem " }), true);
    assert.equal(isHospedagemItineraryDay({ day: 1, title: "HOSPEDAGEM" }), true);
  });

  it("detects type/kind lodging aliases", () => {
    assert.equal(
      isHospedagemItineraryDay({ day: 1, title: "Check-in", type: "hospedagem" }),
      true,
    );
    assert.equal(
      isHospedagemItineraryDay({ day: 1, title: "Hotel", kind: "lodging" }),
      true,
    );
  });

  it("does not strip real journey days or partial title matches", () => {
    assert.equal(
      isHospedagemItineraryDay({ day: 2, title: "Voos" }),
      false,
    );
    assert.equal(
      isHospedagemItineraryDay({
        day: 3,
        title: "Bem-vindos - check-in na hospedagem",
      }),
      false,
    );
  });

  it("filters public itinerary lists", () => {
    const days = filterPublicItinerary([
      { day: 1, title: "Hospedagem", description: "Pousada…" },
      { day: 2, title: "Voos", description: "Iberia…" },
    ]);
    assert.equal(days.length, 1);
    assert.equal(days[0].title, "Voos");
  });

  it("mapProduct drops hospedagem-only itinerary (Bonito case)", () => {
    const pkg = mapProduct({
      slug: "bonito",
      name: "Bonito",
      itinerary: [
        {
          day: 1,
          title: "Hospedagem",
          description:
            "hotel Pousada Rio Bonito 5 noites com café da manhã incluso",
        },
      ],
    });
    assert.deepEqual(pkg.itinerary, []);
  });

  it("mapProduct keeps non-hospedagem days", () => {
    const pkg = mapProduct({
      slug: "grecia-atenas-santorini",
      name: "Grécia",
      itinerary: [
        { day: 1, title: "Hospedagem", description: "hotéis" },
        { day: 2, title: "Voos", description: "ida e volta" },
      ],
    });
    assert.equal(pkg.itinerary.length, 1);
    assert.equal(pkg.itinerary[0].title, "Voos");
  });

  it("mapGroup drops hospedagem days", () => {
    const group = mapGroup({
      slug: "demo",
      name: "Demo",
      itinerary: [
        { day: 1, title: "Hospedagem", description: "hotel" },
        { day: 2, title: "Cidade", location: "Bonito", description: "passeio" },
      ],
    });
    assert.equal(group.itinerary.length, 1);
    assert.equal(group.itinerary[0].title, "Cidade");
  });

  it("renderItineraryAccordion hides hospedagem even if unmapped", () => {
    const html = renderItineraryAccordion(
      {
        itinerary: [
          {
            day: 1,
            title: "Hospedagem",
            description: "Pousada Rio Bonito",
            location: "Bonito • Mato Grosso do Sul",
          },
        ],
      },
      (s) => String(s),
    );
    assert.equal(html, "");
  });

  it("renderItineraryAccordion hides weak single activity day (Voos-only)", () => {
    const html = renderItineraryAccordion(
      {
        itinerary: [
          { day: 1, title: "Hospedagem", description: "hotel" },
          {
            day: 2,
            title: "Voos",
            description: "ida",
            location: "São Paulo",
          },
        ],
      },
      (s) => String(s),
    );
    assert.equal(html, "");
  });

  it("renderItineraryAccordion shows real multi-day roteiro", () => {
    const html = renderItineraryAccordion(
      {
        itinerary: [
          { day: 1, title: "Hospedagem", description: "hotel" },
          {
            day: 2,
            title: "Atenas e a Acrópole",
            description: "passeio",
            location: "Atenas",
          },
          {
            day: 3,
            title: "Ferry para Mykonos",
            description: "travessia",
            location: "Atenas → Mykonos",
          },
        ],
      },
      (s) => String(s),
    );
    assert.match(html, /Sua jornada/);
    assert.match(html, /Atenas e a Acrópole/);
    assert.match(html, /Ferry para Mykonos/);
    assert.doesNotMatch(html, />Hospedagem</);
  });
});

describe("isDisplayableItinerary (strong gate ≥2 activity days)", () => {
  it("rejects empty, hotel-only, and single non-hotel day", () => {
    assert.equal(isDisplayableItinerary([]), false);
    assert.equal(isDisplayableItinerary(null), false);
    assert.equal(
      isDisplayableItinerary([{ day: 1, title: "Hospedagem" }]),
      false,
    );
    assert.equal(
      isDisplayableItinerary([
        { day: 1, title: "Hospedagem" },
        { day: 2, title: "Voos" },
      ]),
      false,
    );
    assert.equal(
      isDisplayableItinerary([{ day: 1, title: "Voos" }]),
      false,
    );
  });

  it("accepts ≥2 non-hospedagem days", () => {
    assert.equal(
      isDisplayableItinerary([
        { day: 1, title: "Bem-vindos à Grécia" },
        { day: 2, title: "Atenas e a Acrópole" },
      ]),
      true,
    );
    assert.equal(
      isDisplayableItinerary([
        { day: 1, title: "Hospedagem" },
        { day: 2, title: "Dia em Atenas" },
        { day: 3, title: "Mykonos" },
      ]),
      true,
    );
  });
});
