// Builds every static README asset into assets/<name>-<theme>.svg.
// Run: npm run build
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { themes, LAYERS, accentColor } from './lib/theme.mjs';
import { F, Typesetter, measure, wrap, capHeight } from './lib/type.mjs';
import { FAMILIES, familyOf, lineIcon, iconSymbol, brand } from './lib/icons.mjs';
import { doc, card, chips, arrow, esc, REDUCED_MOTION } from './lib/svg.mjs';

// ASSETS_OUT lets the palette comparison build into a scratch folder.
const OUT = process.env.ASSETS_OUT
  ? pathToFileURL(path.resolve(process.env.ASSETS_OUT) + path.sep)
  : new URL('../assets/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });
// Start clean so removed content (e.g. a dropped repo card) doesn't linger in assets/.
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.svg')) fs.rmSync(new URL(f, OUT));
const sizes = [];
const write = (name, svg) => {
  fs.writeFileSync(new URL(name, OUT), svg);
  sizes.push([name, svg.length]);
};

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n) => Math.round(n * 100) / 100;

// ─── Hero ────────────────────────────────────────────────────────────────────
// The icon pattern tiles on a skewed lattice (A, B). The drift vector T is itself a
// lattice vector, so after one 45s cycle the pattern lands exactly where it started.
const HERO = { W: 1600, H: 480, A: 3200, B: [-560, 160], T: [560, -160], cycle: 45 };
const HOLE = { cx: 800, cy: 250, rx: 520, ry: 215 }; // quiet zone around the lockup

const NODES = {
  server: { x: 290, y: 250, s: 72, icon: 'server', layer: 'backend', label: 'API · SERVER', ly: 322 },
  db: { x: 170, y: 384, s: 60, icon: 'database', layer: 'backend', label: 'DATABASE', ly: 446 },
  web: { x: 800, y: 404, s: 64, icon: 'browser', layer: 'web', label: 'WEB', ly: 464 },
  mobile: { x: 1310, y: 250, s: 72, icon: 'phone', layer: 'mobile', label: 'MOBILE', ly: 322 },
};

const BUS = {
  serverWeb: 'M326 250C400 250 400 404 500 404L768 404',
  webMobile: 'M832 404L1100 404C1200 404 1200 250 1274 250',
  serverMobile: 'M326 250C400 250 400 404 500 404L1100 404C1200 404 1200 250 1274 250',
  serverDb: 'M254 250C200 250 170 290 170 354',
};

// Journeys: 3.8s, staggered by 1.2s, each on its own cycle so they never line up.
const PACKETS = [
  { path: BUS.serverWeb, layer: 'backend', travel: 3.8, cycle: 6.0, begin: 0 },
  { path: BUS.serverDb, layer: 'backend', travel: 1.6, cycle: 5.4, begin: 0.6 },
  { path: BUS.serverWeb, layer: 'web', travel: 3.8, cycle: 7.2, begin: 1.2, reverse: true },
  { path: BUS.webMobile, layer: 'mobile', travel: 3.8, cycle: 6.6, begin: 2.4, reverse: true },
  { path: BUS.webMobile, layer: 'web', travel: 3.8, cycle: 8.4, begin: 3.6 },
  { path: BUS.serverMobile, layer: 'mobile', travel: 5.0, cycle: 9.6, begin: 4.8, reverse: true },
];

const PULSE_TIMES = [2, 8, 8.6, 13.5, 19.5, 25, 31, 31.5, 36.5, 42];

function heroPattern() {
  const rand = rng(11);
  const [bx, by] = HERO.B;
  const images = [];
  for (const m of [-1, 0, 1]) for (const n of [-1, 0, 1]) images.push([m * HERO.A + n * bx, n * by]);
  const pts = [];
  for (let i = 0; i < 8000; i++) {
    const p = [rand() * HERO.A, rand() * by];
    if (pts.every((q) => images.every(([dx, dy]) => Math.hypot(p[0] - q[0] - dx, p[1] - q[1] - dy) >= 128))) pts.push(p);
  }
  const names = [...FAMILIES.backend, ...FAMILIES.web, ...FAMILIES.mobile, ...FAMILIES.domain];
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  const base = pts.map((p, i) => ({
    x: p[0],
    y: p[1],
    name: names[i % names.length],
    size: 30 + rand() * 10,
    rot: rand() < 0.35 ? Math.round(rand() * 24 - 12) : 0,
    tier: rand() < 0.6 ? 0 : 1,
  }));

  const instances = [];
  for (const p of base)
    for (let m = -2; m <= 2; m++)
      for (let n = -3; n <= 6; n++) {
        const x = p.x + m * HERO.A + n * bx;
        const y = p.y + n * by;
        if (x > -620 && x < 1660 && y > -60 && y < 700) instances.push({ ...p, x, y });
      }

  // Pick which instances pulse: a layer icon that is in open space at that moment.
  const clear = (x, y) =>
    x > 70 && x < 1530 && y > 50 && y < 430 &&
    Math.hypot((x - HOLE.cx) / HOLE.rx, (y - HOLE.cy) / HOLE.ry) > 1.08 &&
    Object.values(NODES).every((n) => Math.hypot(x - n.x, y - n.y) > 115);
  let last = '';
  for (const te of PULSE_TIMES) {
    const k = te / HERO.cycle;
    const pick = instances.find(
      (it) =>
        it.pulse == null && familyOf(it.name) !== 'domain' && it.name !== last &&
        clear(it.x + HERO.T[0] * k, it.y + HERO.T[1] * k) && rand() < 0.5,
    );
    if (pick) {
      pick.pulse = te;
      last = pick.name;
    }
  }
  return instances;
}

