import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OUT = path.resolve('public');

function svg(size) {
  const r = Math.round(size * 0.38);
  const cx = size / 2;
  const fontSize = Math.round(size * 0.26);
  const radius = Math.round(size * 0.22); // coins arrondis du fond
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#0c0c0f"/>
  <circle cx="${cx}" cy="${cx}" r="${r}" fill="#c8f542"/>
  <text x="${cx}" y="${cx}" font-family="Arial, Helvetica, sans-serif" font-weight="700"
    font-size="${fontSize}" fill="#0c0c0f" text-anchor="middle" dominant-baseline="central">PL</text>
</svg>`;
}

async function generate(size, name) {
  const buffer = Buffer.from(svg(size));
  await sharp(buffer).png().toFile(path.join(OUT, name));
  const { size: bytes } = fs.statSync(path.join(OUT, name));
  console.log(`${name} généré (${size}x${size}, ${bytes} bytes)`);
}

await generate(192, 'icon-192.png');
await generate(512, 'icon-512.png');
await generate(180, 'apple-touch-icon.png');
