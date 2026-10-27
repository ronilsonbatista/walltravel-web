import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveBlackMeta,
  filterBlackPackages,
  visibleBlackSegments,
  visibleBlackCountries,
  parseBlackFilters,
  blackFilterQuery,
  BWT_SEGMENTS,
} from "../data/black-wall-travel.js";

test("nacional packages have no country secondary filter need", () => {
  const meta = resolveBlackMeta({
    slug: "fernando-de-noronha",
    categorySlug: "nacionais",
    tags: ["nacionais", "luxo"],
    destination: "Fernando de Noronha, Brasil",
  });
  assert.equal(meta.segment, "nacional");
  assert.equal(meta.countrySlug, "brasil");
});

test("overlay maps Japão to primavera + country", () => {
  const meta = resolveBlackMeta({
    slug: "japao-essencial-sao-paulo",
    categorySlug: "asia",
    tags: ["Japão", "Ásia"],
  });
  assert.equal(meta.segment, "primavera");
  assert.equal(meta.countrySlug, "japao");
});

test("bf: tags from CMS win over defaults", () => {
  const meta = resolveBlackMeta({
    slug: "unknown-trip",
    categorySlug: "europa",
    tags: ["bf:inverno", "bf:pais:islandia"],
  });
  assert.equal(meta.segment, "inverno");
  assert.equal(meta.countrySlug, "islandia");
});

test("filterBlackPackages: nacional ignores country param", () => {
  const pkgs = [
    {
      slug: "fernando-de-noronha",
      categorySlug: "nacionais",
      tags: ["nacionais"],
      name: "Noronha",
    },
    {
      slug: "japao-essencial-sao-paulo",
      categorySlug: "asia",
      tags: ["Japão"],
      name: "Japão",
    },
  ];
  const nacional = filterBlackPackages(pkgs, { segment: "nacional", country: "japao" });
  assert.equal(nacional.length, 1);
  assert.equal(nacional[0].slug, "fernando-de-noronha");
});

test("filterBlackPackages: season + country", () => {
  const pkgs = [
    { slug: "japao-essencial-sao-paulo", categorySlug: "asia", tags: [], name: "JP SP" },
    { slug: "italia-classica", categorySlug: "europa", tags: [], name: "IT" },
    { slug: "punta-cana", categorySlug: "caribe", tags: [], name: "PC" },
  ];
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
  const pkgs = [
    { slug: "fernando-de-noronha", categorySlug: "nacionais", tags: ["nacionais"] },
    { slug: "punta-cana", categorySlug: "caribe", tags: [] },
  ];
  const segs = visibleBlackSegments(pkgs).map((s) => s.id);
  assert.ok(segs.includes("nacional"));
  assert.ok(segs.includes("verao"));
  assert.ok(!segs.includes("outono"));
});

test("visible countries only under international season", () => {
  const pkgs = [
    { slug: "japao-essencial-sao-paulo", categorySlug: "asia", tags: [] },
    { slug: "italia-classica", categorySlug: "europa", tags: [] },
    { slug: "fernando-de-noronha", categorySlug: "nacionais", tags: ["nacionais"] },
  ];
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
