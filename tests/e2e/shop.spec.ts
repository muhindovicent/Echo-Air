import { expect, test, type Page } from "@playwright/test";

const TOTAL = 12;

async function openShop(page: Page) {
  await page.goto("/shop");
  await expect(
    page.getByRole("heading", { name: "The catalogue", level: 1 }),
  ).toBeVisible();
}

function cardNames(page: Page) {
  return page.locator('[data-testid="product-grid"] h3').allInnerTexts();
}

/** Applies a category through the sidebar on desktop or the panel on mobile. */
async function selectCategory(page: Page, slug: string) {
  const desktop = page.locator(`#desktop-category-${slug}`);
  if (await desktop.isVisible()) {
    await desktop.click();
    return;
  }

  await page.getByRole("button", { name: /^filters$/i }).click();
  await page
    .getByRole("dialog", { name: "Catalogue filters" })
    .locator(`#panel-category-${slug}`)
    .click();
}

/** Applies a sort order through the sidebar on desktop or the panel on mobile. */
async function selectSort(page: Page, value: string) {
  const desktop = page.locator("#desktop-sort");

  if (await desktop.isVisible()) {
    await desktop.selectOption(value);
    return;
  }

  await page.getByRole("button", { name: /^filters$/i }).click();
  const panel = page.getByRole("dialog", { name: "Catalogue filters" });
  await panel.locator("#panel-sort").selectOption(value);
  await page.keyboard.press("Escape");
}

test.describe("catalogue", () => {
  test("renders the catalogue with every demonstration piece", async ({
    page,
  }) => {
    await openShop(page);

    await expect(page.getByTestId("result-count")).toHaveText(
      `${TOTAL} pieces`,
    );
    await expect(page.getByTestId("product-grid").locator("> li")).toHaveCount(
      TOTAL,
    );

    // The catalogue labels itself as demonstration data.
    await expect(
      page.getByText("Demonstration catalogue", { exact: false }).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/no pricing, stock, sizing, reviews or ordering/i).first(),
    ).toBeVisible();

    // No commercial information is published.
    const text = (await page.locator("body").innerText()).toLowerCase();
    expect(text).not.toContain("$");
    expect(text).not.toContain("£");
    expect(text).not.toContain("€");
    expect(text).not.toContain("add to bag");
    expect(text).not.toContain("in stock");
    expect(text).not.toContain("only ");
  });

  test("filters by search term and reports the count", async ({ page }) => {
    await openShop(page);

    await page.getByLabel("Search the catalogue").fill("denim");

    await expect(page.getByTestId("result-count")).toHaveText(
      /of 12 pieces/,
    );

    const names = await cardNames(page);
    expect(names.length).toBeGreaterThan(0);
    expect(names.length).toBeLessThan(TOTAL);
    for (const name of names) {
      expect(name.toLowerCase()).toContain("denim");
    }

    await page.getByLabel("Search the catalogue").fill("");
    await expect(page.getByTestId("result-count")).toHaveText(
      `${TOTAL} pieces`,
    );
    await expect(page.getByTestId("product-grid").locator("> li")).toHaveCount(
      TOTAL,
    );
  });

  test("filters by category and marks the active option", async ({ page }) => {
    await openShop(page);

    await selectCategory(page, "outerwear");

    await expect(page.getByTestId("result-count")).toHaveText("3 of 12 pieces");
    await expect(page.getByTestId("product-grid").locator("> li")).toHaveCount(
      3,
    );

    const categoryText = await page
      .getByTestId("product-grid")
      .innerText();
    expect(categoryText).toContain("Outerwear");
    expect(categoryText).not.toContain("Footwear");
  });

  test("sorts the catalogue", async ({ page }) => {
    await openShop(page);

    await selectSort(page, "name-asc");
    const ascending = await cardNames(page);
    expect(ascending).toEqual(
      [...ascending].sort((a, b) => a.localeCompare(b)),
    );

    await selectSort(page, "name-desc");
    const descending = await cardNames(page);
    expect(descending).toEqual([...ascending].reverse());

    await selectSort(page, "catalogue");
    const catalogue = await cardNames(page);
    expect(catalogue[0]).toBe("Longform Overcoat");
  });

  test("shows active filter indicators and clears them", async ({ page }) => {
    await openShop(page);

    await expect(page.getByTestId("active-filters")).toHaveCount(0);

    await page.getByLabel("Search the catalogue").fill("tee");
    await selectCategory(page, "jersey");

    const indicators = page.getByTestId("active-filters");
    await expect(indicators).toBeVisible();
    await expect(indicators).toContainText("Search: tee");
    await expect(indicators).toContainText("Category: Jersey");

    await indicators.getByRole("button", { name: /clear all/i }).click();

    await expect(page.getByTestId("active-filters")).toHaveCount(0);
    await expect(page.getByTestId("result-count")).toHaveText(
      `${TOTAL} pieces`,
    );
    await expect(page.getByLabel("Search the catalogue")).toHaveValue("");
  });

  test("shows a useful empty state and recovers from it", async ({ page }) => {
    await openShop(page);

    await page.getByLabel("Search the catalogue").fill("zzzzzz");

    await expect(page.getByTestId("empty-state")).toBeVisible();
    await expect(page.getByTestId("empty-state")).toContainText("zzzzzz");
    await expect(page.getByTestId("product-grid")).toHaveCount(0);

    await page
      .getByTestId("empty-state")
      .getByRole("button", { name: /clear filters/i })
      .click();

    await expect(page.getByTestId("empty-state")).toHaveCount(0);
    await expect(page.getByTestId("product-grid").locator("> li")).toHaveCount(
      TOTAL,
    );
  });

  test("keeps the filter state in the address bar", async ({ page }) => {
    await openShop(page);

    await page.getByLabel("Search the catalogue").fill("tee");
    await selectCategory(page, "jersey");

    await expect(page).toHaveURL(/q=tee/);
    await expect(page).toHaveURL(/category=jersey/);

    // A shared link restores the same view.
    await page.goto("/shop?category=outerwear");
    await expect(page.getByTestId("result-count")).toHaveText("3 of 12 pieces");
  });
});

