import fs from "node:fs";

// Fit each country into a shared BOX (square cells), preserving each
// country's own aspect ratio; Malaysia (widest) fills the width, UK
// (tallest) fills the height. Matches the current ~34x27 chunky scale.
const BOX_W = 34;
const BOX_H = 28;

// These per-country GeoJSON files include far-flung outer islands and
// (for the UK) overseas territories spanning the whole globe, which would
// balloon the bounding box. Constrain each to its real geographic window,
// then keep rings above a fraction of the largest ring within that window.
//  - Mauritius: main island only (Rodrigues ~560km east excluded).
//  - Malaysia:  Peninsula + Malaysian Borneo (Sabah/Sarawak).
//  - UK:        Great Britain + Northern Ireland.
// thresh = fraction of a cell's supersampled points that must be inside
// land for the cell to fill (higher = smoother/more solid coastline).
const COUNTRIES = [
  { files: ["mauritius.json"], name: "MAURITIUS", keepFrac: 0.15, win: [57.0, 58.0, -20.6, -19.9], thresh: 3 / 9 },
  // Malaysia = Peninsula (full height) + Malaysian Borneo / Sabah &
  // Sarawak, drawn 20% smaller than the peninsula.
  {
    files: ["malaysia.json"],
    name: "MALAYSIA",
    keepFrac: 0.1,
    thresh: 3 / 9,
    parts: [
      { win: [99.0, 105.0, 0.8, 7.0], scale: 1.0 },
      { win: [108.5, 120.0, 0.0, 8.0], scale: 0.8 },
    ],
  },
  // British Isles as two parts so the Irish Sea gap is explicit:
  //  - Ireland island = Republic of Ireland (Ireland file) + Northern
  //    Ireland (UK file), both rings have centres west of -5.4.
  //  - Great Britain (the single big UK ring, centre ~-2°, so its western
  //    Scottish peninsulas stay attached).
  // partGap widened to ~2x the natural Irish Sea for visual separation.
  {
    files: ["united_kingdom.json", "ireland.json"],
    name: "UK",
    keepFrac: 0.05,
    thresh: 4 / 9,
    partGap: 9,
    parts: [
      { win: [-11.0, -5.4, 51.0, 55.6], scale: 1, shared: true },
      { win: [-5.6, 2.0, 49.9, 58.75], scale: 1, shared: true },
    ],
  },
];

function ringArea(ring) {
  // Shoelace (unsigned), in raw lon/lat degrees — only used for relative
  // comparison between rings of the same country, so units don't matter.
  let a = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function ringCenter(ring) {
  let mnx = Infinity, mxx = -Infinity, mny = Infinity, mxy = -Infinity;
  for (const [x, y] of ring) {
    if (x < mnx) mnx = x;
    if (x > mxx) mxx = x;
    if (y < mny) mny = y;
    if (y > mxy) mxy = y;
  }
  return [(mnx + mxx) / 2, (mny + mxy) / 2];
}

function ringsBBox(rings) {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const ring of rings)
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  // Equirectangular with latitude aspect correction so shapes aren't
  // stretched E-W the further they are from the equator.
  const midLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
  return { minLon, maxLon, minLat, maxLat, geoW: (maxLon - minLon) * Math.cos(midLat), geoH: maxLat - minLat };
}

// Rasterize one set of rings at an explicit degrees->cells `scale` (so
// several parts can share one scale and keep their true relative sizes),
// supersampled for smooth coastlines.
function rasterizeKept(kept, scale, thresh) {
  const { minLon, maxLon, minLat, maxLat, geoW, geoH } = ringsBBox(kept);
  const gw = Math.max(1, Math.round(geoW * scale));
  const gh = Math.max(1, Math.round(geoH * scale));

  const SUB = 3;
  const inside = (lon, lat) => kept.some((ring) => pointInRing(lon, lat, ring));

  const grid = [];
  for (let r = 0; r < gh; r++) {
    let row = "";
    for (let c = 0; c < gw; c++) {
      let hits = 0;
      for (let sr = 0; sr < SUB; sr++)
        for (let sc = 0; sc < SUB; sc++) {
          const lon = minLon + ((c + (sc + 0.5) / SUB) / gw) * (maxLon - minLon);
          const lat = maxLat - ((r + (sr + 0.5) / SUB) / gh) * (maxLat - minLat);
          if (inside(lon, lat)) hits++;
        }
      row += hits / (SUB * SUB) >= thresh ? "#" : ".";
    }
    grid.push(row);
  }
  return grid;
}

function trimColumns(grid) {
  // Remove leading/trailing fully-empty columns so a part's own sea margin
  // doesn't inflate the strait when composited.
  const w = grid[0].length;
  let lo = 0, hi = w - 1;
  const colEmpty = (c) => grid.every((row) => row[c] !== "#");
  while (lo <= hi && colEmpty(lo)) lo++;
  while (hi >= lo && colEmpty(hi)) hi--;
  return grid.map((row) => row.slice(lo, hi + 1));
}

