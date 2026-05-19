/**
 * Bilinear resize to fit within 640×480, preserving aspect ratio.
 * Uses an offscreen canvas with imageSmoothingQuality "low" for bilinear (not lanczos).
 */
export function resize(
  source: HTMLImageElement | HTMLCanvasElement,
  maxW = 640,
  maxH = 480,
): ImageData {
  const srcW = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
  const srcH = source instanceof HTMLImageElement ? source.naturalHeight : source.height;

  const scale = Math.min(maxW / srcW, maxH / srcH, 1);
  const dstW = Math.round(srcW * scale);
  const dstH = Math.round(srcH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "low"; // bilinear, not lanczos
  ctx.drawImage(source, 0, 0, dstW, dstH);

  return ctx.getImageData(0, 0, dstW, dstH);
}
