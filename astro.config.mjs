import { defineConfig } from "astro/config";
import react from "@astrojs/react";

// Static output for the GitHub Pages user site; base path stays "/". React powers the islands in src/islands/.
export default defineConfig({
  site: "https://kareemfa5ry.github.io",
  integrations: [react()],
});
