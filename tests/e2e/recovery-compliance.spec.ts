import { test, expect } from "@playwright/test";

test.describe("recovery compliance", () => {
  test.use({ reducedMotion: "reduce" });

  test("home slides serve the new Europe and Asia files", async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("wt_immersive_intro_played", "1"));
    await page.goto("/");
    const slides = await page.evaluate(() => {
      const read = (id: string) => {
        const slide = document.querySelector(`[data-slide-id="${id}"]`);
        const sources = [...(slide?.querySelectorAll("source") || [])].map(
          (source) => source.getAttribute("srcset") || source.getAttribute("data-srcset") || "",
        );
        const img = slide?.querySelector("img");
        return {
          sources,
          img: img?.getAttribute("src") || img?.getAttribute("data-src") || "",
        };
      };
      return { europa: read("europa"), asia: read("asia") };
    });
    expect(slides.europa.sources.join(" ")).toContain("europa-paris-noite");
    expect(slides.europa.sources.join(" ") + slides.europa.img).not.toContain("/images/vitrine/europa.webp");
    expect(slides.asia.sources.join(" ")).toContain("asia-kyoto");
    expect(slides.asia.sources.join(" ") + slides.asia.img).not.toContain("/images/vitrine/asia.webp");
  });

  test("Greece uses Santorini and groups expose an explicit CTA", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/grupos");
    await expect(page.locator(".group-chapter-cta").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".group-chapter").first().locator(".group-chapter-cta")).toHaveText(/Ver detalhes/i);
    const src = await page.locator(".group-chapter").first().locator("img").first().getAttribute("src");
    expect(src).toContain("grecia-santorini");
    expect(src).not.toContain("hero-santorini.webp");
    const mobile = await page.locator(".group-chapter").first().locator("source").first().getAttribute("srcset");
    expect(mobile).toContain("grecia-santorini-mobile");

    await page.goto("/grupos/grecia");
    await expect(page.locator(".group-hero-img").first()).toBeVisible({ timeout: 15000 });
    const hero = await page.locator(".group-hero-img").first().getAttribute("src");
    expect(hero).toContain("grecia-santorini");
  });

  test("primary CTAs use the WallTravel olive, not neon green", async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("wt_immersive_intro_played", "1"));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator(".slide-card-cta").first()).toBeVisible();
    const colors = await page.evaluate(() => {
      const read = (sel: string) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).backgroundColor : "";
      };
      return {
        primary: read(".btn-primary"),
        pill: read(".slide-card-cta"),
        neon: [...document.querySelectorAll("a,button")].some((el) => {
          const bg = getComputedStyle(el).backgroundColor;
          return bg === "rgb(37, 211, 102)" || bg === "rgb(27, 122, 61)";
        }),
      };
    });
    expect(colors.primary).toMatch(/rgb\(\s*63,\s*67,\s*40\s*\)/);
    expect(colors.pill).toMatch(/rgb\(\s*63,\s*67,\s*40\s*\)/);
    expect(colors.neon).toBe(false);
    const css = await page.evaluate(async () => {
      const href = [...document.styleSheets].map((sheet) => sheet.href).find((value) => value?.includes("index"));
      if (!href) return "";
      const res = await fetch(href);
      return res.text();
    });
    expect(css).not.toContain("#25d366");
    expect(css).not.toContain("#1b7a3d");
  });
});
