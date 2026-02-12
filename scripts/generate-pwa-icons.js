/**
 * Generates all PWA and favicon PNGs from SVG.
 * Refs:
 * - Chrome install: https://web.dev/articles/install-criteria (192 + 512)
 * - iOS Add to Home Screen: https://web.dev/articles/codelab-apple-touch-icon (180)
 * - Lighthouse apple-touch-icon: https://developer.chrome.com/docs/lighthouse/pwa/apple-touch-icon
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');
const svgPath = join(iconsDir, 'icon-192.svg');

if (!existsSync(svgPath)) {
  console.warn('scripts/generate-pwa-icons.js: icon-192.svg not found, skipping.');
  process.exit(0);
}

if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

const svg = readFileSync(svgPath);

async function generate() {
  // Manifest icons (Chrome install / Android home screen)
  await sharp(svg).resize(192, 192).png().toFile(join(iconsDir, 'icon-192.png'));
  await sharp(svg).resize(512, 512).png().toFile(join(iconsDir, 'icon-512.png'));

  // iOS "Add to Home Screen" – must be in document root (web.dev/apple-touch-icon)
  await sharp(svg).resize(180, 180).png().toFile(join(publicDir, 'apple-touch-icon.png'));

  // Favicon 96x96 (index.html)
  await sharp(svg).resize(96, 96).png().toFile(join(publicDir, 'favicon-96x96.png'));

  console.log('Generated: icons/icon-192.png, icon-512.png, apple-touch-icon.png, favicon-96x96.png');
}

generate().catch((err) => {
  console.error('generate-pwa-icons failed:', err);
  process.exit(1);
});