const PATTERN = heroPattern();

function hero(t) {
  const { W, H } = HERO;
  const ts = new Typesetter('g');
  const used = [...new Set(PATTERN.map((p) => p.name))];

  const pattern = PATTERN.map((p) => {
    const s = r2(p.size);
    const rot = p.rot ? ` transform="rotate(${p.rot} ${r2(p.x)} ${r2(p.y)})"` : '';
    const common = `href="#i-${p.name}" x="${r2(p.x - s / 2)}" y="${r2(p.y - s / 2)}" width="${s}" height="${s}" stroke-width="${r2(1.5 * 24 / s)}"${rot}`;
    if (p.pulse != null) {
      const fam = familyOf(p.name)[0];
      return `<use ${common} class="p${fam}" style="animation-delay:${p.pulse}s" stroke="${t.text}" opacity="${t.tiers[1]}"/>`;
    }
    return `<use ${common} stroke="${t.text}" opacity="${t.tiers[p.tier]}"/>`;
  }).join('');

  const pulseKeyframes = LAYERS.map((l) => {
    const base = `opacity:${t.tiers[1]};stroke:${t.text}`;
    return `.p${l[0]}{animation:p${l[0]} ${HERO.cycle}s linear infinite}` +
      `@keyframes p${l[0]}{0%,2.7%,100%{${base}}1.35%{opacity:.7;stroke:${t[l]}}}`;
  }).join('');

  const connectors = Object.values(BUS)
    .slice(0, 2)
    .concat(BUS.serverDb)
    .map((d) => `<path d="${d}" fill="none" stroke="${t.muted}" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`)
    .join('');

  const packets = PACKETS.map((p) => {
    const f = p.travel / p.cycle;
    const kp = p.reverse ? '1;0;0' : '0;1;1';
    const timing = `dur="${p.cycle}s" begin="${p.begin}s" repeatCount="indefinite"`;
    return `<g class="pk" opacity="0"><circle r="10" fill="${t[p.layer]}" opacity=".16"/><circle r="4.5" fill="${t[p.layer]}"/>` +
      `<animateMotion ${timing} path="${p.path}" keyPoints="${kp}" keyTimes="0;${f.toFixed(3)};1" calcMode="spline" keySplines=".45 0 .55 1;0 0 1 1"/>` +
      `<animate attributeName="opacity" ${timing} values="0;1;1;0;0" keyTimes="0;${(f * 0.08).toFixed(3)};${(f * 0.92).toFixed(3)};${f.toFixed(3)};1"/></g>`;
  }).join('');

  const nodes = Object.values(NODES).map((n) => {
    const h = n.s / 2;
    const label = ts.text(n.label, { font: F.jb500, size: 16, x: n.x, y: n.ly, anchor: 'middle', ls: 3, fill: t.muted });
    const plateW = label.width + 20;
    return `<rect x="${n.x - h}" y="${n.y - h}" width="${n.s}" height="${n.s}" rx="${n.s > 64 ? 14 : 12}" fill="${t.surface}" stroke="${t[n.layer]}" stroke-opacity=".6" stroke-width="1.5"/>` +
      lineIcon(n.icon, { x: n.x - n.s * 0.25, y: n.y - n.s * 0.25, size: n.s * 0.5, color: t[n.layer], sw: 2 }) +
      `<rect x="${r2(n.x - plateW / 2)}" y="${n.ly - 18}" width="${r2(plateW)}" height="26" rx="6" fill="${t.bg}" opacity=".85"/>` +
      label.svg;
  }).join('');

  // Emblem: three stacked isometric layers — server (top), web, mobile — drawn back to front.
  const rhombus = (cy) => `M800 ${cy - 22}L844 ${cy}L800 ${cy + 22}L756 ${cy}Z`;
  const emblem = [['mobile', 152, 0.7], ['web', 135, 0.35], ['backend', 118, 0]]
    .map(([l, cy, delay]) => `<path class="emb" style="animation-delay:${delay}s" d="${rhombus(cy)}" fill="${t.bg}" stroke="${t[l]}" stroke-width="2.5" stroke-linejoin="round" stroke-opacity=".6"/>`)
    .join('');

  const name = ts.text('MOHAMED AHMED', { font: F.sg700, size: 84, x: 800, y: 262, anchor: 'middle', ls: 2, fill: t.text });
  const title = ts.text('FULL-STACK PRODUCT ENGINEER', { font: F.jb500, size: 24, x: 800, y: 306, anchor: 'middle', ls: 4, fill: t.muted });

  const crop = [[24, 24, 1, 1], [W - 24, 24, -1, 1], [24, H - 24, 1, -1], [W - 24, H - 24, -1, -1]]
    .map(([x, y, sx, sy]) => `M${x} ${y + 16 * sy}V${y}H${x + 16 * sx}`)
    .join('');

  const css =
    `.drift{animation:drift ${HERO.cycle}s linear infinite}@keyframes drift{to{transform:translate(${HERO.T[0]}px,${HERO.T[1]}px)}}` +
    pulseKeyframes +
    '.emb{animation:emb 6s ease-in-out infinite}@keyframes emb{0%,30%,100%{stroke-opacity:.6}12%{stroke-opacity:1}}' +
    REDUCED_MOTION;

  const defs =
    used.map(iconSymbol).join('') +
    `<clipPath id="frame"><rect width="${W}" height="${H}" rx="18"/></clipPath>` +
    `<pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="${t.text}" stroke-opacity="${t.grid}"/></pattern>` +
    `<radialGradient id="lift" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${t.surface}" stop-opacity=".9"/><stop offset="1" stop-color="${t.surface}" stop-opacity="0"/></radialGradient>` +
    '<radialGradient id="hole" cx=".5" cy=".5" r=".5"><stop offset=".6" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>' +
    `<mask id="quiet" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><ellipse cx="${HOLE.cx}" cy="${HOLE.cy}" rx="${HOLE.rx}" ry="${HOLE.ry}" fill="url(#hole)"/></mask>`;

  const body =
    '<g clip-path="url(#frame)">' +
    `<rect width="${W}" height="${H}" fill="${t.bg}"/>` +
    `<rect width="${W}" height="${H}" fill="url(#grid)"/>` +
    `<ellipse cx="800" cy="240" rx="640" ry="260" fill="url(#lift)"/>` +
    `<g mask="url(#quiet)"><g class="drift">${pattern}</g></g>` +
    `<path d="${crop}" fill="none" stroke="${t.muted}" stroke-opacity=".35" stroke-width="1.5"/>` +
    connectors + packets + nodes + emblem + name.svg + title.svg +
    '</g>';

  return doc({
    w: W, h: H, ts, defs, css, body,
    title: 'Mohamed Ahmed — Full-Stack Product Engineer',
    desc: 'Animated banner: a drifting pattern of backend, web and mobile line icons, with data packets moving between a server, a database, a web dashboard and a mobile app.',
  });
}

