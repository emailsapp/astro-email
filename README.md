# astro-email

Integration for Astro to Generate HTML emails with React (react-email).

## Installation

```sh
npm i astro-email
```

## Usage

```javascript
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
```

### Development

```sh
npx astro dev
```

Development preview with live reload.

### Production

```sh
npx astro build
```

This will generate HTML files for each `.astro` file in the `src/pages` directory.