// Composite several part-grids left-to-right, vertically centered, into a
// single grid `gap` empty columns apart.
function compositeParts(grids, gap = 3) {
  const trimmed = grids.map(trimColumns);
  const height = Math.max(...trimmed.map((g) => g.length));
  const rows = Array.from({ length: height }, () => "");
  trimmed.forEach((g, gi) => {
    const w = g[0].length;
    const top = Math.floor((height - g.length) / 2);
    for (let r = 0; r < height; r++) {
      const src = r - top;
      const cell = src >= 0 && src < g.length ? g[src] : ".".repeat(w);
      rows[r] += (gi > 0 ? ".".repeat(gap) : "") + cell;
    }
  });
  return rows;
}

function rasterize({ files, name, keepFrac, win, thresh, parts, partGap }) {
  // Each feature is a Polygon; take its outer ring. Multiple source files
  // (e.g. UK + Ireland) are merged into one pool of rings.
  const allRings = files
    .flatMap((file) => JSON.parse(fs.readFileSync(new URL(file, import.meta.url))).features)
    .map((f) => f.geometry.coordinates[0]);

  // A country is one or more "parts", each with its own geographic window.
  // Rings are kept if their centre falls in the part window and exceed a
  // fraction of the largest ring in that window.
  const partList = parts ?? [{ win, scale: 1 }];
  const kepts = partList.map((part) => {
    const [wLon0, wLon1, wLat0, wLat1] = part.win;
    const inWindow = allRings.filter((r) => {
      const [cx, cy] = ringCenter(r);
      return cx >= wLon0 && cx <= wLon1 && cy >= wLat0 && cy <= wLat1;
    });
    const maxArea = Math.max(...inWindow.map(ringArea));
    const frac = part.keepFrac ?? keepFrac;
    return inWindow.filter((r) => ringArea(r) >= frac * maxArea);
  });

  // Two scaling modes:
  //  - sharedScale (UK): every part uses ONE scale derived from the whole
  //    country's height, so parts keep their TRUE relative sizes (Ireland
  //    stays smaller than Great Britain); part.scale still nudges a part.
  //  - independent (Malaysia): each part is height-normalized on its own,
  //    so a part can be resized freely (Borneo at 0.8).
  const geoHs = kepts.map((k) => ringsBBox(k).geoH);
  const sharedRefScale = BOX_H / Math.max(...geoHs);
  const partGrids = kepts.map((kept, i) => {
    const partScale = partList[i].scale ?? 1;
    const scale = parts && partList.some((p) => p.shared)
      ? sharedRefScale * partScale
      : (BOX_H * partScale) / geoHs[i];
    return rasterizeKept(kept, scale, thresh);
  });

  return { name, grid: compositeParts(partGrids, partGap ?? 3) };
}

function despeckle(grid) {
  // Drop fully-isolated single cells (no orthogonal/diagonal neighbour).
  const h = grid.length, w = grid[0].length;
  const at = (r, c) => (r >= 0 && r < h && c >= 0 && c < w && grid[r][c] === "#" ? 1 : 0);
  return grid.map((row, r) =>
    row
      .split("")
      .map((ch, c) => {
        if (ch !== "#") return ".";
        let n = 0;
        for (let dr = -1; dr <= 1; dr++)
          for (let dc = -1; dc <= 1; dc++) if (dr || dc) n += at(r + dr, c + dc);
        return n === 0 ? "." : "#";
      })
      .join("")
  );
}

function collapseEmptyColumns(grid, maxGap) {
  // Trim leading/trailing empty columns and collapse any interior run of
  // fully-empty columns down to `maxGap` — so a country's width fits its
  // LAND, not big stretches of open sea (e.g. Malaysia's South China Sea
  // gap between the peninsula and Borneo becomes a narrow strait).
  const w = grid[0].length;
  const colEmpty = Array.from({ length: w }, (_, c) => grid.every((row) => row[c] !== "#"));
  const keep = [];
  let run = 0;
  for (let c = 0; c < w; c++) {
    if (colEmpty[c]) {
      run++;
      if (run <= maxGap) keep.push(c);
    } else {
      run = 0;
      keep.push(c);
    }
  }
  // Drop leading/trailing empty columns entirely.
  while (keep.length && colEmpty[keep[0]]) keep.shift();
  while (keep.length && colEmpty[keep[keep.length - 1]]) keep.pop();
  return grid.map((row) => keep.map((c) => row[c]).join(""));
}

const results = COUNTRIES.map(rasterize)
  .map((r) => ({ ...r, grid: despeckle(r.grid) }))
  .map((r) => ({ ...r, grid: collapseEmptyColumns(r.grid, 3) }));

for (const { name, grid } of results) {
  console.log(`\n// ${name}  (${grid[0].length} x ${grid.length})`);
  console.log(`const ${name}_CORE = [`);
  for (const row of grid) console.log(`  "${row}",`);
  console.log(`];`);
}