// ─── Positioning line under the hero ────────────────────────────────────────
function positioning(t) {
  const W = 640, H = 176;
  const ts = new Typesetter('g');
  const l1 = ts.text('ONE ENGINEER.', { font: F.sg700, size: 36, x: W / 2, y: 46, anchor: 'middle', ls: 1.5, fill: t.text });
  const l2 = ts.text('THE WHOLE STACK.', { font: F.sg700, size: 36, x: W / 2, y: 90, anchor: 'middle', ls: 1.5, fill: t.text });

  const steps = [['BACKEND', 'backend'], ['WEB', 'web'], ['MOBILE', 'mobile'], ['INFRASTRUCTURE', 'tri']];
  const size = 13, ls = 1.5, gap = 36, y = 120, h = 34;
  const widths = steps.map(([label, l]) => (l === 'tri' ? 40 : 28) + measure(label, F.jb500, size, ls) + 14);
  let x = (W - widths.reduce((a, b) => a + b, 0) - gap * (steps.length - 1)) / 2;
  const baseline = y + h / 2 + (size * capHeight(F.jb500)) / 2;
  let body = l1.svg + l2.svg;
  steps.forEach(([label, l], i) => {
    const w = widths[i];
    const stroke = l === 'tri' ? t.muted : t[l];
    body += `<rect x="${r2(x + 0.5)}" y="${y + 0.5}" width="${r2(w - 1)}" height="${h - 1}" rx="9" fill="${t.surface}" stroke="${stroke}" stroke-opacity=".55"/>`;
    if (l === 'tri') body += LAYERS.map((ll, j) => `<circle cx="${r2(x + 14 + j * 8)}" cy="${y + h / 2}" r="3" fill="${t[ll]}"/>`).join('');
    else body += `<circle cx="${r2(x + 15)}" cy="${y + h / 2}" r="4" fill="${t[l]}"/>`;
    body += ts.text(label, { font: F.jb500, size, x: x + (l === 'tri' ? 40 : 28), y: baseline, ls, fill: t.text }).svg;
    x += w;
    if (i < steps.length - 1) {
      body += arrow(r2(x + 8), r2(x + gap - 8), y + h / 2, t.muted, 1.5, 'flow');
      x += gap;
    }
  });
  const css =
    '.flow{stroke-dasharray:3 5;animation:flow 1.2s linear infinite}@keyframes flow{from{stroke-dashoffset:16}to{stroke-dashoffset:0}}' +
    REDUCED_MOTION;
  return doc({
    w: W, h: H, ts, css, body,
    title: 'One engineer. The whole stack.',
    desc: 'Backend, then web, then mobile, then infrastructure.',
  });
}

