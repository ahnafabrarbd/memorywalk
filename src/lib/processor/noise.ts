/**
 * Sensor noise simulation:
 * - Per-pixel Gaussian noise (sigma 4-8)
 * - Shot noise: darker areas get more noise
 * - Low-amplitude horizontal banding
 */

function gaussianRandom(): number {
  // Box-Muller transform
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function noise(data: ImageData, sigma = 6): ImageData {
  const w = data.width;
  const h = data.height;
  const d = data.data;

  // Pre-compute horizontal banding per row (low amplitude, ~2-4 intensity)
  const bandNoise = new Float32Array(h);
  for (let y = 0; y < h; y++) {
    bandNoise[y] = gaussianRandom() * 3;
  }

  for (let y = 0; y < h; y++) {
    const band = bandNoise[y];

    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;

      // Compute luma for shot noise scaling
      const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

      // Shot noise: darker pixels get more noise (inverse relationship)
      // Scale factor: 1.0 at luma=0, ~0.4 at luma=255
      const shotScale = 1.0 - 0.6 * (luma / 255);

      for (let c = 0; c < 3; c++) {
        const pixelNoise = gaussianRandom() * sigma * shotScale;
        d[i + c] = Math.max(0, Math.min(255, d[i + c] + pixelNoise + band));
      }
    }
  }

  return data;
}
