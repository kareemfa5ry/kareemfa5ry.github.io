// The closing contact section: email and LinkedIn links.
import { expect, test } from "@playwright/test";
import { LINKEDIN_URL, MAILTO } from "../../../src/site/contact";

test("the contact section links to the email and LinkedIn", async ({ page }) => {
  await page.goto("/");
  const contact = page.locator("#contact");
  await expect(contact.locator("h2")).toBeVisible();
  await expect(contact.locator('a[href^="mailto:"]')).toHaveAttribute("href", MAILTO);
  await expect(contact.locator(`a[href="${LINKEDIN_URL}"]`)).toBeVisible();
});
