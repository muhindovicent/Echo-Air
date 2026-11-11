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
      page.getByText(/demonstration (catalogue|data)/i).first(),
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

  test("keeps the panel controls readable on the off-white surface", async ({
    page,
  }) => {
    await openShop(page);

    await page.getByRole("button", { name: /^filters$/i }).click();
    const panel = page.getByRole("dialog", { name: "Catalogue filters" });
    await expect(panel).toBeVisible();

    // Colours are resolved inside the browser so every CSS colour format
    // (rgb, oklab, color-mix) is handled the way it is actually painted.
    const results = await panel.evaluate((node) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const parse = (color: string) => {
        if (!context) return null;
        context.fillStyle = "#000000";
        context.fillStyle = color;
        const value = context.fillStyle;

        if (value.startsWith("#")) {
          const hex = value.slice(1);
          const full =
            hex.length === 3
              ? hex
                  .split("")
                  .map((char) => char + char)
                  .join("")
              : hex;
          const number = Number.parseInt(full, 16);
          return {
            r: (number >> 16) & 255,
            g: (number >> 8) & 255,
            b: number & 255,
            a: 1,
          };
        }

        const match = value.match(/rgba?\(([^)]+)\)/);
        if (!match) return null;
        const parts = match[1]
          .split(/[,\s/]+/)
          .filter(Boolean)
          .map(Number);
        return {
          r: parts[0],
          g: parts[1],
          b: parts[2],
          a: parts.length > 3 ? parts[3] : 1,
        };
      };

      const luminance = (color: { r: number; g: number; b: number }) => {
        const channel = (value: number) => {
          const scaled = value / 255;
          return scaled <= 0.03928
            ? scaled / 12.92
            : ((scaled + 0.055) / 1.055) ** 2.4;
        };
        return (
          0.2126 * channel(color.r) +
          0.7152 * channel(color.g) +
          0.0722 * channel(color.b)
        );
      };

      const panelColor = parse(getComputedStyle(node).backgroundColor);
      if (!panelColor) return [];

      /** The painted backdrop behind an element, compositing its ancestors. */
      const backdropOf = (element: Element) => {
        const layers: { r: number; g: number; b: number; a: number }[] = [];
        let current: Element | null = element;

        while (current && current !== document.body) {
          const background = parse(getComputedStyle(current).backgroundColor);
          if (background && background.a > 0) {
            layers.push(background);
            if (background.a === 1) break;
          }
          current = current.parentElement;
        }

        let result = { ...panelColor };
        for (let index = layers.length - 1; index >= 0; index -= 1) {
          const layer = layers[index];
          result = {
            r: layer.r * layer.a + result.r * (1 - layer.a),
            g: layer.g * layer.a + result.g * (1 - layer.a),
            b: layer.b * layer.a + result.b * (1 - layer.a),
            a: 1,
          };
        }
        return result;
      };

      const controls = Array.from(
        node.querySelectorAll<HTMLElement>("button, select, label, p, span"),
      ).filter((element) => element.getClientRects().length > 0);

      return controls.map((element) => {
        const style = getComputedStyle(element);
        const foreground = parse(style.color);
        if (!foreground) {
          return { text: element.textContent?.trim() ?? "", ratio: 0 };
        }

        // Composite any transparency over the painted backdrop.
        const background = backdropOf(element);
        const blended = {
          r: foreground.r * foreground.a + background.r * (1 - foreground.a),
          g: foreground.g * foreground.a + background.g * (1 - foreground.a),
          b: foreground.b * foreground.a + background.b * (1 - foreground.a),
        };

        const first = luminance(blended);
        const second = luminance(background);
        const lighter = Math.max(first, second);
        const darker = Math.min(first, second);

        return {
          text: (element.textContent ?? "").trim().slice(0, 40),
          ratio: Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100,
        };
      });
    });

    expect(results.length).toBeGreaterThan(0);

    const failures = results.filter((entry) => entry.ratio < 4.5);
    expect(
      failures,
      `low contrast: ${failures
        .map((entry) => `${entry.text} (${entry.ratio}:1)`)
        .join(", ")}`,
    ).toEqual([]);
  });

  test("returns focus to the Filters button when the panel closes", async ({
    page,
  }) => {
    await openShop(page);

    const toggle = page.getByRole("button", { name: /^filters$/i });
    await toggle.click();

    const panel = page.getByRole("dialog", { name: "Catalogue filters" });
    await expect(panel).toBeVisible();
    await expect(panel.locator(":focus")).toHaveCount(1);

    await page.keyboard.press("Escape");

    await expect(panel).toHaveCount(0);
    await expect(toggle).toBeFocused();
  });

  test("returns focus to the Filters button after choosing a category", async ({
    page,
  }) => {
    await openShop(page);

    const toggle = page.getByRole("button", { name: /^filters$/i });
    await toggle.click();

    const panel = page.getByRole("dialog", { name: "Catalogue filters" });
    await panel.locator("#panel-category-footwear").click();

    await expect(panel).toHaveCount(0);
    await expect(toggle).toBeFocused();
  });

  test("reaches search and the grid without scrolling far on mobile", async ({
    page,
  }) => {
    await openShop(page);

    const search = page.getByLabel("Search the catalogue");
    const filters = page.getByRole("button", { name: /^filters$/i });

    // The search field and the filter control are reachable in the first
    // viewport instead of below a long introduction.
    await expect(search).toBeInViewport();
    await expect(filters).toBeInViewport();

    const introHeight = await page
      .locator("h1")
      .evaluate((node) => node.getBoundingClientRect().bottom);
    expect(introHeight).toBeLessThan(420);
  });
});

test.describe("product page hierarchy", () => {
  test("shows the main image above the construction notes on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/shop/longform-overcoat");

    const stage = page.getByTestId("gallery-stage");
    const notes = page.getByText("Construction notes");

    await expect(stage).toBeVisible();
    await expect(notes).toBeAttached();

    const stageBox = await stage.boundingBox();
    const notesBox = await notes.boundingBox();

    expect(stageBox).not.toBeNull();
    expect(notesBox).not.toBeNull();
    expect(stageBox!.y).toBeLessThan(notesBox!.y);
  });

  test("keeps the image in the right column on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/shop/longform-overcoat");

    const stage = page.getByTestId("gallery-stage");
    const heading = page.getByRole("heading", { level: 1 });

    const stageBox = await stage.boundingBox();
    const headingBox = await heading.boundingBox();

    expect(stageBox).not.toBeNull();
    expect(headingBox).not.toBeNull();
    expect(stageBox!.x).toBeGreaterThan(headingBox!.x);
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
