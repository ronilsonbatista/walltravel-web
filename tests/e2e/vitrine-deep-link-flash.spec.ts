import { test, expect } from "@playwright/test";

/**
 * Deep-link / cold load into /vitrine/* must never paint the home hero
 * ("África do Sul") while storefront hydrate + router boot.
 */
test.describe("vitrine deep-link first paint", () => {
  test.use({ reducedMotion: "reduce" });

  for (const path of ["/vitrine/europa", "/vitrine/asia", "/vitrine"]) {
    test(`cold load ${path} never shows África home hero`, async ({ page }) => {
      const africaHits: string[] = [];

      await page.addInitScript(() => {
        try {
          sessionStorage.setItem("wt_immersive_intro_played", "1");
        } catch {
          /* ignore */
        }
      });

      // Poll from first paint through router settle.
      const probe = page.waitForFunction(() => {
        const home = document.getElementById("home-view");
        if (!home) return { ok: true, reason: "no-home" };
        const style = window.getComputedStyle(home);
        const hidden =
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.opacity === "0" ||
          home.offsetParent === null;
        const title = document.getElementById("slide-card-title")?.textContent?.trim() || "";
        const africaVisible =
          !hidden && /áfrica/i.test(title) && home.getClientRects().length > 0;
        return {
          ok: !africaVisible,
          hidden,
          title,
          display: style.display,
          routeHome: document.documentElement.classList.contains("wt-route-home"),
        };
      });

      await page.goto(path, { waitUntil: "domcontentloaded" });

      // Immediate first-paint check (before networkidle / hydrate).
      const early = await page.evaluate(() => {
        const home = document.getElementById("home-view");
        const style = home ? getComputedStyle(home) : null;
        const title = document.getElementById("slide-card-title")?.textContent?.trim() || "";
        return {
          homeDisplay: style?.display || "missing",
          routeHome: document.documentElement.classList.contains("wt-route-home"),
          title,
          bodyTextSample: document.body?.innerText?.slice(0, 400) || "",
        };
      });

      expect(early.routeHome, `wt-route-home should be off on ${path}`).toBe(false);
      expect(early.homeDisplay, `home-view must be display:none on ${path}`).toBe("none");
      // Visible body text must not be the home Africa card while home is "shown"
      if (early.homeDisplay !== "none") {
        africaHits.push(early.title);
      }

      await probe;
      await page.waitForLoadState("networkidle");

      // Settled route: no África do Sul slide card visible; category/vitrine chrome present.
      const settled = await page.evaluate(() => {
        const home = document.getElementById("home-view");
        const homeDisplay = home ? getComputedStyle(home).display : "missing";
        const visibleText = document.body?.innerText || "";
        const homeHeroVisible =
          homeDisplay !== "none" &&
          home != null &&
          home.getClientRects().length > 0 &&
          /áfrica do sul/i.test(
            document.getElementById("slide-card-title")?.textContent || "",
          );
        return {
          homeDisplay,
          homeHeroVisible,
          hasAfricaInVisibleHomeCard: homeHeroVisible,
          path: location.pathname,
        };
      });

      expect(settled.homeHeroVisible).toBe(false);
      expect(settled.homeDisplay).toBe("none");
      expect(africaHits).toEqual([]);
    });
  }

  test("home still shows África hero after intro skip", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("wt_immersive_intro_played", "1");
      } catch {
        /* ignore */
      }
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#home-view")).toBeVisible();
    await expect(page.locator("#slide-card-title")).toContainText(/África/i, {
      timeout: 8000,
    });
  });
});
