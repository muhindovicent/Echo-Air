import { expect, test, type Page } from "@playwright/test";

const PRODUCT = "/shop/longform-overcoat";
const SECOND_PRODUCT = "/shop/field-wide-trouser";

/** Adds the current demonstration selection and waits for the bag count. */
async function addToBag(page: Page, expectedCount: number) {
  await page.getByTestId("add-to-bag").click();
  await expect(page.getByTestId("add-to-bag")).toHaveAttribute(
    "data-state",
    "added",
  );
  await expect(page.getByTestId("bag-count")).toHaveText(String(expectedCount));
}

async function openDrawer(page: Page) {
  await page.getByTestId("bag-button").click();
  const drawer = page.getByRole("dialog", { name: /demonstration bag/i });
  await expect(drawer).toBeVisible();
  return drawer;
}

test.describe("demonstration bag", () => {
  test("adds a piece with its selected size and colour label", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);

    await expect(page.getByTestId("bag-count")).toHaveCount(0);

    await page
      .getByRole("radiogroup", { name: /size/i })
      .getByRole("radio", { name: "L", exact: true })
      .check();
    await page
      .getByRole("radiogroup", { name: /colourway/i })
      .getByRole("radio", { name: "Bone" })
      .check();

    await addToBag(page, 1);

    const drawer = await openDrawer(page);
    await expect(drawer.getByTestId("bag-line")).toHaveCount(1);
    await expect(drawer.getByRole("link", { name: "Longform Overcoat" })).toBeVisible();
    await expect(drawer.getByText(/Size L — Bone/)).toBeVisible();
    await expect(drawer.getByTestId("bag-quantity")).toHaveText("1");
  });

  test("combines identical selections into one line", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);

    await addToBag(page, 1);
    await addToBag(page, 2);

    const drawer = await openDrawer(page);
    await expect(drawer.getByTestId("bag-line")).toHaveCount(1);
    await expect(drawer.getByTestId("bag-quantity")).toHaveText("2");
  });

  test("keeps different selections on separate lines", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);

    await addToBag(page, 1);

    await page
      .getByRole("radiogroup", { name: /size/i })
      .getByRole("radio", { name: "M", exact: true })
      .check();
    await addToBag(page, 2);

    const drawer = await openDrawer(page);
    await expect(drawer.getByTestId("bag-line")).toHaveCount(2);
    await expect(drawer.getByText(/Size S/)).toBeVisible();
    await expect(drawer.getByText(/Size M/)).toBeVisible();
  });

  test("changes the quantity and removes a line", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);
    await addToBag(page, 1);

    const drawer = await openDrawer(page);

    await drawer
      .getByRole("button", { name: /increase quantity/i })
      .click();
    await expect(drawer.getByTestId("bag-quantity")).toHaveText("2");
    await expect(page.getByTestId("bag-count")).toHaveText("2");

    await drawer
      .getByRole("button", { name: /decrease quantity/i })
      .click();
    await expect(drawer.getByTestId("bag-quantity")).toHaveText("1");

    await drawer.getByRole("button", { name: /^remove/i }).click();
    await expect(drawer.getByTestId("bag-line")).toHaveCount(0);
    await expect(page.getByTestId("bag-count")).toHaveCount(0);
  });

  test("clears the whole bag", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);
    await addToBag(page, 1);

    await page.goto(SECOND_PRODUCT);
    await addToBag(page, 2);

    const drawer = await openDrawer(page);
    await expect(drawer.getByTestId("bag-line")).toHaveCount(2);

    await drawer.getByRole("button", { name: /clear bag/i }).click();
    await expect(drawer.getByTestId("bag-line")).toHaveCount(0);
    await expect(page.getByTestId("bag-count")).toHaveCount(0);
  });

  test("keeps the bag across a reload", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);
    await addToBag(page, 1);

    await page.reload();

    await expect(page.getByTestId("bag-count")).toHaveText("1");
    await expect(page.getByTestId("add-to-bag")).toHaveAttribute(
      "data-state",
      "idle",
    );
  });

  test("syncs the bag across tabs", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const first = await context.newPage();
    const second = await context.newPage();

    await first.goto(PRODUCT);
    await second.goto(PRODUCT);

    await first.getByTestId("add-to-bag").click();
    await expect(first.getByTestId("bag-count")).toHaveText("1");

    // The other tab receives the storage event and updates.
    await expect(second.getByTestId("bag-count")).toHaveText("1");

    await context.close();
  });

  test("drops entries that are not in the demonstration catalogue", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.addInitScript(() => {
      window.localStorage.setItem(
        "echo-air:bag",
        JSON.stringify([
          { slug: "not-a-piece", size: "M", colour: "black", quantity: 2 },
          { slug: "longform-overcoat", size: "XXXL", colour: "black", quantity: 1 },
          { slug: "longform-overcoat", size: "M", colour: "chartreuse", quantity: 1 },
          { slug: "longform-overcoat", size: "M", colour: "black", quantity: 1 },
        ]),
      );
    });

    await page.goto(PRODUCT);

    // Only the entry that matches a real piece, size and colour survives.
    await expect(page.getByTestId("bag-count")).toHaveText("1");

    const drawer = await openDrawer(page);
    await expect(drawer.getByTestId("bag-line")).toHaveCount(1);
    await expect(drawer.getByText(/Size M — Black/)).toBeVisible();
  });
});

