import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  filterPublicItinerary,
  isDisplayableItinerary,
  isHospedagemItineraryDay,
  mapGroup,
  mapProduct,
} from "../data/platform-api.js";
import { renderExperienceDetailPage } from "../data/experience-render.js";
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

describe("roteiro on trip pages when the product has days", () => {
  const esc = (s) => String(s);
  const basePkg = {
    slug: "multi-day-demo",
    name: "Demo Multi",
    destination: "Atenas",
    duration: "5 dias",
    description: "Uma experiência completa.",
    included: ["Guia"],
    priceFrom: 1000,
  };
  const multiDayItinerary = [
    { day: 1, title: "Bem-vindos", description: "chegada", location: "Atenas" },
    { day: 2, title: "Acrópole", description: "passeio", location: "Atenas" },
    { day: 3, title: "Mykonos", description: "ilha", location: "Mykonos" },
  ];

  it("shows the group Sua jornada block for a displayable itinerary", () => {
    assert.equal(isDisplayableItinerary(multiDayItinerary), true);
    const html = renderExperienceDetailPage(
      { ...basePkg, itinerary: multiDayItinerary },
      { name: "Europa", slug: "europa" },
      esc,
      "5511999999999",
    );
    assert.match(html, /Sua jornada/);
    assert.match(html, /id="group-itinerary"/);
    assert.match(html, /Roteiro dia a dia/);
    assert.match(html, /data-itinerary-explorer/);
    assert.match(html, /Bem-vindos/);
    assert.match(html, /Acrópole/);
    assert.match(html, /Mykonos/);
    assert.match(html, /href="#group-itinerary">Roteiro</);
    assert.match(html, /Sobre a viagem/);
    assert.doesNotMatch(html, /pacote/i);
  });

  it("keeps the block off hotel-only and single-day products", () => {
    const hotelOnly = renderExperienceDetailPage(
      {
        ...basePkg,
        itinerary: [{ day: 1, title: "Hospedagem", description: "hotel" }],
      },
      { name: "Europa", slug: "europa" },
      esc,
      "5511999999999",
    );
    assert.doesNotMatch(hotelOnly, /Sua jornada/);
    assert.doesNotMatch(hotelOnly, /id="group-itinerary"/);

    const oneDay = renderExperienceDetailPage(
      {
        ...basePkg,
        itinerary: [{ day: 1, title: "Chegada", description: "tarde livre" }],
      },
      { name: "Europa", slug: "europa" },
      esc,
      "5511999999999",
    );
    assert.doesNotMatch(oneDay, /id="group-itinerary"/);
  });

  it("keeps a single paragraph when the description has no breaks", () => {
    const html = renderExperienceDetailPage(
      {
        ...basePkg,
        itinerary: [
          { day: 1, title: "Chegada", description: "Um parágrafo só, sem quebra." },
          { day: 2, title: "Cidade", description: "Outro parágrafo contínuo." },
        ],
      },
      { name: "Nacionais", slug: "nacionais" },
      esc,
      "5511999999999",
    );
    assert.equal((html.match(/group-itinerary-moment-lead/g) || []).length, 0);
    assert.match(html, /Um parágrafo só, sem quebra\./);
  });

  it("splits blank lines into moments and emphasizes the time and place", () => {
    const html = renderItineraryAccordion(
      {
        itinerary: [
          { day: 1, title: "Abertura", description: "Dia livre." },
          {
            day: 3,
            title: "Manaus para a floresta",
            description: [
              "26/06. De Manaus ao lago, no mesmo dia.",
              "07h00 · Busca em Manaus\nA busca começa na região da cidade.",
              "08h00 · Porto do CEASA\nSaída para o embarque.",
              "Pernoite em chalé privativo na Pousada Juma Lake.",
            ].join("\n\n"),
          },
        ],
      },
      esc,
    );
    assert.match(html, /group-itinerary-moment-open/);
    assert.match(html, /26\/06\. De Manaus ao lago, no mesmo dia\./);
    assert.match(html, /<p class="group-itinerary-moment-lead">07h00 · Busca em Manaus<\/p>/);
    assert.match(html, /<p class="group-itinerary-moment-lead">08h00 · Porto do CEASA<\/p>/);
    assert.match(html, /A busca começa na região da cidade\./);
    assert.match(html, /<p class="group-itinerary-overnight">Pernoite em chalé privativo na Pousada Juma Lake\.<\/p>/);
    assert.doesNotMatch(html, /07h00 · Busca em Manaus A busca/);
  });

  it("renders product days with title and description, the shape travel_product_days stores", () => {
    const html = renderExperienceDetailPage(
      {
        ...basePkg,
        slug: "manaus-amazonia-com-aereo",
        name: "Manaus + Experiência Amazônia · com aéreo",
        itinerary: [
          { day: 1, title: "São Paulo para Manaus", description: "24/06. Saída às 07h50." },
          { day: 3, title: "Manaus para a floresta", description: "26/06. Encontro das Águas." },
        ],
      },
      { name: "Nacionais", slug: "nacionais" },
      esc,
      "5511999999999",
    );
    assert.match(html, /São Paulo para Manaus/);
    assert.match(html, /Manaus para a floresta/);
    assert.match(html, /24\/06\. Saída às 07h50\./);
    assert.match(html, /01 \/ 02/);
    assert.doesNotMatch(html, /pacote/i);
  });
});
