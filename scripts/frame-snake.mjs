// Wraps the Platane/snk output in the same card as the other activity cards. The snake
// travels through a margin around the dot grid; without a frame it looks like it escapes.
// Run after the snake step: node scripts/frame-snake.mjs
import fs from 'node:fs';
import { themes } from './lib/theme.mjs';
import { card } from './lib/svg.mjs';

const PAD = 16;

for (const t of Object.values(themes)) {
  const file = new URL(`../dist/snake-${t.name}.svg`, import.meta.url);
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes('data-framed')) continue;
  const open = src.match(/^<svg\b[^>]*>/)[0];
  const viewBox = open.match(/viewBox="([^"]+)"/)[1];
  const [, , w, h] = viewBox.split(/\s+/).map(Number);
  const inner = src.slice(open.length, src.lastIndexOf('</svg>'));
  const W = w + PAD * 2, H = h + PAD * 2;
  const c = card(t, { id: 'frame', w: W, h: H, accent: 'tri' });
  fs.writeFileSync(
    file,
    `<svg xmlns="http://www.w3.org/2000/svg" data-framed="1" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Contribution graph being eaten by a snake">` +
      `<defs>${c.defs}</defs>${c.svg}` +
      `<svg x="${PAD}" y="${PAD}" width="${w}" height="${h}" viewBox="${viewBox}">${inner}</svg></svg>`,
  );
}
console.log('snake framed');