test.describe("bag drawer", () => {
  test("is an accessible dialog that restores focus", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);
    await addToBag(page, 1);

    const button = page.getByTestId("bag-button");
    const drawer = await openDrawer(page);

    await expect(drawer).toHaveAttribute("aria-modal", "true");
    await expect(drawer.locator(":focus")).toHaveCount(1);

    // Tab stays inside the panel.
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => {
        const panel = document.getElementById("bag-drawer");
        return Boolean(panel && panel.contains(document.activeElement));
      });
      expect(inside).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(button).toBeFocused();
  });

  test("shows a designed empty state", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);

    const drawer = await openDrawer(page);
    await expect(drawer.getByText(/nothing in the bag/i)).toBeVisible();
    await expect(
      drawer.getByRole("link", { name: /browse the catalogue/i }),
    ).toBeVisible();
  });

  test("never shows prices, totals or a checkout", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);
    await addToBag(page, 1);

    const drawer = await openDrawer(page);
    const drawerText = (await drawer.innerText()).toLowerCase();

    // No commercial information is presented.
    for (const forbidden of [
      "$",
      "£",
      "€",
      "total",
      "subtotal",
      "in stock",
      "only ",
      "free shipping",
      "delivery cost",
    ]) {
      expect(drawerText).not.toContain(forbidden);
    }

    // No purchasing control of any kind.
    await expect(
      drawer.getByRole("button", { name: /checkout|place order|pay|buy/i }),
    ).toHaveCount(0);
    await expect(
      drawer.getByRole("link", { name: /checkout|place order|pay|buy/i }),
    ).toHaveCount(0);

    await page.goto("/bag");
    const pageText = (await page.locator("main").innerText()).toLowerCase();
    for (const forbidden of ["$", "total", "shipping", "delivery cost"]) {
      expect(pageText).not.toContain(forbidden);
    }
    await expect(
      page.getByRole("button", { name: /checkout|place order|pay|buy/i }),
    ).toHaveCount(0);
  });

  test("fits a phone screen without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(PRODUCT);
    await addToBag(page, 1);

    const drawer = await openDrawer(page);
    const box = await drawer.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(375);

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(
      overflow.clientWidth + 1,
    );
  });
});

test.describe("bag page", () => {
  test("lists the selections and offers removal", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(PRODUCT);
    await addToBag(page, 1);

    await page.goto("/bag");
    await expect(page.getByRole("heading", { name: "Your bag" })).toBeVisible();
    await expect(page.getByTestId("bag-line")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Longform Overcoat" })).toBeVisible();

    await page
      .getByRole("button", { name: /increase quantity/i })
      .click();
    await expect(page.getByTestId("bag-quantity")).toHaveText("2");

    await page.getByRole("button", { name: /^remove/i }).click();
    await expect(page.getByTestId("bag-empty")).toBeVisible();
  });

  test("shows an empty state on a first visit", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/bag");

    await expect(page.getByTestId("bag-empty")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /browse the catalogue/i }),
    ).toBeVisible();
  });

  test("has no horizontal overflow on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(PRODUCT);
    await addToBag(page, 1);
    await page.goto("/bag");

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(
      overflow.clientWidth + 1,
    );
  });
});
