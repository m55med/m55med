// Text is rendered as glyph outlines, not <text>. GitHub serves README images through a
// proxy that blocks external fonts, so this is the only way the spec's typefaces survive.
// Each glyph is defined once per SVG and placed with <use>, which keeps files small.
import fs from 'node:fs';
import opentype from 'opentype.js';

const ROOT = new URL('../../', import.meta.url);

function load(rel) {
  const buf = fs.readFileSync(new URL(rel, ROOT));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

const spaceGrotesk = (w) => load(`node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-${w}-normal.woff`);
const jetbrainsMono = (w) => load(`node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-${w}-normal.woff`);

export const F = {
  sg400: spaceGrotesk(400),
  sg500: spaceGrotesk(500),
  sg600: spaceGrotesk(600),
  sg700: spaceGrotesk(700),
  jb400: jetbrainsMono(400),
  jb500: jetbrainsMono(500),
  jb700: jetbrainsMono(700),
};
for (const [key, font] of Object.entries(F)) font.key = key;

// Cap height as a fraction of the font size, for vertically centering labels.
export const capHeight = (font) => font.tables.os2.sCapHeight / font.unitsPerEm;

const round = (n) => Math.round(n * 100) / 100;

function layout(str, font, size, ls) {
  const glyphs = font.stringToGlyphs(str);
  const scale = size / font.unitsPerEm;
  const xs = [];
  let x = 0;
  glyphs.forEach((g, i) => {
    xs.push(x);
    x += g.advanceWidth * scale;
    if (i < glyphs.length - 1) x += font.getKerningValue(g, glyphs[i + 1]) * scale + ls;
  });
  return { glyphs, xs, width: x };
}

export const measure = (str, font, size, ls = 0) => layout(str, font, size, ls).width;

export function wrap(str, font, size, maxWidth, ls = 0) {
  const lines = [];
  let line = '';
  for (const word of str.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(candidate, font, size, ls) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export class Typesetter {
  constructor(prefix) {
    this.prefix = prefix;
    this.glyphs = new Map();
  }

  glyphId(font, glyph) {
    const key = `${font.key}:${glyph.index}`;
    let entry = this.glyphs.get(key);
    if (!entry) {
      entry = { id: this.prefix + this.glyphs.size.toString(36), d: glyph.getPath(0, 0, 1000).toPathData(0) };
      this.glyphs.set(key, entry);
    }
    return entry.d ? entry.id : null;
  }

  // Returns { svg, width }. y is the baseline.
  text(str, { font, size, x = 0, y = 0, anchor = 'start', ls = 0, fill, opacity, cls }) {
    const { glyphs, xs, width } = layout(str, font, size, ls);
    const x0 = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
    const s = +(size / 1000).toFixed(5);
    const uses = glyphs
      .map((g, i) => {
        const id = this.glyphId(font, g);
        return id ? `<use href="#${id}" transform="matrix(${s} 0 0 ${s} ${round(x0 + xs[i])} ${round(y)})"/>` : '';
      })
      .join('');
    const attrs = [fill && `fill="${fill}"`, opacity != null && `opacity="${opacity}"`, cls && `class="${cls}"`]
      .filter(Boolean)
      .join(' ');
    return { svg: `<g ${attrs}>${uses}</g>`, width };
  }

  defs() {
    return [...this.glyphs.values()]
      .filter((e) => e.d)
      .map((e) => `<path id="${e.id}" d="${e.d}"/>`)
      .join('');
  }
}
