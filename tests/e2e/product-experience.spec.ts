import { expect, test, type Page } from "@playwright/test";

/** A product with two frames of the same garment. */
const MULTI = "/shop/longform-overcoat";
/** A product with a single frame - no switching controls allowed. */
const SINGLE = "/shop/interval-runner";

async function stageImage(page: Page): Promise<string> {
  return page.getByTestId("gallery-stage").locator("img").first().evaluate(
    (node) => { const image = node as HTMLImageElement; return image.currentSrc || image.src; },
  );
}

test.describe("product gallery", () => {
  test("switches frames from the thumbnail rail", async ({ page }) => {
    await page.goto(MULTI);

    const stage = page.getByTestId("gallery-stage");
    await expect(stage).toHaveAttribute("data-views", "2");

    const rail = page.getByRole("group", { name: /frames$/i });
    await expect(rail).toBeVisible();

    const thumbnails = rail.getByRole("button");
    await expect(thumbnails).toHaveCount(2);
    await expect(thumbnails.nth(0)).toHaveAttribute("aria-pressed", "true");

    const first = await stageImage(page);
    await thumbnails.nth(1).click();

    await expect(thumbnails.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(thumbnails.nth(0)).toHaveAttribute("aria-pressed", "false");
    expect(await stageImage(page)).not.toBe(first);
  });

  test("switches frames with the arrow keys on the stage", async ({ page }) => {
    await page.goto(MULTI);

    const stage = page.getByTestId("gallery-stage");
    await stage.focus();

    const first = await stageImage(page);

    await page.keyboard.press("ArrowRight");
    expect(await stageImage(page)).not.toBe(first);

    await page.keyboard.press("ArrowLeft");
    expect(await stageImage(page)).toBe(first);
  });

  test("moves between thumbnails with the arrow keys", async ({ page }) => {
    await page.goto(MULTI);

    const rail = page.getByRole("group", { name: /frames$/i });
    const thumbnails = rail.getByRole("button");

    await thumbnails.nth(0).focus();
    await page.keyboard.press("ArrowRight");

    await expect(thumbnails.nth(1)).toBeFocused();
    await expect(thumbnails.nth(1)).toHaveAttribute("aria-pressed", "true");
  });

  test("opens the zoom view, switches frames and restores focus", async ({
    page,
  }) => {
    await page.goto(MULTI);

    const zoom = page.getByTestId("gallery-zoom");
    await zoom.click();

    const dialog = page.getByRole("dialog", { name: /full screen view/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(":focus")).toHaveCount(1);

    const zoomedBefore = await dialog
      .locator("img")
      .first()
      .evaluate((node) => { const image = node as HTMLImageElement; return image.currentSrc || image.src; });

    await page.keyboard.press("ArrowRight");
    const zoomedAfter = await dialog
      .locator("img")
      .first()
      .evaluate((node) => { const image = node as HTMLImageElement; return image.currentSrc || image.src; });
    expect(zoomedAfter).not.toBe(zoomedBefore);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(zoom).toBeFocused();
  });

  test("offers no switching controls for a single-frame product", async ({
    page,
  }) => {
    await page.goto(SINGLE);

    const stage = page.getByTestId("gallery-stage");
    await expect(stage).toHaveAttribute("data-views", "1");

    // No thumbnail rail, no frame counter and no group role.
    await expect(page.getByRole("group", { name: /frames$/i })).toHaveCount(0);
    await expect(page.getByText(/0\d \/ 0\d/)).toHaveCount(0);
    await expect(stage).not.toHaveAttribute("role", "group");

    // The zoom view still works but offers no frame navigation.
    await page.getByTestId("gallery-zoom").click();
    const dialog = page.getByRole("dialog", { name: /full screen view/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: /next/i })).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: /previous/i })).toHaveCount(
      0,
    );
  });

  test("shows no unrelated frames for a single-frame product", async ({
    page,
  }) => {
    await page.goto(SINGLE);

    const images = await page
      .getByTestId("gallery-stage")
      .locator("img")
      .evaluateAll((nodes) =>
        nodes.map(
          (node) => (node as HTMLImageElement).src,
        ),
      );

    expect(images).toHaveLength(1);
  });
});

