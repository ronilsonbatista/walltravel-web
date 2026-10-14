import { test, expect } from "@playwright/test";

test.describe("Política de Privacidade", () => {
  test.use({ reducedMotion: "reduce" });

  test("deep-link /privacidade renders policy and footer link", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("wt_immersive_intro_played", "1");
      } catch {
        /* ignore */
      }
    });

    await page.goto("/privacidade", { waitUntil: "networkidle" });

    await expect(page).toHaveTitle(/Política de Privacidade/i);
    await expect(page.locator("#privacidade-view")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Política de Privacidade", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Quem somos/i })).toBeVisible();
    await expect(page.getByText("55.743.194/0001-07").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "agencia@walltravel.com.br" }).first()).toBeVisible();
    await expect(page.locator("html")).not.toHaveClass(/wt-boot-pending/);
    await expect(page.locator("#home-view")).toBeHidden();

    const footerLink = page.locator("footer.footer a[href='/privacidade']").first();
    await expect(footerLink).toBeVisible();
    await expect(footerLink).toHaveText(/Política de Privacidade/i);
  });

  test("SPA navigation from home footer reaches /privacidade", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("wt_immersive_intro_played", "1");
      } catch {
        /* ignore */
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("footer.footer a[href='/privacidade']").first().click();
    await expect(page).toHaveURL(/\/privacidade\/?$/);
    await expect(page.locator("#privacidade-view")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Política de Privacidade", level: 1 })).toBeVisible();
  });
});
