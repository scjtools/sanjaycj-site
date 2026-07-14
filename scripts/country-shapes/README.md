# Country-shape generator

Rasterizes real coastline polygons (Natural Earth via
[georgique/world-geojson](https://github.com/georgique/world-geojson),
public domain) into the `#`/`.` pixel grids used by the About page's
country silhouettes in `src/components/About.astro`.

The grids are baked into `About.astro` as static strings — the site does
**not** depend on this script or the GeoJSON at build or run time. This
folder only exists so the shapes can be re-tuned later.

## Usage

```bash
node scripts/country-shapes/rasterize.mjs
```

It prints `#`/`.` grids for Mauritius, Malaysia and the UK. Copy the ones
you changed into the matching `*_CORE` arrays in `src/components/About.astro`.

## Tuning (top of `rasterize.mjs`)

- `BOX_H` — shared grid height all countries normalize to.
- Per-country `win: [lonMin, lonMax, latMin, latMax]` — geographic window
  (keeps a country to its real landmass, excludes far-flung territories).
- `keepFrac` — drops islands smaller than this fraction of the largest ring.
- `thresh` — supersample fill threshold (higher = smoother/more solid).
- `parts` — split a country into sub-shapes, each with its own `win`,
  `scale` (resize one landmass, e.g. Borneo at 0.8), and `shared: true`
  (parts share one scale so relative sizes are preserved, e.g. UK + Ireland).
- `partGap` — empty columns between parts (e.g. the Irish Sea width).

`SKY_CELL` in `About.astro` must match `HalftonePattern.astro`'s `SKY_CELL`.
