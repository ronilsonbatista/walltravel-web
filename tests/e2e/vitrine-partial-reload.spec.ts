import { test, expect } from "@playwright/test";

async function waitForVitrine(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#vitrine-view [data-vitrine-grid]")).toBeVisible();
  await page.waitForTimeout(80);
}

test.describe("Vitrine parent date filters — partial results update", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("wt_immersive_intro_played", "1");
      } catch {
        /* ignore */
      }
    });
  });

  test("Todas ↔ Datas fixas ↔ Datas flexíveis keep mast/filter chrome mounted", async ({
    page,
  }) => {
    await page.goto("/vitrine");
    await waitForVitrine(page);

    await page.evaluate(() => {
      const mast = document.querySelector(".wt-vitrine-mast");
      const filters = document.querySelector("[data-vitrine-chrome='date-filters']");
      const grid = document.querySelector("[data-vitrine-grid]");
      if (mast) mast.setAttribute("data-test-stable-mast", "1");
      if (filters) filters.setAttribute("data-test-stable-filters", "1");
      if (grid) grid.setAttribute("data-test-stable-grid", "1");
    });

    const clickDateFilter = async (label: string, urlRe: RegExp) => {
      await page.locator(".wt-vitrine-date-chip", { hasText: label }).click();
      await expect(page).toHaveURL(urlRe);
      await page.waitForTimeout(60);
      await expect(page.locator(".wt-route-shell")).toHaveCount(0);
      await expect(page.locator(".wt-vitrine-mast[data-test-stable-mast='1']")).toHaveCount(1);
      await expect(
        page.locator("[data-vitrine-chrome='date-filters'][data-test-stable-filters='1']"),
      ).toHaveCount(1);
      // Same grid element — only its children are replaced.
      await expect(page.locator("[data-vitrine-grid][data-test-stable-grid='1']")).toHaveCount(1);
    };

    await clickDateFilter("Datas fixas", /\/vitrine\/?\?datas=fixas$/);
    await expect(
      page.locator('.wt-vitrine-date-chip.is-active[data-vitrine-date-mode="FIXED"]'),
    ).toHaveCount(1);

    await clickDateFilter("Datas flexíveis", /\/vitrine\/?\?datas=flexiveis$/);
    await expect(
      page.locator('.wt-vitrine-date-chip.is-active[data-vitrine-date-mode="FLEXIBLE"]'),
    ).toHaveCount(1);

    await clickDateFilter("Todas", /\/vitrine\/?$/);
    await expect(
      page.locator('.wt-vitrine-date-chip.is-active[data-vitrine-date-mode=""]'),
    ).toHaveCount(1);
  });

  test("real route change still clears previous view (no SPA stale flash)", async ({ page }) => {
    await page.goto("/vitrine");
    await waitForVitrine(page);
    await page.evaluate(() => {
      document.querySelector(".wt-vitrine-mast")?.setAttribute("data-test-stable-mast", "1");
    });

    // SPA navigate to a destination page (works even when the local catalog grid is empty).
    await page.evaluate(() => {
      window.history.pushState(null, "", "/vitrine/europa");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await expect(page).toHaveURL(/\/vitrine\/europa/);
    await expect(page.locator("#category-view")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("#vitrine-view")).toBeHidden();
    await expect(page.locator("#category-filter-bar .filter-btn", { hasText: "Datas fixas" })).toHaveCount(
      0,
    );

    await page.evaluate(() => {
      window.history.pushState(null, "", "/vitrine");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await waitForVitrine(page);
    // Fresh mount after leaving a destination page.
    await expect(page.locator(".wt-vitrine-mast[data-test-stable-mast='1']")).toHaveCount(0);
    await expect(page.locator(".wt-vitrine-mast")).toBeVisible();
  });
});
