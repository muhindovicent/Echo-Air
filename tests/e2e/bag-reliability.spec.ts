import { expect, test, type Page } from "@playwright/test";

const PRODUCT = "/shop/longform-overcoat";

/** Seeds the bag directly in storage, bypassing the UI. */
async function seedBag(page: Page, entries: unknown) {
  await page.addInitScript((value) => {
    window.localStorage.setItem("echo-air:bag", JSON.stringify(value));
  }, entries);
}

test.describe("bag reliability", () => {
  test("adds the item synchronously so navigation cannot cancel it", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);

    // Click and navigate straight away: no pending state may swallow it.
    await page.getByTestId("add-to-bag").click();
    await page.goto("/bag");

    await expect(page.getByTestId("bag-line")).toHaveCount(1);
    await expect(page.getByTestId("bag-quantity")).toHaveText("1");
  });

  test("adds without an artificial pending state", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);

    const button = page.getByTestId("add-to-bag");
    await expect(button).toHaveAttribute("data-state", "idle");

    await button.click();

    // The item is in the bag immediately, with no intermediate state.
    await expect(button).toHaveAttribute("data-state", "added");
    await expect(page.getByTestId("bag-count")).toHaveText("1");
  });

  test("keeps every item when the button is clicked repeatedly", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);

    const button = page.getByTestId("add-to-bag");
    await button.click();
    await button.click();
    await button.click();

    await expect(page.getByTestId("bag-count")).toHaveText("3");

    await page.goto("/bag");
    await expect(page.getByTestId("bag-line")).toHaveCount(1);
    await expect(page.getByTestId("bag-quantity")).toHaveText("3");
  });

  test("announces the confirmation accessibly", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);

    await page.getByTestId("add-to-bag").click();

    const live = page.locator('[aria-live="polite"]', {
      hasText: /added to the demo bag/i,
    });
    await expect(live).toBeAttached();
    await expect(page.getByTestId("add-to-bag")).toHaveAccessibleName(
      /added to demo bag/i,
    );
  });

  test("returns to its idle label after the confirmation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);

    const button = page.getByTestId("add-to-bag");
    await button.click();
    await expect(button).toHaveAttribute("data-state", "added");

    await expect(button).toHaveAttribute("data-state", "idle", {
      timeout: 5000,
    });
  });
});

test.describe("quantity validation", () => {
  test("rejects invalid and non-finite stored quantities", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await seedBag(page, [
      // Not a number: rejected.
      { slug: "longform-overcoat", size: "M", colour: "black", quantity: NaN },
      // Infinite: rejected.
      {
        slug: "longform-overcoat",
        size: "L",
        colour: "black",
        quantity: Infinity,
      },
      // Not a number at all: rejected.
      {
        slug: "longform-overcoat",
        size: "S",
        colour: "black",
        quantity: "two",
      },
      // Below the minimum: clamped up to 1.
      { slug: "field-wide-trouser", size: "M", colour: "bone", quantity: 0 },
      // Above the maximum: clamped down to 99.
      {
        slug: "interval-runner",
        size: "41",
        colour: "tonal",
        quantity: 5000,
      },
      // A fraction: reduced to a whole number.
      {
        slug: "frame-tee",
        size: "M",
        colour: "black",
        quantity: 2.7,
      },
    ]);

    await page.goto("/bag");

    // Only the entries with a usable quantity survive.
    const lines = page.getByTestId("bag-line");
    await expect(lines).toHaveCount(3);

    await expect(
      page.getByRole("link", { name: "Field Wide Trouser" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Interval Runner" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Frame Tee" }),
    ).toBeVisible();

    const quantities = await page
      .getByTestId("bag-quantity")
      .allInnerTexts();
    expect(quantities).toContain("1");
    expect(quantities).toContain("99");
    expect(quantities).toContain("2");
  });

  test("stops at the maximum quantity and disables the control", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await seedBag(page, [
      {
        slug: "longform-overcoat",
        size: "M",
        colour: "black",
        quantity: 99,
      },
    ]);

    await page.goto("/bag");

    await expect(page.getByTestId("bag-quantity")).toHaveText("99");

    const increase = page.getByRole("button", { name: /increase quantity/i });
    await expect(increase).toBeDisabled();

    // Even a forced click cannot push the line past the maximum.
    await increase.click({ force: true });
    await expect(page.getByTestId("bag-quantity")).toHaveText("99");
  });

  test("removes the line when the quantity is reduced to nothing", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await seedBag(page, [
      { slug: "longform-overcoat", size: "M", colour: "black", quantity: 1 },
    ]);

    await page.goto("/bag");
    await expect(page.getByTestId("bag-line")).toHaveCount(1);

    await page.getByRole("button", { name: /^remove longform overcoat from the bag$/i }).click();
    await expect(page.getByTestId("bag-line")).toHaveCount(0);
    await expect(page.getByTestId("bag-empty")).toBeVisible();
  });
});

test.describe("bag layout on small screens", () => {
  for (const width of [320, 375]) {
    test(`keeps the line item readable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 720 });
      await page.goto(PRODUCT);

      await page.getByTestId("add-to-bag").click();
      await page.getByTestId("bag-button").click();

      const drawer = page.getByRole("dialog", { name: /demonstration bag/i });
      await expect(drawer).toBeVisible();

      const line = drawer.getByTestId("bag-line");
      await expect(line).toBeVisible();

      // The name, the remove action and the quantity controls all fit.
      const name = drawer.getByRole("link", { name: "Longform Overcoat" });
      const remove = drawer.getByRole("button", { name: /^remove/i });
      const increase = drawer.getByRole("button", { name: /increase quantity/i });

      for (const control of [name, remove, increase]) {
        const box = await control.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        expect(box!.height).toBeGreaterThan(0);
      }

      // The piece name is readable, not clipped into a sliver.
      const nameBox = await name.boundingBox();
      expect(nameBox!.width).toBeGreaterThan(40);

      // The interactive controls are comfortable touch targets.
      for (const control of [remove, increase]) {
        const box = await control.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(28);
      }

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(
        overflow.clientWidth + 1,
      );
    });
  }

  test("shows the bag page without overflow at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(PRODUCT);

    await page.getByTestId("add-to-bag").click();
    await page.goto("/bag");

    await expect(page.getByTestId("bag-line")).toHaveCount(1);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(
      overflow.clientWidth + 1,
    );
  });
});
