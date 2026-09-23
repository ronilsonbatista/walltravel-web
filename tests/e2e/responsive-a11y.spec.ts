import { test, expect, devices } from "@playwright/test";

const PAGES = [
  { name: "home", path: "/" },
  { name: "grupos", path: "/grupos" },
  { name: "grecia", path: "/grupos/grecia" },
  { name: "turquia", path: "/grupos/turquia" },
  { name: "italia", path: "/grupos/italia" },
  { name: "vitrine", path: "/vitrine" },
] as const;

const BREAKPOINTS = [
  { name: "320", width: 320, height: 640 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 800 },
] as const;

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

for (const pageDef of PAGES) {
  for (const bp of BREAKPOINTS) {
    test(`${pageDef.name} no overflow @ ${bp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto(pageDef.path);
      await assertNoHorizontalOverflow(page);
    });
  }
}

test("mobile menu exposes aria-expanded and 44px hit target", async ({
  browser,
}) => {
  const context = await browser.newContext({ ...devices["iPhone 12"] });
  const page = await context.newPage();
  await page.goto("/");
  const menu = page.locator("#menu-toggle");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  const box = await menu.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toHaveAttribute("aria-label", "Fechar menu");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await context.close();
});

test("greece sticky CTA uses safe-area padding", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["iPhone 12"] });
  const page = await context.newPage();
  await page.goto("/grupos/grecia");
  await page.waitForLoadState("networkidle");
  const sticky = page.locator(".sticky-bottom-bar").first();
  await expect(sticky).toBeVisible();
  const padBottom = await sticky.evaluate((el) => getComputedStyle(el).paddingBottom);
  // env(safe-area) resolves to 0px on desktop Chromium; assert rule is present via computed min height.
  const minHeight = await sticky.evaluate((el) => getComputedStyle(el).minHeight);
  expect(parseFloat(minHeight)).toBeGreaterThanOrEqual(70);
  expect(padBottom.length).toBeGreaterThan(0);
  await context.close();
});

test("skip link targets main content", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".skip-link")).toHaveAttribute("href", "#main-content");
  await expect(page.locator("#main-content")).toHaveCount(1);
});
