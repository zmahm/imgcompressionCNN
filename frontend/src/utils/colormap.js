/**
 * Viridis colormap approximation.
 * Input: t in [0, 1]
 * Output: [r, g, b] each in [0, 255]
 */
const VIRIDIS_STOPS = [
  [68,   1,  84],   // 0.0
  [72,  40, 120],   // 0.125
  [62,  74, 137],   // 0.25
  [49, 104, 142],   // 0.375
  [38, 130, 142],   // 0.5
  [53, 183, 121],   // 0.625
  [109, 205, 89],   // 0.75
  [180, 222, 44],   // 0.875
  [253, 231,  37],  // 1.0
];

export function viridisColor(t) {
  const n = VIRIDIS_STOPS.length - 1;
  const scaled = t * n;
  const lo = Math.floor(scaled);
  const hi = Math.min(lo + 1, n);
  const frac = scaled - lo;

  const [r0, g0, b0] = VIRIDIS_STOPS[lo];
  const [r1, g1, b1] = VIRIDIS_STOPS[hi];

  return [
    Math.round(r0 + (r1 - r0) * frac),
    Math.round(g0 + (g1 - g0) * frac),
    Math.round(b0 + (b1 - b0) * frac),
  ];
}

/**
 * Plasma colormap approximation.
 */
const PLASMA_STOPS = [
  [13,  8, 135],
  [84,  2, 163],
  [139,  10, 165],
  [185,  50, 137],
  [219,  92, 104],
  [244, 136,  73],
  [254, 188,  43],
  [240, 249,  33],
];

export function plasmaColor(t) {
  const n = PLASMA_STOPS.length - 1;
  const scaled = t * n;
  const lo = Math.floor(scaled);
  const hi = Math.min(lo + 1, n);
  const frac = scaled - lo;

  const [r0, g0, b0] = PLASMA_STOPS[lo];
  const [r1, g1, b1] = PLASMA_STOPS[hi];

  return [
    Math.round(r0 + (r1 - r0) * frac),
    Math.round(g0 + (g1 - g0) * frac),
    Math.round(b0 + (b1 - b0) * frac),
  ];
}

export function drawHeatmap(canvas, data2d, colorFn = viridisColor) {
  if (!canvas || !data2d || data2d.length === 0) return;

  const rows = data2d.length;
  const cols = data2d[0].length;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(cols, rows);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const [r, g, b] = colorFn(Math.max(0, Math.min(1, data2d[y][x])));
      const idx = (y * cols + x) * 4;
      imageData.data[idx]     = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
      imageData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
