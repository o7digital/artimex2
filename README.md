# Artimex Bakery — premium preview

Static integration of `masa-sol-premium-code.zip`. The HTML sections, scoped CSS, photographs, colors, layout and demonstration interactions are retained. The provisional name is replaced with Artimex Bakery in the original Italiana typography; the repository contains no existing brand logo.

Italiana and DM Sans (400, 500, 600) are hosted in `assets/fonts/` with their OFL licenses. No external font requests are needed. The box is a demonstration only, with no ordering or payment service.

## Local preview

Requires Node.js and Google Chrome for browser tests.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4174.

```sh
npm run build
npm test
npm run preview
```

The build copies only the public website into `dist/`. Tests run Chrome at 1440, 768, 390 and 320 pixels and verify images, fonts, overflow, navigation, the six-concha limit, counters, reset, surprise selection and console/network errors.

## Vercel preview

`vercel.json` configures a static build. After linking the Vercel project, publish a preview with:

```sh
vercel deploy --target preview
```

Production publication is a separate action after preview review.
