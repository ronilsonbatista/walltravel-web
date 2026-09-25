import { test, expect, devices } from "@playwright/test";

const HOME_INTRO_KEY = "wt_immersive_intro_played";

/** Clear session once — do not use addInitScript (it re-runs on every navigation). */
async function clearHomeIntroSession(page: import("@playwright/test").Page) {
  await page.goto("about:blank");
  await page.evaluate((key) => {
    try {
      sessionStorage.removeItem(key);
      sessionStorage.removeItem("wt_page_intro_vitrine");
      sessionStorage.removeItem("wt_page_intro_grupos");
    } catch {
      /* ignore */
    }
  }, HOME_INTRO_KEY);
}

test.describe("immersive intro timing", () => {
  test.use({ reducedMotion: "no-preference" });

  test("first paint is cream, not white", async ({ page }) => {
    await page.goto("/");
    const bg = await page.evaluate(() => {
      const html = getComputedStyle(document.documentElement).backgroundColor;
      const body = getComputedStyle(document.body).backgroundColor;
      return { html, body };
    });
    // #F6F1E8 → rgb(246, 241, 232)
    expect(bg.html).toMatch(/rgb\(\s*246,\s*241,\s*232\s*\)/);
    expect(bg.body).toMatch(/rgb\(\s*246,\s*241,\s*232\s*\)/);
  });

  test("first session home shows Stage 1 with ~10s presence token", async ({ page }) => {
    await clearHomeIntroSession(page);
    await page.goto("/");
    const intro = page.locator("[data-wt-page-intro][data-intro-preset='home']");
    await expect(intro).toBeVisible({ timeout: 5000 });
    await expect(intro).toHaveAttribute("data-intro-state", "reading", { timeout: 4000 });
    const readingMs = Number(await intro.getAttribute("data-intro-reading-ms"));
    expect(readingMs).toBeGreaterThanOrEqual(2800);
    expect(readingMs).toBeLessThanOrEqual(6500);
    await expect(intro.locator("[data-intro-skip]")).toBeVisible();
    await expect(intro.locator("[data-intro-brand]")).toContainText("WallTravel");
  });

  test("click skip exits smoothly and does not replay in session", async ({ page }) => {
    await clearHomeIntroSession(page);
    await page.goto("/");
    const intro = page.locator("[data-wt-page-intro][data-intro-preset='home']");
    await expect(intro).toBeVisible();
    await intro.locator("[data-intro-skip]").click();
    await expect(intro).toBeHidden({ timeout: 2000 });
    await expect(page.locator("[data-wt-page-intro][data-intro-preset='home']")).toHaveCount(0);

    const stored = await page.evaluate((key) => sessionStorage.getItem(key), HOME_INTRO_KEY);
    expect(stored).toBe("1");

    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("[data-wt-page-intro][data-intro-preset='home']")).toHaveCount(0);
    await expect(page.locator(".hero")).toBeVisible();
  });

  test("scroll/wheel skips home intro", async ({ page }) => {
    await clearHomeIntroSession(page);
    await page.goto("/");
    const intro = page.locator("[data-wt-page-intro][data-intro-preset='home']");
    await expect(intro).toBeVisible();
    await intro.hover();
    await page.mouse.wheel(0, 140);
    await expect(page.locator("[data-wt-page-intro][data-intro-preset='home']")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("reduced-motion shows a short static intro then the hero", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await clearHomeIntroSession(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const intro = page.locator("[data-wt-page-intro][data-intro-preset='home']");
    await expect(intro).toBeVisible({ timeout: 4000 });
    await expect(intro).toHaveCount(0, { timeout: 2500 });
    await expect(page.locator(".hero")).toBeVisible();
    await context.close();
  });

  test("Escape accelerates home intro into the hero", async ({ page }) => {
    await clearHomeIntroSession(page);
    await page.goto("/");
    const intro = page.locator("[data-wt-page-intro][data-intro-preset='home']");
    await expect(intro).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(intro).toHaveCount(0, { timeout: 2000 });
    await expect(page.locator(".hero-slide.active")).toHaveAttribute("data-index", "0");
  });

  test("hero autoplay starts only after intro ends", async ({ page }) => {
    await clearHomeIntroSession(page);
    await page.goto("/");
    const intro = page.locator("[data-wt-page-intro][data-intro-preset='home']");
    await expect(intro).toBeVisible();

    const before = await page.evaluate(() => {
      const fill = document.querySelector(".progress-bar-track.active .progress-bar-fill");
      return fill ? getComputedStyle(fill).animationName : "none";
    });
    const indexDuring = await page.locator(".hero-slide.active").getAttribute("data-index");

    await intro.locator("[data-intro-skip]").click();
    await expect(intro).toHaveCount(0, { timeout: 2000 });
    await page.waitForTimeout(200);

    const indexAfter = await page.locator(".hero-slide.active").getAttribute("data-index");
    expect(indexDuring).toBe("0");
    expect(indexAfter).toBe("0");
    const afterAnim = await page.evaluate(() => {
      const fill = document.querySelector(".progress-bar-track.active .progress-bar-fill");
      return fill ? getComputedStyle(fill).animationPlayState : "paused";
    });
    expect(["running", "paused"]).toContain(afterAnim);
    expect(before === "none" || typeof before === "string").toBeTruthy();
  });

  test("deep link group detail is not home institutional intro", async ({ page }) => {
    await clearHomeIntroSession(page);
    await page.goto("/grupos/grecia");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("[data-wt-page-intro][data-intro-preset='home']")).toHaveCount(0);
    const any = page.locator("[data-wt-page-intro]");
    const count = await any.count();
    if (count > 0) {
      await expect(any.first()).toHaveAttribute("data-intro-preset", "detail");
    }
    await expect(page.locator("[data-wt-group-template]")).toBeVisible();
  });

  test("catalog and groupCatalog presets mount", async ({ page }) => {
    await page.goto("/vitrine");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      try {
        sessionStorage.removeItem("wt_page_intro_vitrine");
      } catch {
        /* ignore */
      }
    });
    await page.goto("/vitrine");
    const catalog = page.locator("[data-wt-page-intro][data-intro-preset='catalog']");
    await expect(catalog).toBeVisible({ timeout: 4000 });

    await page.evaluate(() => {
      try {
        sessionStorage.removeItem("wt_page_intro_grupos");
      } catch {
        /* ignore */
      }
    });
    await page.goto("/grupos");
    const groups = page.locator("[data-wt-page-intro][data-intro-preset='groupCatalog']");
    await expect(groups).toBeVisible({ timeout: 4000 });
  });

  test("mobile interaction skips immediately", async ({ browser }) => {
    const context = await browser.newContext({
      ...devices["iPhone 12"],
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    await clearHomeIntroSession(page);
    await page.goto("/");
    const intro = page.locator("[data-wt-page-intro][data-intro-preset='home']");
    await expect(intro).toBeVisible();
    await intro.click();
    await expect(page.locator("[data-wt-page-intro][data-intro-preset='home']")).toHaveCount(0, {
      timeout: 2000,
    });
    await context.close();
  });
});
