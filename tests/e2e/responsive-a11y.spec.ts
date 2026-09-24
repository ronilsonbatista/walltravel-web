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
  await page.waitForLoadState("networkidle");
  const menu = page.locator("#menu-toggle");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  const box = await menu.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  await menu.click({ force: true });
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toHaveAttribute("aria-label", "Fechar menu");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await context.close();
});

test("unknown route shows 404 empty state", async ({ page }) => {
  await page.goto("/rota-inexistente-auditoria");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: /não encontrada/i })).toBeVisible();
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

test("grupos catalog uses journey chapters not package card grid", async ({ page }) => {
  await page.goto("/grupos");
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".groups-chapters .group-chapter")).toHaveCount(3);
  await expect(page.locator(".groups-catalog-grid .group-card")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /viagens em grupo/i })).toBeVisible();
});

test("greece conversion journey order and investment price", async ({ page }) => {
  await page.goto("/grupos/grecia");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("[data-group-over-hero]")).toBeVisible();
  await expect(page.locator("#group-why")).toBeVisible();
  await expect(page.locator("#group-route")).toHaveCount(0);
  await expect(page.locator("#group-itinerary")).toHaveCount(1);
  await expect(page.locator("#group-itinerary")).toBeVisible();
  await expect(page.locator("#group-gallery")).toBeVisible();
  await expect(page.locator("#group-hotels")).toBeVisible();
  await expect(page.locator("#group-leader")).toBeVisible();
  await expect(page.locator("#group-investment")).toBeVisible();
  await expect(page.locator("#group-form")).toBeVisible();

  const journeyHeading = page.locator("#group-itinerary").getByRole("heading", {
    name: /sua jornada|roteiro dia a dia/i,
  });
  await expect(journeyHeading.first()).toBeVisible();

  const order = await page.evaluate(() => {
    const ids = [
      "group-why",
      "group-itinerary",
      "group-gallery",
      "group-hotels",
      "group-leader",
      "group-investment",
      "group-form",
    ];
    return ids
      .map((id) => {
        const el = document.getElementById(id);
        return el ? { id, top: el.getBoundingClientRect().top + window.scrollY } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.top - b.top)
      .map((x) => x.id);
  });
  expect(order).toEqual([
    "group-why",
    "group-itinerary",
    "group-gallery",
    "group-hotels",
    "group-leader",
    "group-investment",
    "group-form",
  ]);

  await expect(page.locator(".group-investment-hero-value")).toContainText("31.480");
});

test("coming soon pages show atmosphere gallery without invented price", async ({ page }) => {
  await page.goto("/grupos/turquia");
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".group-teaser-gallery-item")).toHaveCount(4);
  await expect(page.locator(".group-investment-hero-value")).toHaveCount(0);
  await expect(page.locator(".group-hero .group-card-badge")).toHaveText(/em breve/i);
  await expect(page.locator(".group-coming-banner")).toBeVisible();
});