// ─── Architecture mini-diagram (right of About) ─────────────────────────────
function architecture(t) {
  const W = 390, H = 300, LOOP = 4.5;
  const ts = new Typesetter('g');
  const c = card(t, { id: 'c', w: W, h: H, accent: 'tri' });
  const boxes = [
    { id: 'm', x: 20, layer: 'mobile', icon: 'phone', name: 'Mobile', tech: 'Flutter' },
    { id: 'a', x: 152, layer: 'backend', icon: 'server', name: 'API', tech: 'Laravel/Go' },
    { id: 'w', x: 284, layer: 'web', icon: 'browser', name: 'Web', tech: 'Next.js' },
  ];
  const by = 70, bw = 86, bh = 68;
  let body = c.svg;
  body += ts.text('SYSTEM MAP', { font: F.jb500, size: 10.5, x: 20, y: 36, ls: 2.5, fill: t.muted }).svg;
  body += ts.text('one request · every layer', { font: F.jb400, size: 10, x: W - 20, y: 36, anchor: 'end', fill: t.muted }).svg;

  const lanes = ['M106 94H152', 'M152 116H106', 'M238 94H284', 'M284 116H238', 'M180 138V169H152V200', 'M210 138V169H238V200'];
  body += lanes.map((d) => `<path d="${d}" fill="none" stroke="${t.muted}" stroke-opacity=".35" stroke-width="1.5" stroke-linejoin="round"/>`).join('');

  for (const b of boxes) {
    body += `<rect class="n${b.id}" x="${b.x + 0.75}" y="${by + 0.75}" width="${bw - 1.5}" height="${bh - 1.5}" rx="12" fill="${t.surface2}" stroke="${t[b.layer]}" stroke-width="1.5" stroke-opacity=".5"/>`;
    body += lineIcon(b.icon, { x: b.x + 12, y: by + 11, size: 18, color: t[b.layer], sw: 1.5 });
    body += ts.text(b.name, { font: F.sg600, size: 14, x: b.x + 12, y: by + 45, fill: t.text }).svg;
    body += ts.text(b.tech, { font: F.jb400, size: 10, x: b.x + 12, y: by + 58, fill: t.muted }).svg;
  }
  for (const [x, label] of [[113, 'Postgres'], [199, 'Redis']]) {
    body += `<rect class="nd" x="${x + 0.75}" y="200.75" width="76.5" height="38.5" rx="10" fill="${t.surface2}" stroke="${t.backend}" stroke-width="1.5" stroke-opacity=".5"/>`;
    body += ts.text(label, { font: F.sg600, size: 12.5, x: x + 39, y: 224.5, anchor: 'middle', fill: t.text }).svg;
  }

  // One request: mobile → API → data → dashboard → API → mobile, every 4.5s.
  const hops = [
    ['M106 94H152', 'mobile', 0.0, 0.55],
    ['M180 138V169H152V200', 'backend', 0.65, 1.2],
    ['M210 138V169H238V200', 'backend', 0.65, 1.2],
    ['M238 94H284', 'backend', 1.3, 1.85],
    ['M284 116H238', 'web', 1.95, 2.5],
    ['M152 116H106', 'backend', 2.6, 3.15],
  ];
  body += hops.map(([d, layer, s, e]) => {
    const a = (s / LOOP).toFixed(3), b = (e / LOOP).toFixed(3);
    const a2 = ((s + 0.08) / LOOP).toFixed(3), b2 = ((e - 0.08) / LOOP).toFixed(3);
    const timing = `dur="${LOOP}s" repeatCount="indefinite"`;
    return `<g class="pk" opacity="0"><circle r="6" fill="${t[layer]}" opacity=".2"/><circle r="3" fill="${t[layer]}"/>` +
      `<animateMotion ${timing} path="${d}" keyPoints="0;0;1;1" keyTimes="0;${a};${b};1" calcMode="spline" keySplines="0 0 1 1;.4 0 .6 1;0 0 1 1"/>` +
      `<animate attributeName="opacity" ${timing} values="0;0;1;1;0;0" keyTimes="0;${a};${a2};${b2};${b};1"/></g>`;
  }).join('');

  let lx = 20;
  for (const l of LAYERS) {
    body += `<circle cx="${lx + 3.5}" cy="272.5" r="3.5" fill="${t[l]}"/>`;
    const w = ts.text(l, { font: F.jb400, size: 10, x: lx + 12, y: 276, fill: t.muted });
    body += w.svg;
    lx += 12 + w.width + 18;
  }

  // Node glow when a packet arrives (percent of the 4.5s loop).
  const pulse = (name, hits) => {
    const stops = hits.map((p) => `${p}%`).join(',');
    const rest = ['0%', '100%', ...hits.flatMap((p) => [`${Math.max(p - 3, 0.1)}%`, `${p + 5}%`])].join(',');
    return `.n${name}{animation:n${name} ${LOOP}s linear infinite}@keyframes n${name}{${rest}{stroke-opacity:.5}${stops}{stroke-opacity:1}}`;
  };
  const css = pulse('a', [12.2, 55.6]) + pulse('d', [26.7]) + pulse('w', [41.1]) + pulse('m', [70]) + REDUCED_MOTION;

  return doc({
    w: W, h: H, ts, css, defs: c.defs, body,
    title: 'System map',
    desc: 'A request travels from the Flutter mobile app to the Laravel/Go API, into Postgres and Redis, out to the Next.js dashboard, and back to the app.',
  });
}

// ─── Section headings ───────────────────────────────────────────────────────
function heading(t, text) {
  const ts = new Typesetter('g');
  const size = 26;
  const W = Math.ceil(Math.max(measure(text, F.sg700, size), 72)) + 8;
  const shifted = ts.text(text, { font: F.sg700, size, x: W / 2, y: 30, anchor: 'middle', fill: t.text });
  const x0 = W / 2 - 36;
  const bar = LAYERS.map((l, i) => `<rect x="${x0 + i * 25}" y="40" width="22" height="3" rx="1.5" fill="${t[l]}"/>`).join('');
  return doc({ w: W, h: 48, ts, body: shifted.svg + bar, title: text, desc: `Section: ${text}` });
}

// ─── Numbers strip ──────────────────────────────────────────────────────────
function tile(t, { value, label, accent }) {
  const W = 196, H = 105;
  const ts = new Typesetter('g');
  const c = card(t, { id: 'c', w: W, h: H, r: 14, accent });
  const body = c.svg +
    ts.text(value, { font: F.sg700, size: 32, x: 18, y: 56, fill: t.text }).svg +
    ts.text(label, { font: F.jb500, size: 12, x: 18, y: 82, fill: t.muted }).svg;
  return doc({ w: W, h: H, ts, defs: c.defs, body, title: `${value} ${label}`, desc: `${value} ${label}` });
}

// ─── Stack cards ────────────────────────────────────────────────────────────
function stackCardHeight(group) {
  // Measured with a throwaway typesetter so every card in the grid gets the same height.
  const probe = chips(themes.dark, new Typesetter('x'), group.t2, { x: 20, y: 132, maxW: 360 });
  return probe.bottom + 20;
}

