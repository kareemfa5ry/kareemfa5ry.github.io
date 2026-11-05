import { expect, test } from "@playwright/test";

const PDFS = [
  "/assets/cv/Kareem_Fakhry_CV_Senior_Data_Analyst.pdf",
  "/assets/cv/Kareem_Fakhry_CV_Revenue_Pricing_Manager.pdf",
];

test("/llms.txt is plain text starting with the name", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/plain");
  expect(await response.text()).toMatch(/^# Kareem Fakhry/);
});

test("/resume.json parses and lists 4 work entries", async ({ request }) => {
  const resume = await (await request.get("/resume.json")).json();
  expect(resume.work).toHaveLength(4);
});

for (const path of PDFS) {
  test(`${path} is served as a PDF`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/pdf");
  });
}

test("/og.png is 1200x630", async ({ request }) => {
  const png = await (await request.get("/og.png")).body();
  // PNG header: 8-byte signature, then the IHDR chunk, whose width and height sit at bytes 16 and 20.
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
});
