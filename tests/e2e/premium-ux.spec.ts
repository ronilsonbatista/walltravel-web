import { test, expect, devices } from "@playwright/test";

test.describe("premium UX refinement", () => {
  test("home hero drops Lençóis and includes Alpes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator('[data-slide-id="lencois-maranhenses"]')).toHaveCount(0);
    await expect(page.locator('[data-slide-id="alpes"]')).toHaveCount(1);
    await expect(page.locator('[data-slide-id="noronha"]')).toHaveCount(1);
    await expect(page.locator('[data-slide-id="asia"]')).toHaveCount(1);
    await expect(page.locator(".hero-slide")).toHaveCount(8);
  });

  test("home explorer CTA is vitrine-only", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const explorer = page.locator("[data-wt-dest-explorer]");
    await expect(explorer).toBeVisible();
    await expect(explorer.getByRole("link", { name: /vitrine completa/i })).toBeVisible();
    await expect(explorer.getByRole("link", { name: /viagens em grupo/i })).toHaveCount(0);
  });

  test("public email is agencia@", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "agencia@walltravel.com.br" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("contato@walltravel.com.br");
  });

  test("section rhythm tokens exist", async ({ page }) => {
    await page.goto("/");
    const mist = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--surface-green-mist").trim(),
    );
    expect(mist.toLowerCase()).toBe("#e8eae0");
    await expect(page.locator("#destinos-experiencias.section-rhythm-a")).toHaveCount(1);
    await expect(page.locator("#personalizacao.section-rhythm-c")).toHaveCount(1);
  });

  test("groups catalog has no CMS copy", async ({ page }) => {
    await page.goto("/grupos");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText("CMS");
    await expect(page.locator(".groups-header-desc").first()).toBeVisible();
  });

  test("mobile home hero is full-bleed under header", async ({ browser }) => {
    const context = await browser.newContext({ ...devices["iPhone 12"], reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    const metrics = await page.evaluate(() => {
      const hero = document.querySelector(".hero");
      const header = document.querySelector(".header");
      const hs = getComputedStyle(hero);
      const hr = hero.getBoundingClientRect();
      const hdr = header.getBoundingClientRect();
      return {
        heroTop: hr.top,
        headerBottom: hdr.bottom,
        paddingTop: hs.paddingTop,
      };
    });
    expect(metrics.heroTop).toBeLessThanOrEqual(1);
    expect(parseFloat(metrics.paddingTop)).toBe(0);
    await context.close();
  });

  test("greece itinerary day strip on mobile", async ({ browser }) => {
    const context = await browser.newContext({ ...devices["iPhone 12"], reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/grupos/grecia");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#group-itinerary")).toBeVisible();
    await expect(page.locator("[data-itinerary-day-btn]").first()).toBeVisible();
    await expect(page.locator("[data-wt-sticky-cta], .sticky-bottom-bar").first()).toBeVisible();
    await context.close();
  });
});