test.describe("full screen view", () => {
  test("is labelled Full screen and offers no pixelated zoom", async ({
    page,
  }) => {
    await page.goto(MULTI);

    const action = page.getByTestId("gallery-zoom");
    await expect(action).toContainText("Full screen");
    await expect(action).not.toContainText("Zoom");

    await action.click();
    const dialog = page.getByRole("dialog", { name: /full screen view/i });
    await expect(dialog).toBeVisible();

    // The concept frames are low resolution, so no zoom control is offered.
    await expect(page.getByTestId("gallery-zoom-toggle")).toHaveCount(0);
    await expect(dialog.getByText(/source/i).first()).toBeVisible();
  });

  test("shows the complete frame without clipping or upscaling", async ({
    page,
  }) => {
    await page.goto(MULTI);
    await page.getByTestId("gallery-zoom").click();

    const dialog = page.getByRole("dialog", { name: /full screen view/i });
    await expect(dialog).toBeVisible();

    const frame = page.getByTestId("gallery-contain");
    await expect(frame).toBeVisible();

    // Wait until the frame has actually decoded before measuring it.
    await expect
      .poll(() =>
        frame.evaluate((node) => {
          const image = node.querySelector("img");
          return Boolean(image && image.complete && image.naturalWidth > 0);
        }),
      )
      .toBe(true);

    const metrics = await frame.evaluate((node) => {
      const image = node.querySelector("img") as HTMLImageElement;
      const box = node.getBoundingClientRect();
      return {
        objectFit: getComputedStyle(image).objectFit,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        renderedWidth: box.width,
        renderedHeight: box.height,
      };
    });

    // The complete image is shown: object-contain, no cropping.
    expect(metrics.objectFit).toBe("contain");

    // The natural aspect ratio is preserved, so nothing is cut off.
    const naturalAspect = metrics.naturalWidth / metrics.naturalHeight;
    const renderedAspect = metrics.renderedWidth / metrics.renderedHeight;
    expect(Math.abs(naturalAspect - renderedAspect)).toBeLessThan(0.02);

    // The frame is never blown up beyond its own resolution.
    expect(metrics.renderedWidth).toBeLessThanOrEqual(
      metrics.naturalWidth + 1,
    );
    expect(metrics.renderedHeight).toBeLessThanOrEqual(
      metrics.naturalHeight + 1,
    );
  });

  test("keeps the full screen view inside the viewport", async ({ page }) => {
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(MULTI);
      await page.getByTestId("gallery-zoom").click();

      const frame = page.getByTestId("gallery-contain");
      await expect(frame).toBeVisible();

      const box = await frame.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(-1);
      expect(box!.y).toBeGreaterThanOrEqual(-1);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(
        overflow.clientWidth + 1,
      );

      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("dialog", { name: /full screen view/i }),
      ).toHaveCount(0);
    }
  });
});

test.describe("phase references and content clarity", () => {
  test("no longer advertises Phase 01", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("header")).toContainText("Phase 03");
    await expect(page.locator("footer")).toContainText("Phase 03");
    await expect(page.locator("body")).not.toContainText("Phase 01");

    await expect(page).toHaveTitle(/Phase 03/);
  });

  test("explains that colourway labels do not change the photography", async ({
    page,
  }) => {
    await page.goto(MULTI);

    const colours = page.getByRole("radiogroup", { name: /colourway/i });
    await expect(colours).toBeVisible();
    await expect(colours).toContainText(/does not change the product photography/i);
    await expect(colours).toContainText(/not product variants/i);
  });

  test("keeps breathing room between the disclaimer and the selectors", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(MULTI);

    const disclaimer = page.getByText("Demonstration product").first();
    const sizeLegend = page
      .getByRole("radiogroup", { name: /size/i })
      .locator("legend");

    const disclaimerBox = await disclaimer.boundingBox();
    const legendBox = await sizeLegend.boundingBox();

    expect(disclaimerBox).not.toBeNull();
    expect(legendBox).not.toBeNull();

    const gap = legendBox!.y - (disclaimerBox!.y + disclaimerBox!.height);
    expect(gap).toBeGreaterThanOrEqual(16);
  });
});

