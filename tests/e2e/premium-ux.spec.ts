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
        headerPos: getComputedStyle(header).position,
        paddingTop: hs.paddingTop,
        slideshowTop: document.querySelector(".hero-slideshow")?.getBoundingClientRect().top ?? null,
      };
    });
    expect(metrics.headerPos).toBe("fixed");
    expect(parseFloat(metrics.paddingTop)).toBe(0);
    // Slideshow fills hero edge-to-edge; hero itself starts at document top (no spacer gap)
    expect(metrics.heroTop).toBeLessThanOrEqual(2);
    expect(metrics.slideshowTop).toBeLessThanOrEqual(2);
    expect(metrics.headerBottom).toBeGreaterThan(40);
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

  test("mobile menu does not leak Destinos into viewport", async ({ browser }) => {
    const context = await browser.newContext({ ...devices["iPhone 12"], reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const leak = await page.evaluate(() => {
      const nav = document.getElementById("nav-menu");
      if (!nav || nav.classList.contains("active")) return { ok: false, reason: "menu missing or open" };
      const dest = Array.from(nav.querySelectorAll(".nav-link")).find((a) => /destinos/i.test(a.textContent || ""));
      const r = dest?.getBoundingClientRect();
      const vw = window.innerWidth;
      return {
        ok: true,
        left: r?.left ?? null,
        right: r?.right ?? null,
        vw,
        ariaHidden: nav.getAttribute("aria-hidden"),
        visibility: getComputedStyle(nav).visibility,
      };
    });
    expect(leak.ok).toBe(true);
    expect(leak.visibility).toBe("hidden");
    expect(leak.ariaHidden).toBe("true");
    expect(leak.left).toBeGreaterThanOrEqual(leak.vw - 1);
    await context.close();
  });

  test("mobile home hero title clears fixed header", async ({ browser }) => {
    const context = await browser.newContext({ ...devices["iPhone 12"], reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const metrics = await page.evaluate(() => {
      const h1 = document.querySelector(".hero-title");
      const header = document.querySelector(".header");
      const logo = document.querySelector(".logo-link, .logo-svg");
      return {
        h1Top: h1?.getBoundingClientRect().top ?? null,
        headerBottom: header?.getBoundingClientRect().bottom ?? null,
        logoBottom: logo?.getBoundingClientRect().bottom ?? null,
      };
    });
    expect(metrics.h1Top).toBeGreaterThan(metrics.headerBottom - 2);
    expect(metrics.h1Top).toBeGreaterThan(metrics.logoBottom + 8);
    await context.close();
  });
});
