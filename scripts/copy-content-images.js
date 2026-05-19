/**
 * Copies image files from content/walks/ to public/content-images/
 * so they can be served statically. Run before astro build.
 */
import { cpSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const SRC = "content/walks";
const DEST = "public/content-images";
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function copyImages(srcDir, destDir) {
  let count = 0;
  const entries = readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      count += copyImages(srcPath, destPath);
    } else if (IMAGE_EXTS.has(extname(entry.name).toLowerCase())) {
      cpSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

mkdirSync(DEST, { recursive: true });
const copied = copyImages(SRC, DEST);
console.log(`Copied ${copied} image(s) to ${DEST}`);
