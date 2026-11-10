import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const OUT = path.join(process.cwd(), "docs", "screenshots");

/** Scrolls the page so lazy images load and scroll reveals have fired. */
async function settle(page: import("@playwright/test").Page) {
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let offset = 0; offset < height; offset += 500) {
    await page.evaluate((y) => window.scrollTo(0, y), offset);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

test.describe("review screenshots", () => {
  test.beforeAll(() => {
    if (!existsSync(OUT)) {
      mkdirSync(OUT, { recursive: true });
    }
  });

  for (const shot of [
    { name: "home-desktop-1440", width: 1440, height: 900 },
    { name: "home-tablet-768", width: 768, height: 1024 },
    { name: "home-mobile-375", width: 375, height: 812 },
  ]) {
    test(`captures ${shot.name}`, async ({ page }) => {
      await page.setViewportSize({ width: shot.width, height: shot.height });
      await page.goto("/");
      await settle(page);

      await page.screenshot({
        path: path.join(OUT, `${shot.name}.jpg`),
        fullPage: true,
        type: "jpeg",
        quality: 78,
      });

      await page.screenshot({
        path: path.join(OUT, `${shot.name}-fold.jpg`),
        type: "jpeg",
        quality: 78,
      });

      await expect(page.locator("h1")).toBeVisible();
    });
  }

  test("captures the mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await page.getByRole("button", { name: /menu/i }).click();
    await expect(page.getByRole("dialog", { name: "Site navigation" })).toBeVisible();

    await page.screenshot({
      path: path.join(OUT, "mobile-menu-375.jpg"),
      type: "jpeg",
      quality: 78,
    });
  });

  for (const shot of [
    { name: "shop-desktop-1440", width: 1440, height: 900 },
    { name: "shop-mobile-375", width: 375, height: 812 },
  ]) {
    test(`captures ${shot.name}`, async ({ page }) => {
      await page.setViewportSize({ width: shot.width, height: shot.height });
      await page.goto("/shop");
      await settle(page);

      await page.screenshot({
        path: path.join(OUT, `${shot.name}.jpg`),
        fullPage: true,
        type: "jpeg",
        quality: 78,
      });

      await page.screenshot({
        path: path.join(OUT, `${shot.name}-fold.jpg`),
        type: "jpeg",
        quality: 78,
      });

      await expect(page.getByTestId("product-grid")).toBeVisible();
    });
  }

  for (const shot of [
    { name: "product-desktop-1440", width: 1440, height: 900 },
    { name: "product-mobile-375", width: 375, height: 812 },
  ]) {
    test(`captures ${shot.name}`, async ({ page }) => {
      await page.setViewportSize({ width: shot.width, height: shot.height });
      await page.goto("/shop/longform-overcoat");
      await settle(page);

      await page.screenshot({
        path: path.join(OUT, `${shot.name}.jpg`),
        fullPage: true,
        type: "jpeg",
        quality: 78,
      });

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});
