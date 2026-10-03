import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatFixedDateRange, hasFixedDates } from "../data/fixed-dates.js";
import { mapProduct } from "../data/platform-api.js";

describe("fixed dates helpers", () => {
  it("formats ISO range in pt-BR", () => {
    assert.equal(
      formatFixedDateRange("2027-03-02", "2027-03-16"),
      "02/03/2027 a 16/03/2027",
    );
  });

  it("detects fixed-date planejamentos", () => {
    assert.equal(hasFixedDates({ dateMode: "FIXED", fixedStartDate: "2027-03-02" }), true);
    assert.equal(hasFixedDates({ dateMode: "FLEXIBLE", fixedStartDate: null }), false);
  });
});

describe("mapProduct dates and origins", () => {
  it("keeps flexible defaults when API omits new fields", () => {
    const pkg = mapProduct({
      slug: "italia-classica",
      name: "Itália Clássica",
      priceFrom: "11053.00",
      tags: [],
    });
    assert.equal(pkg.dateMode, "FLEXIBLE");
    assert.equal(pkg.hasFixedDates, false);
    assert.equal(pkg.departureScope, "ALL_BRAZIL");
    assert.deepEqual(pkg.originPrices, []);
  });

  it("maps SP vs RJ origin prices", () => {
    const pkg = mapProduct({
      slug: "japao-essencial",
      name: "Japão Essencial: Tóquio, Kyoto e Osaka",
      priceFrom: "18015.00",
      dateMode: "FIXED",
      hasFixedDates: true,
      fixedStartDate: "2027-03-02",
      fixedEndDate: "2027-03-16",
      departureScope: "ORIGINS",
      departureOrigins: ["SP", "RJ"],
      originPrices: [
        { uf: "SP", label: "São Paulo", priceFrom: "18015.00", paymentNote: "PIX" },
        { uf: "RJ", label: "Rio de Janeiro", priceFrom: "19021.00", paymentNote: "PIX" },
      ],
      tags: ["Japão"],
    });
    assert.equal(pkg.hasFixedDates, true);
    assert.equal(pkg.originPrices[0].uf, "SP");
    assert.equal(pkg.originPrices[0].priceFrom, 18015);
    assert.equal(pkg.originPrices[1].uf, "RJ");
  });
});
