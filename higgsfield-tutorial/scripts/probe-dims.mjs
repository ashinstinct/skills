import { readFileSync, readdirSync } from "fs";
import { join } from "path";

function getPngDims(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function getJpegDims(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0xd9) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = buf.readUInt16BE(i + 5);
      const width = buf.readUInt16BE(i + 7);
      return { width, height };
    }
    i += 2 + len;
  }
  return null;
}

const dir = join(import.meta.dirname, "..", "public", "images");
for (const file of readdirSync(dir).sort()) {
  const buf = readFileSync(join(dir, file));
  let dims;
  if (file.endsWith(".png")) dims = getPngDims(buf);
  else dims = getJpegDims(buf);
  console.log(file, dims, `ratio=${(dims.width / dims.height).toFixed(3)}`);
}
