import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cardMatchesActiveFilter,
  normalizePackageFilterTags,
  packageMatchesFilterChip,
  visibleCategoryFilterChips,
} from "../data/category-filters.js";

describe("category filter chips", () => {
  it("hides chips with zero catalog matches (Caribe Luxo case)", () => {
    const caribe = [
      {
        tags: ["caribe", "classico", "legacy:abc", "source:live-legacy-supabase"],
      },
      { tags: ["caribe", "classico"] },
    ];
    const visible = visibleCategoryFilterChips(caribe).map((c) => c.id);
    assert.deepEqual(visible, []);
  });

  it("shows luxo when at least one package has the tag", () => {
    const packages = [
      { tags: ["caribe", "classico"] },
      { tags: ["caribe", "luxo"] },
    ];
    const visible = visibleCategoryFilterChips(packages).map((c) => c.id);
    assert.deepEqual(visible, ["luxo"]);
  });

  it("maps lua-de-mel via romance alias", () => {
    const packages = [{ tags: ["romance"] }];
    const visible = visibleCategoryFilterChips(packages).map((c) => c.id);
    assert.deepEqual(visible, ["lua-de-mel"]);
    assert.equal(cardMatchesActiveFilter("lua-de-mel", "romance"), true);
  });

  it("strips internal tags before matching", () => {
    const tags = normalizePackageFilterTags([
      "praia",
      "legacy:uuid",
      "source:live-legacy-supabase",
    ]);
    assert.deepEqual(tags, ["praia"]);
    assert.equal(
      packageMatchesFilterChip(tags, {
        id: "praia",
        label: "Praia",
        matchers: ["praia"],
      }),
      true,
    );
  });

  it("todos always matches", () => {
    assert.equal(cardMatchesActiveFilter("todos", "caribe,classico"), true);
  });
});
