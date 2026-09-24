// Shared SVG building blocks: the document wrapper, cards and chips.
import { LAYERS } from './theme.mjs';
import { F, capHeight, measure } from './type.mjs';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Freezes every animation and hides moving packets for visitors who ask for less motion.
export const REDUCED_MOTION =
  '@media (prefers-reduced-motion:reduce){*{animation:none!important}.pk{display:none}}';

export function doc({ w, h, title, desc, ts, defs = '', css = '', body }) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">`,
    `<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>`,
    css ? `<style>${css}</style>` : '',
    `<defs>${ts ? ts.defs() : ''}${defs}</defs>`,
    body,
    '</svg>',
  ].join('');
}

// Rounded surface card with a 3px accent on the top edge. accent: a layer name, 'tri' or null.
export function card(t, { id, w, h, r = 16, accent }) {
  let bar = '';
  if (accent === 'tri') {
    const seg = w / 3;
    bar = LAYERS.map((l, i) => `<rect x="${i * seg}" width="${seg}" height="3" fill="${t[l]}"/>`).join('');
  } else if (accent) {
    bar = `<rect width="${w}" height="3" fill="${t[accent]}"/>`;
  }
  return {
    defs: `<clipPath id="${id}"><rect width="${w}" height="${h}" rx="${r}"/></clipPath>`,
    svg:
      `<rect width="${w}" height="${h}" rx="${r}" fill="${t.surface}"/>` +
      (bar ? `<g clip-path="url(#${id})">${bar}</g>` : '') +
      `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${r - 0.5}" fill="none" stroke="${t.border}"/>`,
  };
}

// Technology chips (spec: h24, pad-x 9, r6, 10px JetBrains Mono 500), wrapping inside maxW.
export function chips(t, ts, labels, { x, y, maxW, layer, size = 10, gap = 6 }) {
  const stroke = layer && layer !== 'tri' ? t[layer] : t.border;
  const strokeOpacity = layer && layer !== 'tri' ? 0.45 : 1;
  const baseline = 12 + (size * capHeight(F.jb500)) / 2;
  let cx = x;
  let cy = y;
  let svg = '';
  for (const label of labels) {
    const w = Math.ceil(measure(label, F.jb500, size) + 18);
    if (cx > x && cx + w > x + maxW) {
      cx = x;
      cy += 24 + gap;
    }
    svg += `<rect x="${cx + 0.5}" y="${cy + 0.5}" width="${w - 1}" height="23" rx="6" fill="${t.surface2}" stroke="${stroke}" stroke-opacity="${strokeOpacity}"/>`;
    svg += ts.text(label, { font: F.jb500, size, x: cx + 9, y: cy + baseline, fill: t.muted }).svg;
    cx += w + gap;
  }
  return { svg, bottom: cy + 24 };
}

// Horizontal arrow drawn as a path (the fonts have no arrow glyph).
export const arrow = (x1, x2, y, color, sw = 1.5, cls = '') =>
  `<path${cls ? ` class="${cls}"` : ''} d="M${x1} ${y}H${x2 - 1}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" fill="none"/>` +
  `<path d="M${x2 - 5} ${y - 4}L${x2} ${y}L${x2 - 5} ${y + 4}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
