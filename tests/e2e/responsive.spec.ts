import { expect, test } from "@playwright/test";

/**
 * The layouts that matter most: the narrowest supported phone and a wide
 * desktop. Both must fit without a horizontal scrollbar.
 */
const VIEWPORTS = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "wide-1920", width: 1920, height: 1080 },
];

test.describe("responsive layout", () => {
  for (const viewport of VIEWPORTS) {
    test(`has no horizontal overflow at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/");

      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return {
          scrollWidth: root.scrollWidth,
          clientWidth: root.clientWidth,
          innerWidth: window.innerWidth,
        };
      });

      expect(overflow.scrollWidth).toBeLessThanOrEqual(
        overflow.clientWidth + 1,
      );
      expect(overflow.scrollWidth).toBeLessThanOrEqual(
        overflow.innerWidth + 1,
      );
    });
  }

  test("keeps the layout intact after scrolling the whole page", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let offset = 0; offset < height; offset += 400) {
      await page.evaluate((y) => window.scrollTo(0, y), offset);
      await page.waitForTimeout(60);
    }
    await page.evaluate(() => window.scrollTo(0, 0));

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });

  test("stacks the hero headline inside the viewport at 375px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const headline = page.locator("h1");
    const box = await headline.boundingBox();

    expect(box).not.toBeNull();
    // The headline itself must not be wider than the viewport.
    expect(box!.width).toBeLessThanOrEqual(375);
    await expect(headline).toBeVisible();
  });

  test("switches navigation between the desktop bar and the mobile menu", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /menu/i }),
    ).toBeHidden();

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
    await expect(page.getByRole("button", { name: /menu/i })).toBeVisible();
  });
});
