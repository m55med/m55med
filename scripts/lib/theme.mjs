// Design tokens. A palette = a neutral set (backgrounds, text, borders) + three layer
// accents (backend / web / mobile). Every generated asset reads from `themes`.
const NEUTRALS = {
  graphite: {
    dark: { bg: '#0B0C0F', surface: '#121418', surface2: '#191C21', border: '#2A2E35', text: '#F4F4F5', muted: '#A1A1AA', highlight: '#FAFAFA' },
    light: { bg: '#FAFAF9', surface: '#FFFFFF', surface2: '#F4F4F5', border: '#D4D4D8', text: '#18181B', muted: '#52525B', highlight: '#18181B' },
  },
  navy: {
    dark: { bg: '#07111F', surface: '#0D1B2A', surface2: '#11243A', border: '#263B52', text: '#F3F7FA', muted: '#9BAEC0', highlight: '#F8FAFC' },
    light: { bg: '#F7F9FC', surface: '#FFFFFF', surface2: '#EEF3F8', border: '#CBD5E1', text: '#0F172A', muted: '#526173', highlight: '#0F172A' },
  },
};

const ACCENTS = {
  sky: { dark: '#38BDF8', light: '#0284C7' },
  amber: { dark: '#F5A524', light: '#B45309' },
  coral: { dark: '#FF7A59', light: '#C2410C' },
  violet: { dark: '#A78BFA', light: '#7C3AED' },
  green: { dark: '#4ADE80', light: '#16A34A' },
};

export const PALETTES = {
  original: {
    label: 'Sky on navy (original spec)',
    neutrals: 'navy',
    backend: 'sky',
    // The spec's exact contribution ramp.
    heat: {
      dark: ['#10253A', '#164765', '#1C6D91', '#279AC8', '#38BDF8'],
      light: ['#E2E8F0', '#BAE6FD', '#7DD3FC', '#38BDF8', '#0284C7'],
    },
  },
  amber: { label: 'Amber on graphite', neutrals: 'graphite', backend: 'amber' },
  coral: { label: 'Coral on graphite', neutrals: 'graphite', backend: 'coral' },
  amberNavy: { label: 'Amber on navy', neutrals: 'navy', backend: 'amber' },
};

export const PALETTE = process.env.PALETTE || 'original';

const hex = (c) => [1, 3, 5].map((i) => Number.parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, k) =>
  '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * k).toString(16).padStart(2, '0')).join('').toUpperCase();

function build(name, mode) {
  const p = PALETTES[name];
  if (!p) throw new Error(`Unknown PALETTE "${name}". Options: ${Object.keys(PALETTES).join(', ')}`);
  const n = NEUTRALS[p.neutrals][mode];
  const backend = ACCENTS[p.backend][mode];
  // Contribution ramp (stats card, streak strip, snake): empty cell, then shades of the backend accent.
  const bright = ACCENTS[p.backend].dark;
  const heat = p.heat?.[mode] ?? (mode === 'dark'
    ? [n.surface2, ...[0.35, 0.55, 0.78, 1].map((k) => mix('#000000', bright, k))]
    : [mix(n.surface2, n.border, 0.5), mix('#FFFFFF', bright, 0.3), mix('#FFFFFF', bright, 0.6), bright, backend]);
  return {
    name: mode,
    ...n,
    backend,
    web: ACCENTS.violet[mode],
    mobile: ACCENTS.green[mode],
    heat,
    // Background-pattern icon opacity tiers (spec: 10–16% and 18–24%); dark ink on light reads stronger.
    tiers: mode === 'dark' ? [0.12, 0.2] : [0.09, 0.15],
    grid: mode === 'dark' ? 0.06 : 0.05,
  };
}

export const paletteThemes = (name) => ({ dark: build(name, 'dark'), light: build(name, 'light') });
export const themes = paletteThemes(PALETTE);

export const LAYERS = ['backend', 'web', 'mobile'];

// 'tri' means cross-stack: the three layer colors side by side.
export const accentColor = (t, accent) => (accent && accent !== 'tri' ? t[accent] : t.text);
