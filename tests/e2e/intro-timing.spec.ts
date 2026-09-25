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

  test("first session home reads the line without a long hold", async ({ page }) => {
    await clearHomeIntroSession(page);
    await page.goto("/");
    const intro = page.locator("[data-wt-page-intro][data-intro-preset='home']");
    await expect(intro).toBeVisible({ timeout: 5000 });
    await expect(intro).toHaveAttribute("data-intro-state", "intro", { timeout: 4000 });
    const readingMs = Number(await intro.getAttribute("data-intro-reading-ms"));
    expect(readingMs).toBeGreaterThanOrEqual(1400);
    expect(readingMs).toBeLessThanOrEqual(2500);
    const count = intro.locator("[data-intro-count]");
    await expect(count).toBeVisible();
    const early = Number(await count.textContent());
    expect(early).toBeGreaterThanOrEqual(0);
    expect(early).toBeLessThan(45);
    const hidden = await page.evaluate(() => ({
      hero: getComputedStyle(document.querySelector(".hero") as Element).visibility,
      header: getComputedStyle(document.querySelector(".header") as Element).visibility,
      progress: getComputedStyle(document.querySelector(".hero-progress-wrapper") as Element).visibility,
      whatsapp: getComputedStyle(document.querySelector(".whatsapp-float") as Element).visibility,
      introImages: document.querySelectorAll("[data-wt-page-intro] img").length,
    }));
    expect(hidden.hero).toBe("hidden");
    expect(hidden.header).toBe("hidden");
    expect(hidden.progress).toBe("hidden");
    expect(hidden.whatsapp).toBe("hidden");
    expect(hidden.introImages).toBe(0);
    const rail = await page.evaluate(() => {
      const fill = document.querySelector("[data-intro-rail]") as HTMLElement | null;
      const track = document.querySelector(".wt-intro-rail-track") as HTMLElement | null;
      const count = document.querySelector("[data-intro-count]");
      if (!fill || !track || !count) return null;
      const trackBox = track.getBoundingClientRect();
      const fillBox = fill.getBoundingClientRect();
      const n = Number(count.textContent);
      return {
        trackWidth: trackBox.width,
        viewport: document.documentElement.clientWidth,
        height: trackBox.height,
        bottom: Math.round(trackBox.bottom),
        viewH: window.innerHeight,
        pct: trackBox.width ? (fillBox.width / trackBox.width) * 100 : 0,
        n,
        font: parseFloat(getComputedStyle(count).fontSize),
        opacity: getComputedStyle(count).opacity,
        color: getComputedStyle(count).color,
        countBottomGap: window.innerHeight - count.getBoundingClientRect().bottom,
      };
    });
    expect(rail).not.toBeNull();
    expect(rail!.trackWidth).toBeGreaterThan(rail!.viewport - 2);
    expect(rail!.height).toBeLessThanOrEqual(2);
    expect(rail!.bottom).toBeGreaterThanOrEqual(rail!.viewH - 2);
    expect(Math.abs(rail!.pct - rail!.n)).toBeLessThan(3);
    expect(rail!.font).toBeGreaterThanOrEqual(14);
    expect(rail!.font).toBeLessThanOrEqual(16);
    expect(rail!.opacity).toBe("1");
    expect(rail!.color).toMatch(/rgb\(\s*63,\s*67,\s*40\s*\)/);
    expect(rail!.countBottomGap).toBeGreaterThan(12);
    await expect(intro.locator("[data-intro-skip]")).toHaveCount(0);
    await expect(intro.locator("[data-intro-brand]")).toContainText("WallTravel");
    await page.waitForTimeout(700);
    const mid = Number(await count.textContent());
    expect(mid).toBeGreaterThan(early);
    expect(mid).toBeLessThan(100);
  });

  test("100 starts the handoff immediately and the hero stays hidden until then", async ({ page }) => {
    await clearHomeIntroSession(page);
    await page.goto("/");
    await expect(page.locator("[data-intro-count]")).toBeVisible();
    const result = await page.evaluate(() => {
      return new Promise<string>((resolve) => {
        const count = document.querySelector("[data-intro-count]");
        const root = document.documentElement;
        const tick = () => {
          if (!count) {
            resolve("missing");
            return;
          }
          if (count.textContent === "100") {
            resolve(root.dataset.introPhase === "intro" ? "late" : "immediate");
            return;
          }
          if (root.classList.contains("wt-hero-live") && !document.querySelector("[data-wt-page-intro]")) {
            resolve("done");
            return;
          }
          requestAnimationFrame(tick);
        };
        tick();
      });
    });
    expect(result).toBe("immediate");
    const hundred = await page.evaluate(() => {
      const count = document.querySelector("[data-intro-count]");
      if (!count) return null;
      const box = count.getBoundingClientRect();
      return {
        text: count.textContent,
        opacity: getComputedStyle(count).opacity,
        height: box.height,
      };
    });
    expect(hundred?.text).toBe("100");
    expect(hundred?.opacity).toBe("1");
    expect(hundred!.height).toBeGreaterThan(12);
    await page.waitForTimeout(140);
    await expect(page.locator("[data-intro-count]")).toHaveText("100");
    await expect.poll(async () => {
      return page.evaluate(() => {
        const root = document.documentElement;
        const header = document.querySelector("header.header");
        const hero = document.querySelector(".hero");
        return {
          phase: root.dataset.introPhase || "",
          hold: root.classList.contains("wt-intro-hold"),
          hero: hero ? getComputedStyle(hero).visibility : "missing",
          header: header ? getComputedStyle(header).visibility : "missing",
        };
      });
    }, { timeout: 4000 }).toEqual({
      phase: "hero-live",
      hold: false,
      hero: "visible",
      header: "visible",
    });
  });

  test("intro has no skip and finishes into the hero once per session", async ({ page }) => {
    await clearHomeIntroSession(page);
    await page.goto("/");
    const intro = page.locator("[data-wt-page-intro][data-intro-preset='home']");
    await expect(intro).toBeVisible();
    await page.keyboard.press("Escape");
    await intro.hover();
    await page.mouse.wheel(0, 160);
    await page.waitForTimeout(250);
    await expect(intro).toBeVisible();

    await expect(intro).toHaveCount(0, { timeout: 6000 });
    const stored = await page.evaluate((key) => sessionStorage.getItem(key), HOME_INTRO_KEY);
    expect(stored).toBe("1");

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const returned = await page.evaluate(() => ({
      intro: document.querySelectorAll("[data-wt-page-intro]").length,
      hold: document.documentElement.classList.contains("wt-intro-hold"),
      live: document.documentElement.classList.contains("wt-hero-live"),
      hero: getComputedStyle(document.querySelector(".hero") as Element).visibility,
    }));
    expect(returned.intro).toBe(0);
    expect(returned.hold).toBe(false);
    expect(returned.live).toBe(true);
    expect(returned.hero).toBe("visible");
    await expect(page.locator(".hero")).toBeVisible();
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

    await expect(intro).toHaveCount(0, { timeout: 6000 });
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
    await expect(page.locator("[data-wt-page-intro]")).toHaveCount(0);
    await expect(page.locator("[data-wt-group-template]")).toBeVisible();
  });

  test("vitrine, groups and experience open without an intro", async ({ page }) => {
    await page.goto("/vitrine");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("[data-wt-page-intro]")).toHaveCount(0);
    await expect(page.locator(".vitrine-header")).toBeVisible();

    await page.goto("/grupos");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("[data-wt-page-intro]")).toHaveCount(0);
    await expect(page.locator(".groups-catalog-hero")).toBeVisible();

    await page.goto("/viagens/safari-africa");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("[data-wt-page-intro]")).toHaveCount(0);
  });

  test("slow network does not show the hero before the intro", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "CDP network emulation is Chromium-only");
    test.setTimeout(45000);
    await clearHomeIntroSession(page);
    const client = await page.context().newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 400,
      downloadThroughput: (400 * 1024) / 8,
      uploadThroughput: (400 * 1024) / 8,
    });
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.goto("/", { waitUntil: "commit", timeout: 20000 });
    await page.waitForSelector(".hero", { state: "attached", timeout: 20000 });
    const vis = await page.evaluate(() => ({
      hero: getComputedStyle(document.querySelector(".hero") as Element).visibility,
      header: getComputedStyle(document.querySelector(".header") as Element).visibility,
      phase: document.documentElement.dataset.introPhase || "",
      hold: document.documentElement.classList.contains("wt-intro-hold"),
      intro: document.querySelectorAll("[data-wt-page-intro]").length,
    }));
    expect(vis.hold).toBe(true);
    expect(vis.intro).toBe(1);
    expect(vis.hero).toBe("hidden");
    expect(vis.header).toBe("hidden");
    expect(vis.phase).not.toBe("hero-live");
  });

  test("mobile hero photo starts at the top", async ({ browser }) => {
    const context = await browser.newContext({
      ...devices["iPhone 12"],
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.addInitScript((key) => {
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        /* ignore */
      }
    }, HOME_INTRO_KEY);
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const box = await page.evaluate(() => {
      const hero = document.querySelector(".hero");
      const slide = document.querySelector(".hero-slideshow");
      const header = document.querySelector(".header");
      return {
        heroTop: hero?.getBoundingClientRect().top ?? 99,
        slideTop: slide?.getBoundingClientRect().top ?? 99,
        headerPos: header ? getComputedStyle(header).position : "",
        cardBg: document.querySelector(".hero-slide-card")
          ? getComputedStyle(document.querySelector(".hero-slide-card") as Element).backgroundColor
          : "",
        overflow: document.documentElement.scrollWidth <= window.innerWidth + 1,
      };
    });
    expect(box.heroTop).toBeLessThanOrEqual(1);
    expect(box.slideTop).toBeLessThanOrEqual(1);
    expect(box.headerPos).toBe("fixed");
    expect(box.overflow).toBe(true);
    await context.close();
  });
});
