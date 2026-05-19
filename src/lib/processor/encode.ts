/**
 * Encode ImageData to JPEG blob at specified quality.
 */
export function encode(data: ImageData, quality = 0.65): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(data, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("JPEG encoding failed"));
      },
      "image/jpeg",
      quality,
    );
  });
}
