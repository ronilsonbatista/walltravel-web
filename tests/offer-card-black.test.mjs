import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getBlackCatalogPackages,
  visibleBlackCountries,
} from "../data/black-wall-travel.js";
import {
  isBlackExclusivePackage,
  mapProduct,
  publicPackageTags,
} from "../data/platform-api.js";

describe("offer card on /black", () => {
  it("keeps catalog:black off public chips and on the Black catalog", () => {
    assert.deepEqual(
      publicPackageTags(["praia", "bf:nacional", "catalog:black", "legacy:abc"]),
      ["praia"],
    );
    const foz = mapProduct({
      slug: "foz-do-iguacu",
      name: "Foz do Iguaçu",
      destinationLabel: "Foz do Iguaçu",
      durationLabel: "5 noites",
      priceFrom: "3258.00",
      currency: "BRL",
      tags: ["bf:nacional", "catalog:black"],
    });
    assert.deepEqual(foz.tags, []);
    assert.equal(isBlackExclusivePackage(foz), true);
    const catalog = getBlackCatalogPackages([foz], { seed: false });
    assert.equal(catalog.length, 1);
    assert.equal(catalog[0].black.segment, "nacional");
    assert.equal(catalog[0].black.countrySlug, "brasil");
  });

  it("puts an international card on a season and a country chip", () => {
    const barbados = mapProduct({
      slug: "barbados",
      name: "Barbados",
      destinationLabel: "Barbados",
      priceFrom: "10191.00",
      tags: ["bf:verao", "bf:pais:barbados", "catalog:black"],
    });
    const pkgs = getBlackCatalogPackages([barbados], { seed: false });
    assert.equal(pkgs[0].black.segment, "verao");
    assert.equal(pkgs[0].black.countrySlug, "barbados");
    assert.equal(visibleBlackCountries(pkgs, "nacional").length, 0);
    assert.deepEqual(visibleBlackCountries(pkgs, "verao").map((c) => c.id), ["barbados"]);
  });
});
