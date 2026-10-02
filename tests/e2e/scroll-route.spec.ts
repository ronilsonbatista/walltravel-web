import { test, expect } from "@playwright/test";

async function waitForRouteSettled(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  // Allow scheduleRouteScroll double-rAF + async view paint to finish.
  await page.waitForTimeout(120);
}

test.describe("SPA route scroll restoration", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("wt_immersive_intro_played", "1");
      } catch {
        /* ignore */
      }
    });
  });

  test("navigating between routes always opens at the top", async ({ page }) => {
    await page.goto("/vitrine");
    await waitForRouteSettled(page);
    await expect(page.locator("#vitrine-view")).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(400);

    await page.locator('.nav-menu a[href="/grupos"]').first().click();
    await expect(page).toHaveURL(/\/grupos\/?$/);
    await waitForRouteSettled(page);
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeLessThan(8);

    await page.evaluate(() => window.scrollTo(0, 900));
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(400);
    await page.locator('.nav-menu a[href="/como-funciona"]').first().click();
    await expect(page).toHaveURL(/\/como-funciona\/?$/);
    await waitForRouteSettled(page);
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeLessThan(8);

    await page.evaluate(() => window.scrollTo(0, 700));
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    await page.locator('a.logo-link[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$/);
    await waitForRouteSettled(page);
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeLessThan(8);
  });

  test("intentional hash links still scroll to the target", async ({ page }) => {
    await page.goto("/vitrine");
    await waitForRouteSettled(page);
    await page.locator('a[href="/#sobre"]').first().click();
    await expect(page).toHaveURL(/\/#sobre$/);
    await waitForRouteSettled(page);
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const target = document.querySelector("#sobre");
          if (!target) return false;
          const rect = target.getBoundingClientRect();
          return rect.top >= 0 && rect.top < window.innerHeight * 0.55;
        }),
      )
      .toBe(true);
  });

  test("hard load on non-home starts near the top", async ({ page }) => {
    await page.goto("/grupos/grecia");
    await waitForRouteSettled(page);
    await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeLessThan(8);
  });
});
