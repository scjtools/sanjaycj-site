# sanjaycj.com

Personal portfolio for Sanjay Joshi — solo builder, Mauritius. Static site, Astro + Tailwind CSS, zero backend.

## Local development

Requires Node 22+ (see `.nvmrc`).

```sh
nvm use          # if you use nvm
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to ./dist
npm run preview  # preview the production build
```

## Editing content

Copy and data live in `src/data/` — text and projects can be changed without touching components.

- **`src/data/site.ts`** — hero copy, About bio, experience/education, footer social links.
- **`src/data/workshop.ts`** — the project list (rendered on `/workshop`). `status` drives placement: `live`/`prototype` render as full cards, `idea` renders as a chip in the "Coming soon" row.

Tags are a free-form array, hand-picked per project (chips cycle red/green/blue). To add a project:

```ts
{
  name: "Project Name",
  url: "https://example.com",     // omit if there's no live link yet
  description: "One or two sentences.",
  status: "live",                 // "live" | "prototype" | "idea"
  tags: ["News", "AI", "Web"],
  sprite: "/sprites/hero-pal-01.png", // optional
  progress: 60,                   // optional — overrides the status default %
}
```

## Sprites

`public/sprites/` holds background-removed PNGs from the Palette Pals collection, used as animated accents (`sprite-float` in `global.css`). Naming groups them by where they appear: `hero-pal-*` (mascot shuffle), `about-pal-*` (per country), `<project>-pal-*` (project cards, e.g. `4minit-pal-*`, `0xguessr-pal-*`), `favicon-pal-01`.

## Design system

Tokens live in `src/styles/global.css` via Tailwind v4's `@theme` block — no `tailwind.config`. Dark canvas (`--color-bg`) with an RGB accent trio (`--color-red/green/blue`) from the mascot's indicator lights, plus a light-blue `--color-accent`. Pixelify Sans for headings and pixel labels, JetBrains Mono for body/UI. Hard 0px corners, offset-shadow buttons (`.pixel-btn`), segmented progress bars (`.pixel-bar`).

`HalftonePattern.astro` is the shared background/effect engine: a generated pixel field (star scatter, filler city, KL skyline landmarks) with pointer-repel physics and spark trails. The About page feeds it country silhouettes through the same pipeline; `scripts/country-shapes/rasterize.mjs` regenerates those grids from coastline polygons.

## Deployment

Static output from `npm run build`; deploy `./dist` to any static host (Vercel auto-detects Astro).
