import { test, expect, devices } from "@playwright/test";

test.describe("immersive experience system", () => {
  test("home uses destination explorer not full catalog grid", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("[data-wt-dest-explorer]")).toBeVisible();
    await expect(page.locator("#destinos-grid")).toHaveCount(0);
    const previews = page.locator("[data-dest-preview]");
    const count = await previews.count();
    expect(count).toBeLessThanOrEqual(4);
    // CTA when featured destinations exist; empty-state link otherwise
    const cta = page.getByRole("link", { name: /vitrine completa/i });
    await expect(cta.first()).toBeVisible();
  });

  test("shared surface tokens avoid near-black fills", async ({ page }) => {
    await page.goto("/");
    const surfaces = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return {
        dark: s.getPropertyValue("--surface-dark").trim(),
        olive: s.getPropertyValue("--surface-olive").trim(),
        green: s.getPropertyValue("--surface-green").trim(),
        base: s.getPropertyValue("--surface-base").trim(),
      };
    });
    expect(surfaces.olive.toLowerCase()).toBe("#3f4328");
    expect(surfaces.green.toLowerCase()).toBe("#5c5e2e");
    expect(surfaces.base.toLowerCase()).toMatch(/#f6f1e8|var\(--bg-color\)/i);
    expect(surfaces.dark.toLowerCase()).not.toMatch(/#111|#151515|#16170f/);
  });

  test("grupos catalog uses shared hero carousel primitive", async ({ page }) => {
    await page.goto("/grupos");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("[data-wt-hero-carousel], [data-group-hero-carousel]").first()).toBeVisible();
    await expect(page.locator(".groups-chapters .group-chapter")).toHaveCount(3);
    const bg = await page.locator(".group-hero").first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/rgb\(\s*63,\s*67,\s*40\s*\)/);
  });

  test("group detail uses GroupDetailTemplate anatomy", async ({ browser }) => {
    const context = await browser.newContext({ ...devices["iPhone 12"], reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/grupos/grecia");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("[data-wt-group-template]")).toBeVisible();
    await expect(page.locator("#group-itinerary")).toBeVisible();
    await expect(page.locator("[data-wt-sticky-cta], .sticky-bottom-bar").first()).toBeVisible();
    await context.close();
  });

  test("vitrine short intro mount and uniform cards", async ({ page }) => {
    await page.goto("/vitrine");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(".wt-vitrine-header, .vitrine-header").first()).toBeVisible();
    await expect(page.locator(".wt-vitrine-grid, .vitrine-grid").first()).toBeVisible();
  });
});
