import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveBlackMeta,
  filterBlackPackages,
  visibleBlackSegments,
  visibleBlackCountries,
  parseBlackFilters,
  blackFilterQuery,
  getBlackCatalogPackages,
  hasExplicitBlackTag,
  blackMastCopy,
  BWT_SEGMENTS,
  BWT_BRAND_TITLE,
} from "../data/black-wall-travel.js";

test("brand title is Black WallTravel", () => {
  assert.equal(BWT_BRAND_TITLE, "Black WallTravel");
  assert.equal(blackMastCopy().headline, "Black WallTravel");
  assert.equal(
    blackMastCopy().lede,
    "Curadoria com cuidado: destino certo, no tempo certo.",
  );
});

test("explicit bf tags enroll in catalog without seed", () => {
  const pkg = {
    slug: "noruega-aurora-boreal",
    categorySlug: "europa",
    tags: ["bf:inverno", "bf:pais:noruega"],
    name: "Noruega",
  };
  assert.equal(hasExplicitBlackTag(pkg), true);
  const catalog = getBlackCatalogPackages([pkg], { seed: false });
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].black.segment, "inverno");
  assert.equal(catalog[0].black.countrySlug, "noruega");
});

test("untagged products stay out of catalog when seed is off", () => {
  const pkgs = [
    { slug: "japao-essencial-sao-paulo", categorySlug: "asia", tags: ["Japão"], name: "JP" },
    { slug: "fernando-de-noronha", categorySlug: "nacionais", tags: ["nacionais"], name: "Noronha" },
  ];
  assert.equal(getBlackCatalogPackages(pkgs, { seed: false }).length, 0);
});

test("seed mode maps overlay catalog for homolog filter testing", () => {
  const pkgs = [
    { slug: "japao-essencial-sao-paulo", categorySlug: "asia", tags: [], name: "JP SP" },
    { slug: "punta-cana", categorySlug: "caribe", tags: [], name: "PC" },
  ];
  const catalog = getBlackCatalogPackages(pkgs, { seed: true });
  assert.equal(catalog.length, 2);
  assert.ok(catalog.some((p) => p.black.segment === "primavera" && p.black.countrySlug === "japao"));
  assert.ok(catalog.some((p) => p.black.segment === "verao"));
});

test("cms bf tags win without overlay", () => {
  const meta = resolveBlackMeta(
    {
      slug: "unknown-trip",
      categorySlug: "europa",
      tags: ["bf:inverno", "bf:pais:islandia"],
    },
    { allowOverlay: false },
  );
  assert.equal(meta.segment, "inverno");
  assert.equal(meta.countrySlug, "islandia");
});

test("without seed, overlay alone does not invent meta segment", () => {
  const meta = resolveBlackMeta(
    {
      slug: "japao-essencial-sao-paulo",
      categorySlug: "asia",
      tags: ["Japão"],
    },
    { allowOverlay: false },
  );
  assert.equal(meta.segment, null);
});

test("filterBlackPackages: nacional ignores country param", () => {
  const pkgs = getBlackCatalogPackages(
    [
      {
        slug: "fernando-de-noronha",
        categorySlug: "nacionais",
        tags: ["bf:nacional"],
        name: "Noronha",
      },
      {
        slug: "japao-essencial-sao-paulo",
        categorySlug: "asia",
        tags: ["bf:primavera", "bf:pais:japao"],
        name: "Japão",
      },
    ],
    { seed: false },
  );
  const nacional = filterBlackPackages(pkgs, { segment: "nacional", country: "japao" });
  assert.equal(nacional.length, 1);
  assert.equal(nacional[0].slug, "fernando-de-noronha");
});

test("filterBlackPackages: season + country with seed", () => {
  const pkgs = getBlackCatalogPackages(
    [
      { slug: "japao-essencial-sao-paulo", categorySlug: "asia", tags: [], name: "JP SP" },
      { slug: "italia-classica", categorySlug: "europa", tags: [], name: "IT" },
      { slug: "punta-cana", categorySlug: "caribe", tags: [], name: "PC" },
    ],
    { seed: true },
  );
  const primaveraJapao = filterBlackPackages(pkgs, {
    segment: "primavera",
    country: "japao",
  });
  assert.equal(primaveraJapao.length, 1);
  assert.equal(primaveraJapao[0].slug, "japao-essencial-sao-paulo");

  const verao = filterBlackPackages(pkgs, { segment: "verao" });
  assert.ok(verao.some((p) => p.slug === "punta-cana"));
});

test("visible segments hide outono when empty", () => {
  const pkgs = getBlackCatalogPackages(
    [
      { slug: "fernando-de-noronha", categorySlug: "nacionais", tags: [], name: "N" },
      { slug: "punta-cana", categorySlug: "caribe", tags: [], name: "P" },
    ],
    { seed: true },
  );
  const segs = visibleBlackSegments(pkgs).map((s) => s.id);
  assert.ok(segs.includes("nacional"));
  assert.ok(segs.includes("verao"));
  assert.ok(!segs.includes("outono"));
});

test("visible countries only under international season", () => {
  const pkgs = getBlackCatalogPackages(
    [
      { slug: "japao-essencial-sao-paulo", categorySlug: "asia", tags: [] },
      { slug: "italia-classica", categorySlug: "europa", tags: [] },
      { slug: "fernando-de-noronha", categorySlug: "nacionais", tags: [] },
    ],
    { seed: true },
  );
  assert.deepEqual(visibleBlackCountries(pkgs, "nacional"), []);
  const countries = visibleBlackCountries(pkgs, "primavera").map((c) => c.id);
  assert.ok(countries.includes("japao"));
  assert.ok(countries.includes("italia"));
});

test("query helpers", () => {
  assert.deepEqual(parseBlackFilters("?seg=verao&pais=mexico"), {
    segment: "verao",
    country: "mexico",
  });
  assert.equal(blackFilterQuery({ segment: "nacional", country: "brasil" }), "?seg=nacional");
  assert.equal(
    blackFilterQuery({ segment: "inverno", country: "noruega" }),
    "?seg=inverno&pais=noruega",
  );
  assert.ok(BWT_SEGMENTS.some((s) => s.id === "primavera"));
});
