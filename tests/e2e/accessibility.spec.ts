import { expect, test } from "@playwright/test";

test.describe("media and accessibility", () => {
  test("every visible image loads and carries an alt attribute", async ({
    page,
  }) => {
    await page.goto("/");

    // Trigger lazy loading for the whole page.
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let offset = 0; offset < height; offset += 600) {
      await page.evaluate((y) => window.scrollTo(0, y), offset);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForLoadState("networkidle");

    const images = await page.locator("img").evaluateAll((nodes) =>
      nodes.map((node) => {
        const image = node as HTMLImageElement;
        return {
          src: image.currentSrc || image.src,
          alt: image.getAttribute("alt"),
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          visible: image.getClientRects().length > 0,
        };
      }),
    );

    expect(images.length).toBeGreaterThan(0);

    for (const image of images) {
      expect(image.alt).not.toBeNull();
      expect(image.src).not.toBe("");

      if (image.visible) {
        expect(
          image.complete && image.naturalWidth > 0,
          `image failed to load: ${image.src}`,
        ).toBe(true);
      }
    }

    // The concept art is explicitly labelled on screen.
    await expect(page.locator("figcaption", { hasText: "Concept" }).first()).toBeVisible();
  });

  test("exposes a working skip link and page landmarks", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    const skipLink = page.getByRole("link", { name: /skip to content/i });
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await skipLink.press("Enter");
    await expect(page.locator("#main")).toBeVisible();

    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);
  });

  test("uses a sane heading order and names every control", async ({ page }) => {
    await page.goto("/");

    const levels = await page
      .locator("h1, h2, h3, h4, h5, h6")
      .evaluateAll((nodes) =>
        nodes
          .filter((node) => node.getClientRects().length > 0)
          .map((node) => Number(node.tagName.slice(1))),
      );

    expect(levels[0]).toBe(1);
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
    }

    const unnamedButtons = await page
      .locator("button")
      .evaluateAll((nodes) =>
        nodes
          .filter((node) => {
            const label =
              node.getAttribute("aria-label") ??
              node.textContent?.trim() ??
              "";
            return label.length === 0;
          })
          .map((node) => node.outerHTML.slice(0, 80)),
      );

    expect(unnamedButtons).toEqual([]);
  });

  test("shows a visible focus indicator for keyboard users", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const outline = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) return null;
      const style = getComputedStyle(active);
      return { width: style.outlineWidth, style: style.outlineStyle };
    });

    expect(outline).not.toBeNull();
    expect(parseFloat(outline!.width)).toBeGreaterThan(0);
    expect(outline!.style).not.toBe("none");
  });

  test("honours prefers-reduced-motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");

    const scrollBehavior = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    );
    expect(scrollBehavior).toBe("auto");

    // Content that is revealed on scroll must already be visible.
    const revealState = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll("[data-reveal]"));
      return nodes.map((node) => ({
        opacity: Number(getComputedStyle(node).opacity),
        transition: getComputedStyle(node).transitionDuration,
      }));
    });

    expect(revealState.length).toBeGreaterThan(0);
    for (const node of revealState) {
      expect(node.opacity).toBe(1);
      expect(parseFloat(node.transition)).toBeLessThan(0.01);
    }

    await context.close();
  });
});