test.describe("demonstration variants", () => {
  test("selects a size and a colourway", async ({ page }) => {
    await page.goto(MULTI);

    const sizes = page.getByRole("radiogroup", { name: /size/i });
    await expect(sizes).toBeVisible();
    await expect(sizes.getByRole("radio")).toHaveCount(3);

    const selected = page.getByTestId("selected-variants");
    await expect(selected).toContainText("size S");

    await sizes.getByRole("radio", { name: "L", exact: true }).check();
    await expect(selected).toContainText("size L");

    const colours = page.getByRole("radiogroup", { name: /colourway/i });
    await expect(colours.getByRole("radio")).toHaveCount(3);

    await colours.getByRole("radio", { name: "Bone" }).check();
    await expect(selected).toContainText("colourway label Bone");
  });

  test("changes the selection with the keyboard", async ({ page }) => {
    await page.goto(MULTI);

    const sizes = page.getByRole("radiogroup", { name: /size/i });
    await sizes.getByRole("radio", { name: "S", exact: true }).focus();
    await page.keyboard.press("ArrowRight");

    await expect(page.getByTestId("selected-variants")).toContainText("size M");
  });

  test("labels the variants as demonstration data", async ({ page }) => {
    await page.goto(MULTI);

    await expect(
      page.getByText(/demonstration labels only/i).first(),
    ).toBeVisible();

    const text = (await page.locator("main").innerText()).toLowerCase();
    expect(text).not.toContain("add to bag");
    expect(text).not.toContain("in stock");
    expect(text).not.toContain("only 2 left");
  });

  test("opens and closes the size guide dialog", async ({ page }) => {
    await page.goto(MULTI);

    const trigger = page.getByRole("button", { name: /size guide/i });
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: /size guide/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(":focus")).toHaveCount(1);

    // No garment measurements are invented.
    await expect(dialog.getByText("Not published").first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});

test.describe("wishlist", () => {
  test("saves a piece, shows the count and lists it", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(MULTI);

    await expect(page.getByTestId("wishlist-count")).toHaveCount(0);

    const save = page.getByTestId("wishlist-toggle");
    await save.click();

    await expect(save).toHaveAttribute("aria-pressed", "true");
    await expect(save).toContainText("Saved to wishlist");
    await expect(page.getByTestId("wishlist-count")).toHaveText("1");

    await page.getByTestId("wishlist-link").click();
    await expect(page).toHaveURL(/\/wishlist$/);
    await expect(
      page.getByRole("heading", { name: "Longform Overcoat" }),
    ).toBeVisible();
    await expect(page.getByText(/1 piece saved on this device/i)).toBeVisible();
  });

  test("keeps the saved piece across a reload", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(MULTI);

    await page.getByTestId("wishlist-toggle").click();
    await expect(page.getByTestId("wishlist-count")).toHaveText("1");

    await page.reload();

    await expect(page.getByTestId("wishlist-count")).toHaveText("1");
    await expect(page.getByTestId("wishlist-toggle")).toContainText(
      "Saved to wishlist",
    );
  });

  test("removes a piece and falls back to the empty state", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(MULTI);

    await page.getByTestId("wishlist-toggle").click();
    await page.getByTestId("wishlist-link").click();

    await expect(
      page.getByRole("heading", { name: "Longform Overcoat" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /remove longform overcoat/i }).click();

    await expect(page.getByTestId("wishlist-empty")).toBeVisible();
    await expect(page.getByTestId("wishlist-count")).toHaveCount(0);
  });

  test("shows an empty state on a first visit", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/wishlist");

    await expect(page.getByTestId("wishlist-empty")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /browse the catalogue/i }),
    ).toBeVisible();
  });

  test("clears the whole list", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(MULTI);
    await page.getByTestId("wishlist-toggle").click();

    await page.goto("/shop/field-wide-trouser");
    await page.getByTestId("wishlist-toggle").click();
    await expect(page.getByTestId("wishlist-count")).toHaveText("2");

    await page.getByTestId("wishlist-link").click();
    await page.getByRole("button", { name: /clear wishlist/i }).click();

    await expect(page.getByTestId("wishlist-empty")).toBeVisible();
    await expect(page.getByTestId("wishlist-count")).toHaveCount(0);
  });
});

test.describe("responsive product experience", () => {
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

      for (const path of [MULTI, SINGLE, "/wishlist", "/shop"]) {
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

  test("keeps the gallery usable on a small screen", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(MULTI);

    const stage = page.getByTestId("gallery-stage");
    await expect(stage).toBeVisible();

    const box = await stage.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(375);

    // The thumbnail rail scrolls instead of pushing the page sideways.
    const rail = page.getByRole("group", { name: /frames$/i });
    await expect(rail).toBeVisible();
  });
});