function stackCard(t, group, H) {
  const W = 400;
  const ts = new Typesetter('g');
  const c = card(t, { id: 'c', w: W, h: H, accent: group.accent });
  const ink = accentColor(t, group.accent);
  let body = c.svg;
  body += ts.text(group.label, { font: F.jb500, size: 12, x: 20, y: 34, ls: 2.5, fill: ink }).svg;
  const col = 360 / group.t1.length;
  group.t1.forEach(([slug, label], i) => {
    const cx = 20 + i * col + col / 2;
    body += `<rect x="${cx - 22 + 0.5}" y="50.5" width="43" height="43" rx="10" fill="${t.surface2}" stroke="${t.border}"/>`;
    body += brand(slug, { x: cx - 13, y: 59, size: 26, color: ink });
    body += ts.text(label, { font: F.jb500, size: 10.5, x: cx, y: 114, anchor: 'middle', fill: t.muted }).svg;
  });
  body += chips(t, ts, group.t2, { x: 20, y: 132, maxW: 360, layer: group.accent }).svg;
  const names = group.t1.map(([, l]) => l).concat(group.t2).join(', ');
  return doc({ w: W, h: H, ts, defs: c.defs, body, title: group.label, desc: names });
}

// ─── "What I build" category cards ──────────────────────────────────────────
const DESC = { font: F.sg400, size: 13.5, lh: 19 };

function categoryCard(t, cat, i, H) {
  const W = 400;
  const ts = new Typesetter('g');
  const c = card(t, { id: 'c', w: W, h: H, accent: cat.accent });
  const ink = accentColor(t, cat.accent);
  let body = c.svg;
  body += lineIcon(cat.icon, { x: 20, y: 22, size: 26, color: ink, sw: 1.75 });
  body += ts.text(String(i + 1).padStart(2, '0'), { font: F.jb500, size: 12, x: W - 20, y: 38, anchor: 'end', fill: t.muted }).svg;
  body += ts.text(cat.title, { font: F.sg600, size: 18, x: 20, y: 80, fill: t.text }).svg;
  wrap(cat.desc, DESC.font, DESC.size, 360).forEach((line, k) => {
    body += ts.text(line, { font: DESC.font, size: DESC.size, x: 20, y: 104 + k * DESC.lh, fill: t.muted }).svg;
  });
  body += chips(t, ts, cat.tech, { x: 20, y: H - 44, maxW: 360, layer: cat.accent }).svg;
  return doc({ w: W, h: H, ts, defs: c.defs, body, title: cat.title, desc: `${cat.desc} ${cat.tech.join(', ')}` });
}

// ─── "How I work" principle cards ───────────────────────────────────────────
function principleCard(t, p, H) {
  const W = 400;
  const ts = new Typesetter('g');
  const c = card(t, { id: 'c', w: W, h: H, accent: 'tri' });
  let body = c.svg;
  body += lineIcon(p.icon, { x: 20, y: 22, size: 22, color: t.text, sw: 1.6 });
  body += ts.text(p.title, { font: F.sg600, size: 17, x: 54, y: 39, fill: t.text }).svg;
  wrap(p.desc, DESC.font, DESC.size, 360).forEach((line, k) => {
    body += ts.text(line, { font: DESC.font, size: DESC.size, x: 20, y: 70 + k * DESC.lh, fill: t.muted }).svg;
  });
  return doc({ w: W, h: H, ts, defs: c.defs, body, title: p.title, desc: p.desc });
}

// ─── Public repository cards ────────────────────────────────────────────────
// Two public repos, so the cards share the 400px grid of the sections above.
const REPO_DESC = { font: F.sg400, size: 13.5, lh: 19, w: 360 };

function repoCard(t, repo, H) {
  const W = 400;
  const ts = new Typesetter('g');
  const c = card(t, { id: 'c', w: W, h: H, accent: repo.accent });
  const ink = accentColor(t, repo.accent);
  let body = c.svg;
  body += lineIcon('repo', { x: 20, y: 24, size: 18, color: t.muted, sw: 1.5 });
  body += ts.text(repo.name, { font: F.sg600, size: 17, x: 46, y: 39, fill: t.text }).svg;
  wrap(repo.desc, REPO_DESC.font, REPO_DESC.size, REPO_DESC.w).forEach((line, k) => {
    body += ts.text(line, { font: REPO_DESC.font, size: REPO_DESC.size, x: 20, y: 68 + k * REPO_DESC.lh, fill: t.muted }).svg;
  });
  body += chips(t, ts, repo.tech, { x: 20, y: H - 66, maxW: 360, layer: repo.accent }).svg;
  const cta = ts.text('View repository', { font: F.jb500, size: 11.5, x: 20, y: H - 18, fill: ink });
  body += cta.svg + arrow(r2(20 + cta.width + 8), r2(20 + cta.width + 22), H - 22, ink, 1.5);
  return doc({ w: W, h: H, ts, defs: c.defs, body, title: repo.name, desc: repo.desc });
}

// ─── Contact: booking button, email, social pills ───────────────────────────
// Simple Icons no longer ships LinkedIn, so draw a plain "in" tile.
const linkedinMark = (x, y, s, color, hole) =>
  `<g transform="translate(${x} ${y}) scale(${r2(s / 24)})"><rect x="1" y="1" width="22" height="22" rx="4" fill="${color}"/>` +
  `<path d="M6 10h3v8H6zM7.5 5.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5zM11 10h2.9v1.2c.4-.8 1.4-1.4 2.8-1.4 2.6 0 3.3 1.6 3.3 3.9V18h-3v-3.8c0-1-.2-1.9-1.4-1.9s-1.6.9-1.6 1.9V18h-3z" fill="${hole}"/></g>`;

