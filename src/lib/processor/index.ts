import { resize } from "./resize";
import { quantize } from "./quantize";
import { bayer } from "./bayer";
import { noise } from "./noise";
import { bloom } from "./bloom";
import { encode } from "./encode";

export interface ProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  noiseSigma?: number;
  bloomThreshold?: number;
  jpegQuality?: number;
}

/**
 * Process an image through the 0.3MP CMOS sensor emulation pipeline.
 *
 * Pipeline order (each step matters):
 * 1. Resize to fit 640×480 (bilinear)
 * 2. Color quantization to 16bpp (5-6-5 RGB)
 * 3. Bayer CFA mosaic → demosaic (color fringing)
 * 4. Sensor noise (Gaussian + shot noise + horizontal banding)
 * 5. Highlight bloom (bleed on bright pixels)
 * 6. JPEG compression at quality 60-70
 */
export async function processImage(
  file: File,
  opts: ProcessOptions = {},
): Promise<Blob> {
  const {
    maxWidth = 640,
    maxHeight = 480,
    noiseSigma = 6,
    bloomThreshold = 240,
    jpegQuality = 0.65,
  } = opts;

  const img = await loadImage(file);

  let data = resize(img, maxWidth, maxHeight);
  data = quantize(data);
  data = bayer(data);
  data = noise(data, noiseSigma);
  data = bloom(data, bloomThreshold);

  return encode(data, jpegQuality);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export { resize } from "./resize";
export { quantize } from "./quantize";
export { bayer } from "./bayer";
export { noise } from "./noise";
export { bloom } from "./bloom";
export { encode } from "./encode";
