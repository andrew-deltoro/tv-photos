// scripts/make-manifest.mjs
//
// Rebuilds photos.json (touch to trigger a manifest run) at the repo root from the images in photos/.
// Entries use absolute raw.githubusercontent.com URLs so the TV can load
// them directly (raw.githubusercontent sends Access-Control-Allow-Origin: *).
//
// Run by .github/workflows/manifest.yml on every push that touches photos/.

import { readdirSync, writeFileSync, existsSync } from 'node:fs';

const DIR = 'photos';
const OUT = 'photos.json';
const REPO = process.env.REPO_SLUG || 'andrew-deltoro/tv-photos';
const BRANCH = process.env.REPO_BRANCH || 'main';
const EXTS = /\.(jpe?g|png|webp|avif|bmp|gif)$/i;

if (!existsSync(DIR)) {
  console.error(`No ${DIR} directory.`);
  process.exit(1);
}

const base = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/photos`;

const all = readdirSync(DIR).filter((f) => EXTS.test(f));

// Newest uploads (timestamped by the Shortcut) first, then the seeded
// starter photos in their intentional 01..12 order.
const isUpload = (f) => /^(IMG-)?\d{8}-\d{6}/.test(f);
const uploads = all.filter(isUpload).sort().reverse();
const seeds = all.filter((f) => !isUpload(f)).sort();

const files = [...uploads, ...seeds];

function titleFor(file) {
  const base = file
    .replace(EXTS, '')
    .replace(/^(IMG-)?\d{8}-\d{6}-?/, '')   // Shortcut timestamp
    .replace(/^\d{2}-/, '')          // starter numeric prefix
    .replace(/[-_]+/g, ' ')
    .trim();
  if (!base) return 'Photo';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

const items = files.map((file) => ({
  file: `${base}/${encodeURIComponent(file)}`,
  title: titleFor(file),
  author: '',
  licence: ''
}));

writeFileSync(OUT, JSON.stringify(items, null, 2) + '\n');
console.log(`wrote ${OUT} with ${items.length} photos`);
// (touch: verify manifest retry)