function socialPill(t, s) {
  const H = 36;
  const ts = new Typesetter('g');
  const label = ts.text(s.label, { font: F.sg500, size: 13.5, x: 38, y: 23, fill: t.text });
  const W = Math.ceil(38 + label.width + 14);
  const icon = s.slug
    ? brand(s.slug, { x: 14, y: 10, size: 16, color: t.text })
    : linkedinMark(13, 9, 18, t.text, t.surface);
  const body =
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="10" fill="${t.surface}" stroke="${t.border}"/>` + icon + label.svg;
  return { svg: doc({ w: W, h: H, ts, body, title: s.label, desc: `${s.label}: ${s.url}` }), width: W };
}

function bookButton(t) {
  const H = 48;
  const ts = new Typesetter('g');
  const ink = t.name === 'dark' ? t.bg : '#FFFFFF';
  const label = ts.text('Book a call or consultation', { font: F.sg600, size: 15, x: 50, y: 30, fill: ink });
  const W = Math.ceil(50 + label.width + 44);
  const body =
    `<rect width="${W}" height="${H}" rx="12" fill="${t.backend}"/>` +
    lineIcon('calendar', { x: 18, y: 13, size: 22, color: ink, sw: 1.8 }) +
    label.svg + arrow(W - 34, W - 18, 24, ink, 1.8);
  return { svg: doc({ w: W, h: H, ts, body, title: 'Book a call or consultation', desc: 'Opens my booking calendar.' }), width: W };
}

function emailButton(t, email) {
  const H = 48;
  const ts = new Typesetter('g');
  const label = ts.text(email, { font: F.jb500, size: 14, x: 48, y: 29, fill: t.text });
  const W = Math.ceil(48 + label.width + 18);
  const body =
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.surface}" stroke="${t.border}"/>` +
    lineIcon('envelope', { x: 16, y: 13, size: 22, color: t.backend, sw: 1.8 }) + label.svg;
  return { svg: doc({ w: W, h: H, ts, body, title: email, desc: `Email ${email}` }), width: W };
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function footer(t) {
  const W = 320, H = 64;
  const ts = new Typesetter('g');
  let body = ts.text('Built end-to-end.', { font: F.sg500, size: 14, x: W / 2, y: 20, anchor: 'middle', fill: t.muted }).svg;
  // One sine wave, seen through three windows (backend, web, mobile), drifting one wavelength per 6s.
  const L = 20, A = 4, y0 = 44, x0 = 100, span = 120;
  let d = '';
  for (let x = 0; x <= span + L; x += 1) d += `${x ? 'L' : 'M'}${x0 + x} ${r2(y0 + A * Math.sin((2 * Math.PI * x) / L))}`;
  let defs = '';
  LAYERS.forEach((l, i) => {
    defs += `<clipPath id="w${i}"><rect x="${x0 + i * 40}" y="${y0 - 8}" width="40" height="16"/></clipPath>`;
    body += `<g clip-path="url(#w${i})"><path class="wave" d="${d}" fill="none" stroke="${t[l]}" stroke-width="1.75" stroke-linecap="round"/></g>`;
  });
  const css = `.wave{animation:wave 6s linear infinite}@keyframes wave{to{transform:translateX(-${L}px)}}` + REDUCED_MOTION;
  return doc({ w: W, h: H, ts, defs, css, body, title: 'Built end-to-end.', desc: 'Backend. Web. Mobile. Production.' });
}

// ─── Content ────────────────────────────────────────────────────────────────
const HEADINGS = {
  stack: 'The Stack',
  build: 'What I build',
  work: 'How I work',
  public: 'Public work',
  activity: 'Activity',
  connect: 'Let’s build.',
};

const TILES = [
  { id: 'commits', value: '2,500+', label: 'commits', accent: 'backend' },
  { id: 'contributions', value: '1,400+', label: 'contributions in 2026', accent: 'web' },
  { id: 'languages', value: '8', label: 'production languages', accent: 'mobile' },
  { id: 'platforms', value: '6', label: 'platforms shipped', accent: 'tri' },
];

const STACK = [
  { id: 'backend', label: 'BACKEND', accent: 'backend',
    t1: [['Laravel', 'Laravel'], ['Php', 'PHP'], ['Python', 'Python'], ['Go', 'Go'], ['Postgresql', 'Postgres'], ['Redis', 'Redis']],
    t2: ['FastAPI', 'Octane', 'Reverb', 'Sanctum', 'Queues', 'WebSockets', 'REST APIs', 'MySQL'] },
  { id: 'web', label: 'WEB', accent: 'web',
    t1: [['Typescript', 'TypeScript'], ['Nextdotjs', 'Next.js'], ['React', 'React'], ['Tailwindcss', 'Tailwind'], ['Shadcnui', 'shadcn'], ['Javascript', 'JavaScript']],
    t2: ['TanStack Query', 'Zustand', 'Zod', 'Tiptap', 'next-intl · RTL', 'Storybook'] },
  { id: 'mobile', label: 'MOBILE', accent: 'mobile',
    t1: [['Flutter', 'Flutter'], ['Dart', 'Dart'], ['Firebase', 'Firebase'], ['Android', 'Android'], ['Apple', 'iOS'], ['Swift', 'Swift']],
    t2: ['Riverpod', 'go_router', 'Dio', 'In-app purchases', 'Push (FCM)', 'React Native · Expo'] },
  { id: 'data', label: 'DATA & AI', accent: 'backend',
    t1: [['Python', 'Python'], ['Fastapi', 'FastAPI'], ['Celery', 'Celery'], ['Pydantic', 'Pydantic'], ['Googlegemini', 'Gemini'], ['Sqlalchemy', 'SQLAlchemy']],
    t2: ['httpx', 'BeautifulSoup', 'Proxy pools', 'Meilisearch', 'Whisper', 'Claude', 'Speechmatics'] },
  { id: 'devops', label: 'DEVOPS', accent: 'tri',
    t1: [['Docker', 'Docker'], ['Nginx', 'Nginx'], ['Githubactions', 'Actions'], ['Linux', 'Linux'], ['Git', 'Git'], ['Cloudflare', 'Cloudflare']],
    t2: ['Docker Compose', 'Caddy', 'GHCR', 'VPS', 'mTLS', 'gitleaks', 'semgrep'] },
  { id: 'more', label: 'ALSO IN PRODUCTION', accent: 'tri',
    // Ordered so long labels never sit side by side in the 60px columns.
    t1: [['Dotnet', '.NET 9'], ['Googlechrome', 'Chrome ext'], ['Nestjs', 'NestJS'], ['Nodedotjs', 'Node.js'], ['Socketdotio', 'Socket.IO'], ['Graphql', 'GraphQL']],
    t2: ['Prisma', 'TypeORM', 'Leaflet · OSRM', 'Telegram', 'WhatsApp API', 'Twilio'] },
];

const CATEGORIES = [
  { id: 'mobility', icon: 'car', accent: 'backend', title: 'Mobility & Ride-Hailing',
    desc: 'Voice-first booking, dispatch integrations, corporate ride accounts, wallets and fleet operations.',
    tech: ['Go', 'Laravel', 'Next.js', 'PostgreSQL'] },
  { id: 'operations', icon: 'building', accent: 'web', title: 'Enterprise Operations',
    desc: 'HR, support, onboarding, knowledge bases, reports, real-time communication and mobile workflows.',
    tech: ['Laravel', 'Next.js', 'Flutter', 'Redis'] },
  { id: 'logistics', icon: 'package', accent: 'tri', title: 'Logistics SaaS',
    desc: 'White-label logistics platforms with operations dashboards, driver apps, QR/OTP delivery and settlement.',
    tech: ['Laravel', 'Next.js', 'Flutter', 'PostgreSQL'] },
  { id: 'jobs', icon: 'briefcase', accent: 'tri', title: 'Job & Freelance Platforms',
    desc: 'Large-scale aggregation, matching, notifications and SEO infrastructure across hundreds of thousands of pages.',
    tech: ['Laravel', 'Next.js', 'Flutter', 'Python'] },
  { id: 'infrastructure', icon: 'shield', accent: 'backend', title: 'Infrastructure',
    desc: 'Identity, authentication, mail, payments, messaging, webhooks and provider failover systems.',
    tech: ['Laravel', 'FastAPI', 'Redis', 'Docker'] },
  { id: 'speech', icon: 'mic', accent: 'mobile', title: 'Speech & Voice AI',
    desc: 'Arabic speech processing, transcription, captions and multi-provider AI failover.',
    tech: ['FastAPI', 'Flutter', 'Swift', 'Speech AI'] },
];

const PRINCIPLES = [
  { id: 'spec', icon: 'spec', title: 'Spec-first',
    desc: 'Define the product and API contract before implementation, then enforce important contracts with tests in CI.' },
  { id: 'production', icon: 'rocket', title: 'Production-first',
    desc: 'Dockerized services, automated deployment, observability and the infrastructure required to actually run the product.' },
  { id: 'security', icon: 'lock', title: 'Security by design',
    desc: 'Authentication, tenant isolation, signed webhooks, rate limiting, auditability and security checks belong in the engineering workflow.' },
  { id: 'ai', icon: 'cpu', title: 'AI-native, engineer-owned',
    desc: 'AI coding agents accelerate implementation and review; architecture, verification and production responsibility remain human-owned.' },
];

const REPOS = [
  { id: 'pdfmasterpro', name: 'PDFMasterPro', accent: 'web',
    desc: 'Offline PDF toolkit for Chrome: merge, split, compress, OCR and watermark, in Arabic, English and French.',
    tech: ['JavaScript', 'pdf.js', 'Tesseract'] },
  { id: 'appradar', name: 'AppRadar', accent: 'tri',
    desc: 'Tracks paid iOS apps that go free, writes the post with AI and publishes it to Telegram.',
    tech: ['FastAPI', 'React', 'Gemini'] },
];

const CONTACT = {
  email: 'm55med@icloud.com',
  booking: 'https://calendar.app.google/68E9YdDURmpuFpWL6',
};

// One handle everywhere: m55med. Two rows in the README: work first, then social.
const SOCIALS = [
  { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/m55med', row: 'work' },
  { id: 'x', label: 'X', slug: 'X', url: 'https://x.com/m55med', row: 'work' },
  { id: 'youtube', label: 'YouTube', slug: 'Youtube', url: 'https://www.youtube.com/@m55med', row: 'work' },
  { id: 'telegram', label: 'Telegram', slug: 'Telegram', url: 'https://t.me/m55med', row: 'work' },
  { id: 'instagram', label: 'Instagram', slug: 'Instagram', url: 'https://www.instagram.com/m55med', row: 'social' },
  { id: 'facebook', label: 'Facebook', slug: 'Facebook', url: 'https://www.facebook.com/m55med', row: 'social' },
  { id: 'tiktok', label: 'TikTok', slug: 'Tiktok', url: 'https://www.tiktok.com/@m55med', row: 'social' },
  { id: 'threads', label: 'Threads', slug: 'Threads', url: 'https://www.threads.net/@m55med', row: 'social' },
  { id: 'snapchat', label: 'Snapchat', slug: 'Snapchat', url: 'https://www.snapchat.com/add/m55med', row: 'social' },
  { id: 'pinterest', label: 'Pinterest', slug: 'Pinterest', url: 'https://www.pinterest.com/m55med', row: 'social' },
];

// ─── README blocks generated from the content above ─────────────────────────
const RAW = 'https://raw.githubusercontent.com/m55med/m55med/main/assets/';

const picture = (name, alt, width, pad = '  ') =>
  [
    '<picture>',
    `  <source media="(prefers-color-scheme: dark)" srcset="${RAW}${name}-dark.svg">`,
    `  <source media="(prefers-color-scheme: light)" srcset="${RAW}${name}-light.svg">`,
    `  <img alt="${esc(alt)}" src="${RAW}${name}-dark.svg" width="${width}">`,
    '</picture>',
  ].map((l) => pad + l).join('\n');

const linked = (href, pic) => `  <a href="${esc(href)}">\n${pic}\n  </a>`;

function readmeBlocks(widths) {
  const repos = REPOS.map((r) => linked(`https://github.com/m55med/${r.name}`, picture(`repo-${r.id}`, `${r.name}: ${r.desc}`, 400, '    ')));
  const primary = [
    linked(CONTACT.booking, picture('contact-book', 'Book a call or consultation', widths.book, '    ')),
    linked(`mailto:${CONTACT.email}`, picture('contact-email', `Email: ${CONTACT.email}`, widths.email, '    ')),
  ];
  const row = (name) =>
    `<p align="center">\n${SOCIALS.filter((s) => s.row === name)
      .map((s) => linked(s.url, picture(`social-${s.id}`, `${s.label}: @m55med`, widths[s.id], '    ')))
      .join('\n')}\n</p>`;
  const stack = STACK.map((g) => {
    const alt = `${g.label}: ${g.t1.map(([, l]) => l).join(', ')}. Also ${g.t2.join(', ')}.`;
    return picture(`stack-${g.id}`, alt, 400);
  });
  return {
    STACK: `<p align="center">\n${stack.join('\n')}\n</p>`,
    REPOS: `<p align="center">\n${repos.join('\n')}\n</p>`,
    CONNECT: [`<p align="center">\n${primary.join('\n')}\n</p>`, row('work'), row('social')].join('\n\n'),
  };
}

function spliceReadme(blocks) {
  const file = new URL('../README.md', import.meta.url);
  let md = fs.readFileSync(file, 'utf8');
  for (const [name, html] of Object.entries(blocks)) {
    const re = new RegExp(`(<!-- ${name}:START -->)[\\s\\S]*?(<!-- ${name}:END -->)`);
    if (!re.test(md)) throw new Error(`README.md is missing the ${name}:START/END markers`);
    md = md.replace(re, `$1\n${html}\n$2`);
  }
  fs.writeFileSync(file, md);
}

// ─── Build ──────────────────────────────────────────────────────────────────
const stackH = Math.max(...STACK.map(stackCardHeight));
const catLines = Math.max(...CATEGORIES.map((c) => wrap(c.desc, DESC.font, DESC.size, 360).length));
const catH = 104 + (catLines - 1) * DESC.lh + 18 + 44 + 4;
const prLines = Math.max(...PRINCIPLES.map((p) => wrap(p.desc, DESC.font, DESC.size, 360).length));
const prH = 70 + (prLines - 1) * DESC.lh + 24;
const repoLines = Math.max(...REPOS.map((r) => wrap(r.desc, REPO_DESC.font, REPO_DESC.size, REPO_DESC.w).length));
const repoH = 68 + (repoLines - 1) * REPO_DESC.lh + 16 + 66;
const widths = {};

for (const t of Object.values(themes)) {
  const s = `-${t.name}.svg`;
  write(`hero${s}`, hero(t));
  write(`positioning${s}`, positioning(t));
  write(`architecture${s}`, architecture(t));
  write(`footer${s}`, footer(t));
  for (const [id, text] of Object.entries(HEADINGS)) write(`h-${id}${s}`, heading(t, text));
  for (const tl of TILES) write(`n-${tl.id}${s}`, tile(t, tl));
  for (const g of STACK) write(`stack-${g.id}${s}`, stackCard(t, g, stackH));
  CATEGORIES.forEach((c, i) => write(`build-${c.id}${s}`, categoryCard(t, c, i, catH)));
  for (const p of PRINCIPLES) write(`work-${p.id}${s}`, principleCard(t, p, prH));
  for (const r of REPOS) write(`repo-${r.id}${s}`, repoCard(t, r, repoH));
  for (const [id, made] of [['book', bookButton(t)], ['email', emailButton(t, CONTACT.email)]]) {
    write(`contact-${id}${s}`, made.svg);
    widths[id] = made.width;
  }
  for (const so of SOCIALS) {
    const made = socialPill(t, so);
    write(`social-${so.id}${s}`, made.svg);
    widths[so.id] = made.width;
  }
}

if (!process.env.ASSETS_OUT) spliceReadme(readmeBlocks(widths));

const total = sizes.reduce((a, [, n]) => a + n, 0);
const heroSize = sizes.find(([n]) => n === 'hero-dark.svg')[1];
console.log(`${sizes.length} files, ${(total / 1024).toFixed(0)} KB total, hero ${(heroSize / 1024).toFixed(0)} KB`);
console.log(`card heights — stack ${stackH}, build ${catH}, work ${prH}, repo ${repoH}; pattern instances ${PATTERN.length}, pulses ${PATTERN.filter((p) => p.pulse != null).length}`);
