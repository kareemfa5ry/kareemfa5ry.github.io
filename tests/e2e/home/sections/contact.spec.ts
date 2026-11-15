// The closing contact section: email, LinkedIn and WhatsApp links.
import { expect, test } from "@playwright/test";
import { LINKEDIN_URL, MAILTO, WHATSAPP_URL } from "../../../../src/site/contact";

test("the contact section links to the email, LinkedIn and WhatsApp", async ({ page }) => {
  await page.goto("/");
  const contact = page.locator("#contact");
  await expect(contact.locator("h2")).toBeVisible();
  await expect(contact.locator('a[href^="mailto:"]')).toHaveAttribute("href", MAILTO);
  await expect(contact.locator(`a[href="${LINKEDIN_URL}"]`)).toBeVisible();
  await expect(contact.locator(`a[href="${WHATSAPP_URL}"]`)).toBeVisible();
});

test("the contact section says relocation only once", async ({ page }) => {
  await page.goto("/");
  const text = (await page.locator("#contact").innerText()).toLowerCase();
  expect(text.split("relocation").length - 1).toBeLessThanOrEqual(1);
});