test.describe("product preview", () => {
  test("opens a product preview from a card and returns to the catalogue", async ({
    page,
  }) => {
    await openShop(page);

    await page
      .getByTestId("product-grid")
      .locator("> li")
      .first()
      .getByRole("link")
      .click();

    await expect(page).toHaveURL(/\/shop\/[a-z0-9-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Longform Overcoat",
    );
    await expect(
      page.getByText("Demonstration product", { exact: false }).first(),
    ).toBeVisible();

    // No commercial information on the preview page.
    const text = (await page.locator("body").innerText()).toLowerCase();
    expect(text).not.toContain("add to bag");
    expect(text).not.toContain("$");
    expect(text).toContain("not for sale");

    await page.getByRole("link", { name: /back to the catalogue/i }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await expect(page.getByTestId("product-grid")).toBeVisible();
  });

  test("links to sibling pieces and a category view", async ({ page }) => {
    await page.goto("/shop/longform-overcoat");

    await page.getByRole("link", { name: /more outerwear/i }).click();
    await expect(page).toHaveURL(/category=outerwear/);
    await expect(page.getByTestId("result-count")).toHaveText("3 of 12 pieces");
  });

  test("shows the 404 page for an unknown piece", async ({ page }) => {
    await page.goto("/shop/not-a-real-piece");

    await expect(
      page.getByRole("heading", { name: "Nothing here", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /open the catalogue/i }),
    ).toBeVisible();

    // The route itself is not found: a direct request returns 404.
    const response = await page.request.get("/shop/not-a-real-piece");
    expect(response.status()).toBe(404);
  });
});

test.describe("catalogue on small screens", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("filters through the mobile panel", async ({ page }) => {
    await openShop(page);

    const toggle = page.getByRole("button", { name: /^filters$/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();

    const panel = page.getByRole("dialog", { name: "Catalogue filters" });
    await expect(panel).toBeVisible();
    await expect(page.locator("#panel-category-footwear")).toBeVisible();

    await panel.locator("#panel-category-footwear").click();

    await expect(panel).toHaveCount(0);
    await expect(page.getByTestId("result-count")).toHaveText("1 of 12 pieces");
    await expect(page.getByTestId("product-grid").locator("> li")).toHaveCount(
      1,
    );
  });

  test("closes the mobile panel with Escape", async ({ page }) => {
    await openShop(page);

    await page.getByRole("button", { name: /^filters$/i }).click();
    const panel = page.getByRole("dialog", { name: "Catalogue filters" });
    await expect(panel).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });
});

test.describe("catalogue layout", () => {
  for (const viewport of [
    { name: "mobile-375", width: 375, height: 812 },
    { name: "tablet-768", width: 768, height: 1024 },
    { name: "desktop-1440", width: 1440, height: 900 },
  ]) {
    test(`has no horizontal overflow at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      for (const path of ["/shop", "/shop/longform-overcoat"]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect(overflow.scrollWidth).toBeLessThanOrEqual(
          overflow.clientWidth + 1,
        );
      }
    });
  }

  test("loads every catalogue image", async ({ page }) => {
    await openShop(page);

    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let offset = 0; offset < height; offset += 600) {
      await page.evaluate((y) => window.scrollTo(0, y), offset);
      await page.waitForTimeout(100);
    }
    await page.waitForLoadState("networkidle");

    const broken = await page.locator("img").evaluateAll((nodes) =>
      nodes
        .map((node) => node as HTMLImageElement)
        .filter((image) => image.getClientRects().length > 0)
        .filter((image) => !image.complete || image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.src),
    );

    expect(broken).toEqual([]);
  });
});
