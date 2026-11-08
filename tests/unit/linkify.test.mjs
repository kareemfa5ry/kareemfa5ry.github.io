// linkify (src/islands/chat/linkify.ts): URLs and emails become links, everything else stays text.
import assert from "node:assert/strict";
import { test } from "node:test";
import { linkify } from "../../src/islands/chat/linkify.ts";

test("linkify: plain text is one string", () => {
  assert.deepEqual(linkify("No links here."), ["No links here."]);
});

test("linkify: a URL mid-sentence is split out, trailing punctuation stays text", () => {
  assert.deepEqual(linkify("See https://www.linkedin.com/in/kareem-fakhry/, thanks"), [
    "See ",
    { href: "https://www.linkedin.com/in/kareem-fakhry/", text: "www.linkedin.com/in/kareem-fakhry" },
    ", thanks",
  ]);
});

test("linkify: an email becomes a mailto link", () => {
  assert.deepEqual(linkify("Write to a.b@example.com."), [
    "Write to ",
    { href: "mailto:a.b@example.com", text: "a.b@example.com" },
    ".",
  ]);
});

test("linkify: a PDF shows its file name without extension, underscores as spaces", () => {
  const [part] = linkify("https://x.github.io/cv/Kareem_Fakhry_CV_Senior_Data_Analyst.pdf");
  assert.equal(part.text, "Kareem Fakhry CV Senior Data Analyst");
});

test("linkify: HTML-looking text stays text", () => {
  assert.deepEqual(linkify("<script>alert(1)</script>"), ["<script>alert(1)</script>"]);
});
