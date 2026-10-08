import { test, expect } from "@playwright/test";

/**
 * Deep-link / cold load must never paint the site footer as primary content
 * while route views are still empty (Africa-fix side-effect on mobile).
 */
test.describe("deep-link footer first paint", () => {
  test.use({
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  for (const path of ["/vitrine/europa", "/grupos/grecia", "/viagens/japao-essencial"]) {
    test(`cold load ${path} never shows footer as primary content`, async ({ page }) => {
      await page.addInitScript(() => {
        try {
          sessionStorage.setItem("wt_immersive_intro_played", "1");
        } catch {
          /* ignore */
        }
      });

      await page.goto(path, { waitUntil: "domcontentloaded" });

      const early = await page.evaluate(() => {
        const footer = document.querySelector("footer.footer");
        const footerStyle = footer ? getComputedStyle(footer) : null;
        const footerRect = footer?.getBoundingClientRect();
        const home = document.getElementById("home-view");
        const homeDisplay = home ? getComputedStyle(home).display : "missing";
        const visibleText = (document.body?.innerText || "").replace(/\s+/g, " ").trim();
        const bootPending = document.documentElement.classList.contains("wt-boot-pending");
        const shell = document.querySelector(".wt-route-shell, #como-funciona-view .como-funciona-mast");
        const shellVisible =
          !!shell &&
          getComputedStyle(shell).display !== "none" &&
          (shell as HTMLElement).getClientRects().length > 0;
        const footerVisible =
          footerStyle?.visibility !== "hidden" &&
          footerStyle?.display !== "none" &&
          (footerRect?.height || 0) > 0;
        const footerPrimary =
          footerVisible &&
          (footerRect?.top ?? 9999) < window.innerHeight * 0.55 &&
          /Curadoria e assessoria/i.test(visibleText) &&
          !shellVisible;
        return {
          homeDisplay,
          bootPending,
          footerDisplay: footerStyle?.display || "missing",
          footerVisibility: footerStyle?.visibility || "missing",
          footerTop: footerRect?.top ?? null,
          shellVisible,
          footerPrimary,
          visibleSample: visibleText.slice(0, 280),
        };
      });

      expect(early.homeDisplay, "home must stay hidden on deep-link").toBe("none");
      expect(early.footerPrimary, `footer must not be primary on ${path}`).toBe(false);
      // While boot hold is active, footer must stay out of layout.
      if (early.bootPending) {
        expect(early.footerDisplay).toBe("none");
      }

      await page.waitForLoadState("networkidle");

      const settled = await page.evaluate(() => {
        const footer = document.querySelector("footer.footer");
        const footerStyle = footer ? getComputedStyle(footer) : null;
        return {
          bootPending: document.documentElement.classList.contains("wt-boot-pending"),
          footerDisplay: footerStyle?.display || "missing",
          homeDisplay: document.getElementById("home-view")
            ? getComputedStyle(document.getElementById("home-view")!).display
            : "missing",
          path: location.pathname,
        };
      });

      expect(settled.bootPending).toBe(false);
      expect(settled.footerDisplay).toBe("block");
      expect(settled.homeDisplay).toBe("none");
    });
  }

  test("home still shows footer after intro skip", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("wt_immersive_intro_played", "1");
      } catch {
        /* ignore */
      }
    });
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("#home-view")).toBeVisible();
    await expect(page.locator("footer.footer")).toBeVisible();
    await expect(page.locator("html")).not.toHaveClass(/wt-boot-pending/);
  });
});
