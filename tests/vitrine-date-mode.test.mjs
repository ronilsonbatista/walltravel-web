import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  VITRINE_LEDE,
  filterCategoriesByDateMode,
  packageMatchesDateMode,
  parseVitrineDateMode,
  vitrineDateQuery,
} from "../data/vitrine-date-mode.js";

describe("vitrine date mode query", () => {
  it("parses datas=fixas and datas=flexiveis", () => {
    assert.equal(parseVitrineDateMode("?datas=fixas"), "FIXED");
    assert.equal(parseVitrineDateMode("datas=flexiveis"), "FLEXIBLE");
    assert.equal(parseVitrineDateMode(""), "");
  });

  it("builds query suffix for parent filter links", () => {
    assert.equal(vitrineDateQuery("FIXED"), "?datas=fixas");
    assert.equal(vitrineDateQuery("FLEXIBLE"), "?datas=flexiveis");
    assert.equal(vitrineDateQuery(""), "");
  });
});

describe("vitrine date mode filtering", () => {
  const packages = [
    {
      slug: "japao",
      categorySlug: "asia",
      dateMode: "FIXED",
      hasFixedDates: true,
      fixedStartDate: "2027-03-02",
    },
    {
      slug: "lencois",
      categorySlug: "nacionais",
      dateMode: "FLEXIBLE",
      hasFixedDates: false,
    },
    {
      slug: "paris",
      categorySlug: "europa",
      dateMode: "FLEXIBLE",
      hasFixedDates: false,
    },
  ];
  const categories = [
    { slug: "asia", name: "Ásia", packageCount: 1 },
    { slug: "nacionais", name: "Nacionais", packageCount: 1 },
    { slug: "europa", name: "Europa", packageCount: 1 },
  ];

  it("matches packages by date mode", () => {
    assert.equal(packageMatchesDateMode(packages[0], "FIXED"), true);
    assert.equal(packageMatchesDateMode(packages[0], "FLEXIBLE"), false);
    assert.equal(packageMatchesDateMode(packages[1], "FLEXIBLE"), true);
  });

  it("filters parent categories by date hierarchy", () => {
    const fixed = filterCategoriesByDateMode(categories, packages, "FIXED");
    assert.deepEqual(
      fixed.map((c) => c.slug),
      ["asia"],
    );
    assert.equal(fixed[0].packageCount, 1);

    const flexible = filterCategoriesByDateMode(categories, packages, "FLEXIBLE");
    assert.deepEqual(
      flexible.map((c) => c.slug).sort(),
      ["europa", "nacionais"],
    );
  });

  it("keeps the approved vitrine lede copy", () => {
    assert.match(VITRINE_LEDE, /prontas para viver/);
    assert.doesNotMatch(VITRINE_LEDE, /—/);
    assert.doesNotMatch(VITRINE_LEDE, /pacote/i);
    assert.doesNotMatch(VITRINE_LEDE, /alguém/i);
  });
});
