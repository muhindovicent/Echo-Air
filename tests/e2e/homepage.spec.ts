import { expect, test } from "@playwright/test";

/** Every section the homepage is expected to render, with its anchor id. */
const SECTIONS = [
  { id: "top", heading: "Silence" },
  { id: "new-arrivals", heading: "First contact" },
  { id: "lookbook", heading: "Studies in shadow" },
  { id: "studio", heading: "Why Echo & Air" },
];

test.describe("homepage rendering", () => {
  test("renders the document shell and every section", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/Echo & Air/);

    // Landmarks
    await expect(page.locator("header")).toHaveCount(1);
    await expect(page.locator("main#main")).toHaveCount(1);
    await expect(page.locator("footer")).toHaveCount(1);

    // Exactly one h1, with the campaign headline
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText("Silence");

    for (const section of SECTIONS) {
      await expect(page.locator(`#${section.id}`)).toHaveCount(1);
    }

    await expect(
      page.getByRole("heading", { name: "First contact", level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Studies in shadow", level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Why Echo & Air", level: 2 }),
    ).toBeVisible();
  });

  test("labels the concept build instead of presenting a live store", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByText("Concept build — not a live store").first(),
    ).toBeVisible();

    const bodyText = (await page.locator("body").innerText()).toLowerCase();

    // No invented business details are published.
    expect(bodyText).not.toContain("hello@");
    expect(bodyText).not.toContain("forge lane");
    expect(bodyText).not.toContain("riverton");
    expect(bodyText).not.toContain("tel:");
    expect(bodyText).not.toContain("555");
  });

  test("has no dead or placeholder links", async ({ page }) => {
    await page.goto("/");

    const links = await page.locator("a").evaluateAll((nodes) =>
      nodes.map((node) => ({
        href: node.getAttribute("href") ?? "",
        target: node.getAttribute("target"),
        rel: node.getAttribute("rel"),
      })),
    );

    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      expect(link.href).not.toBe("");
      expect(link.href).not.toBe("#");
      expect(link.href).not.toMatch(/^#\s*$/);

      const hash = link.href.includes("#") ? link.href.split("#")[1] : "";
      if (hash) {
        // Both "/#section" and "#section" must resolve to a real element.
        await expect(page.locator(`#${hash}`)).toHaveCount(1);
      }

      if (link.target === "_blank") {
        expect(link.rel).toContain("noopener");
      }
    }
  });

  test("navigation anchors move to the right section", async ({ page }) => {
    await page.goto("/");

    for (const id of ["new-arrivals", "lookbook", "studio"]) {
      const desktopLink = page.locator(`header a[href="/#${id}"]`).first();

      if (await desktopLink.isVisible()) {
        await desktopLink.click();
      } else {
        // Narrow viewports expose the same links through the mobile menu.
        const toggle = page.locator('button[aria-controls="mobile-navigation"]');
        await toggle.click();
        const dialog = page.getByRole("dialog", { name: "Site navigation" });
        await dialog.locator(`a[href="/#${id}"]`).click();
      }

      const target = page.locator(`#${id}`);
      await expect(target).toBeInViewport({ timeout: 10_000 });
    }
  });

  test("reaches the catalogue from the homepage", async ({ page }) => {
    await page.goto("/");

    const shopLink = page.locator('header a[href="/shop"]').first();
    if (await shopLink.isVisible()) {
      await shopLink.click();
    } else {
      const toggle = page.locator('button[aria-controls="mobile-navigation"]');
      await toggle.click();
      await page
        .getByRole("dialog", { name: "Site navigation" })
        .locator('a[href="/shop"]')
        .click();
    }

    await expect(page).toHaveURL(/\/shop$/);
    await expect(
      page.getByRole("heading", { name: "The catalogue", level: 1 }),
    ).toBeVisible();
  });
});
