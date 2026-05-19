/**
 * Bayer CFA simulation: mosaic then demosaic with bilinear interpolation.
 * Produces color fringing on high-contrast edges — the signature artifact.
 *
 * Bayer pattern (RGGB):
 *   R G R G ...
 *   G B G B ...
 *   R G R G ...
 *   G B G B ...
 */
export function bayer(data: ImageData): ImageData {
  const w = data.width;
  const h = data.height;
  const src = new Uint8ClampedArray(data.data);

  // Step 1: Mosaic — keep only the channel that the Bayer filter passes
  const mosaic = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const evenRow = y % 2 === 0;
      const evenCol = x % 2 === 0;

      if (evenRow && evenCol) {
        mosaic[y * w + x] = src[i]; // R
      } else if (evenRow && !evenCol) {
        mosaic[y * w + x] = src[i + 1]; // G
      } else if (!evenRow && evenCol) {
        mosaic[y * w + x] = src[i + 1]; // G
      } else {
        mosaic[y * w + x] = src[i + 2]; // B
      }
    }
  }

  // Step 2: Demosaic with bilinear interpolation
  const out = data.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const evenRow = y % 2 === 0;
      const evenCol = x % 2 === 0;

      if (evenRow && evenCol) {
        // R pixel: have R, need G and B
        out[i] = mosaic[y * w + x]; // R is known
        out[i + 1] = avgNeighbors4(mosaic, w, h, x, y); // G from NSEW
        out[i + 2] = avgDiagonal(mosaic, w, h, x, y); // B from diagonals
      } else if (evenRow && !evenCol) {
        // G pixel on R row: have G, need R and B
        out[i] = avgHorizontal(mosaic, w, h, x, y); // R from left/right
        out[i + 1] = mosaic[y * w + x]; // G is known
        out[i + 2] = avgVertical(mosaic, w, h, x, y); // B from top/bottom
      } else if (!evenRow && evenCol) {
        // G pixel on B row: have G, need R and B
        out[i] = avgVertical(mosaic, w, h, x, y); // R from top/bottom
        out[i + 1] = mosaic[y * w + x]; // G is known
        out[i + 2] = avgHorizontal(mosaic, w, h, x, y); // B from left/right
      } else {
        // B pixel: have B, need R and G
        out[i] = avgDiagonal(mosaic, w, h, x, y); // R from diagonals
        out[i + 1] = avgNeighbors4(mosaic, w, h, x, y); // G from NSEW
        out[i + 2] = mosaic[y * w + x]; // B is known
      }
      // alpha unchanged
    }
  }

  return data;
}

function safeGet(m: Float32Array, w: number, h: number, x: number, y: number): number {
  if (x < 0 || x >= w || y < 0 || y >= h) return -1;
  return m[y * w + x];
}

function avgNeighbors4(m: Float32Array, w: number, h: number, x: number, y: number): number {
  let sum = 0, count = 0;
  const n = safeGet(m, w, h, x, y - 1); if (n >= 0) { sum += n; count++; }
  const s = safeGet(m, w, h, x, y + 1); if (s >= 0) { sum += s; count++; }
  const e = safeGet(m, w, h, x + 1, y); if (e >= 0) { sum += e; count++; }
  const ww = safeGet(m, w, h, x - 1, y); if (ww >= 0) { sum += ww; count++; }
  return count > 0 ? sum / count : 0;
}

function avgDiagonal(m: Float32Array, w: number, h: number, x: number, y: number): number {
  let sum = 0, count = 0;
  const ne = safeGet(m, w, h, x + 1, y - 1); if (ne >= 0) { sum += ne; count++; }
  const nw = safeGet(m, w, h, x - 1, y - 1); if (nw >= 0) { sum += nw; count++; }
  const se = safeGet(m, w, h, x + 1, y + 1); if (se >= 0) { sum += se; count++; }
  const sw = safeGet(m, w, h, x - 1, y + 1); if (sw >= 0) { sum += sw; count++; }
  return count > 0 ? sum / count : 0;
}

function avgHorizontal(m: Float32Array, w: number, h: number, x: number, y: number): number {
  let sum = 0, count = 0;
  const l = safeGet(m, w, h, x - 1, y); if (l >= 0) { sum += l; count++; }
  const r = safeGet(m, w, h, x + 1, y); if (r >= 0) { sum += r; count++; }
  return count > 0 ? sum / count : 0;
}

function avgVertical(m: Float32Array, w: number, h: number, x: number, y: number): number {
  let sum = 0, count = 0;
  const t = safeGet(m, w, h, x, y - 1); if (t >= 0) { sum += t; count++; }
  const b = safeGet(m, w, h, x, y + 1); if (b >= 0) { sum += b; count++; }
  return count > 0 ? sum / count : 0;
}
