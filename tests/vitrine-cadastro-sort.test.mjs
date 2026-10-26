import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapProduct,
  sortPackagesByCadastro,
} from "../data/platform-api.js";

describe("vitrine ordem de cadastro", () => {
  it("sortPackagesByCadastro puts newest createdAt first", () => {
    const ordered = sortPackagesByCadastro([
      { slug: "old", createdAt: "2025-01-01T00:00:00.000Z" },
      { slug: "new", createdAt: "2026-10-01T00:00:00.000Z" },
      { slug: "mid", createdAt: "2026-05-01T00:00:00.000Z" },
    ]);
    assert.deepEqual(
      ordered.map((p) => p.slug),
      ["new", "mid", "old"],
    );
  });

  it("mapProduct carries createdAt (falls back to publishedAt)", () => {
    const withCreated = mapProduct({
      slug: "a",
      name: "A",
      createdAt: "2026-10-01T12:00:00.000Z",
      priceFrom: "1000",
    });
    assert.equal(withCreated.createdAt, "2026-10-01T12:00:00.000Z");

    const fallback = mapProduct({
      slug: "b",
      name: "B",
      publishedAt: "2026-09-01T00:00:00.000Z",
      priceFrom: "1000",
    });
    assert.equal(fallback.createdAt, "2026-09-01T00:00:00.000Z");
  });
});
