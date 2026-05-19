/**
 * Color quantization to ~16bpp (5-6-5 RGB).
 * Reduces color depth to simulate a low-bit sensor.
 */
export function quantize(data: ImageData): ImageData {
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    // 5 bits red (32 levels), 6 bits green (64 levels), 5 bits blue (32 levels)
    d[i]     = (d[i]     >> 3) << 3;  // R: 5 bits
    d[i + 1] = (d[i + 1] >> 2) << 2;  // G: 6 bits
    d[i + 2] = (d[i + 2] >> 3) << 3;  // B: 5 bits
    // alpha unchanged
  }
  return data;
}
