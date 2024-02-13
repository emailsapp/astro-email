import { defineConfig } from "astro/config";
import email from "astro-email";

// https://astro.build/config
export default defineConfig({
  integrations: [
    email({
      filename: "[name].html",
    }),
  ],
});
