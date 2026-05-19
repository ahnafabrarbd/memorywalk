/**
 * Highlight bloom: pixels above ~240 luma bleed +/-1px with soft falloff.
 * Simulates sensor blooming on overexposed highlights.
 */
export function bloom(data: ImageData, threshold = 240): ImageData {
  const w = data.width;
  const h = data.height;
  const d = data.data;

  // Work on a copy so we don't compound bloom
  const src = new Uint8ClampedArray(d);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const luma = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];

      if (luma > threshold) {
        const excess = (luma - threshold) / (255 - threshold); // 0..1
        const bleedStrength = excess * 0.4; // soft falloff

        // Bleed to adjacent pixels (±1 in x and y)
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;

            const ni = (ny * w + nx) * 4;
            const dist = Math.sqrt(dx * dx + dy * dy); // 1 or ~1.41
            const falloff = bleedStrength / dist;

            for (let c = 0; c < 3; c++) {
              d[ni + c] = Math.min(
                255,
                d[ni + c] + (src[i + c] - d[ni + c]) * falloff,
              );
            }
          }
        }
      }
    }
  }

  return data;
}
