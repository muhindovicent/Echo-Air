import { expect, test } from "@playwright/test";

const MOBILE = { width: 375, height: 812 };

/** The toggle keeps a stable hook even when its label switches to "Close". */
const toggleButton = (page: import("@playwright/test").Page) =>
  page.locator('button[aria-controls="mobile-navigation"]');

test.describe("mobile menu", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await page.goto("/");
  });

  test("opens, traps focus, closes on Escape and restores scrolling", async ({
    page,
  }) => {
    const toggle = toggleButton(page);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toHaveAttribute("aria-controls", "mobile-navigation");
    await expect(toggle).toHaveAccessibleName(/menu/i);

    await toggle.click();

    const dialog = page.getByRole("dialog", { name: "Site navigation" });
    await expect(dialog).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(toggle).toHaveAccessibleName(/close/i);

    // Focus moves into the panel.
    await expect(dialog.locator(":focus")).toHaveCount(1);

    // The page behind the panel cannot scroll.
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(
      "hidden",
    );

    // Escape closes the panel and gives focus back to the toggle.
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
    await expect(toggle).toBeFocused();
  });

  test("closes when a navigation item is used and scrolls to the section", async ({
    page,
  }) => {
    await toggleButton(page).click();

    const dialog = page.getByRole("dialog", { name: "Site navigation" });
    await dialog.getByRole("link", { name: "Lookbook" }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page.locator("#lookbook")).toBeInViewport({ timeout: 10_000 });
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });

  test("returns focus to the toggle after the panel is closed", async ({
    page,
  }) => {
    const toggle = toggleButton(page);

    await toggle.click();
    const dialog = page.getByRole("dialog", { name: "Site navigation" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(":focus")).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(toggle).toBeFocused();
  });

  test("keeps tab focus inside the panel", async ({ page }) => {
    await toggleButton(page).click();
    const dialog = page.getByRole("dialog", { name: "Site navigation" });

    const focusables = await dialog.locator("a[href], button").count();
    expect(focusables).toBeGreaterThan(2);

    for (let i = 0; i < focusables + 2; i += 1) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => {
        const panel = document.getElementById("mobile-navigation");
        return !!panel && !!panel.contains(document.activeElement);
      });
      expect(inside).toBe(true);
    }
  });
});
