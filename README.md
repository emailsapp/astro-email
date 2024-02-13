# astro-email

Integration for Astro to Generate HTML emails with React (react-email).

## Usage
```jsx
```javascript
import { defineConfig } from 'astro/config';
import email from 'astro-email';

// https://astro.build/config
export default defineConfig({
	integrations: [
		email({
			filename: '[name].html',
		}),
	],
});
``

