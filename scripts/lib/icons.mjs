// Custom line icons on a 24×24 grid: stroke only, round caps and joins, no fills.
// Grouped by the families the design spec names for the hero pattern.
import * as simpleIcons from 'simple-icons';

export const ICONS = {
  // backend
  server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5"/><path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3"/>',
  braces: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"/>',
  terminal: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 9l3 3-3 3M12 15h6"/>',
  container: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  queue: '<rect x="3" y="4" width="13" height="4" rx="1"/><rect x="3" y="10" width="13" height="4" rx="1"/><rect x="3" y="16" width="13" height="4" rx="1"/><path d="M20 5v14M18 17l2 2 2-2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  webhook: '<circle cx="6" cy="17" r="2.5"/><circle cx="18" cy="17" r="2.5"/><circle cx="12" cy="6" r="2.5"/><path d="M10.8 8.2L7.2 14.8M13.2 8.2l3.6 6.6M8.5 17h7"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4M12 15v2"/>',
  apiArrows: '<path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A3.75 3.75 0 0 1 17.5 18z"/>',
  branch: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="7" r="2"/><path d="M6 7v10M18 9c0 5-6 4-11 8.5"/>',
  // web
  browser: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20M5.5 6.5h.01M8 6.5h.01M10.5 6.5h.01"/>',
  cursor: '<path d="M5 3l14 7-6 2-2 6z"/><path d="M13 12l6 6"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  viewport: '<rect x="2" y="4" width="14" height="10" rx="1.5"/><path d="M6 18h6M9 14v4"/><rect x="17" y="9" width="5" height="11" rx="1"/>',
  chart: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 16v-4M12 16V8M17 16v-6"/>',
  // mobile
  phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10.5 18.5h3"/>',
  tablet: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M11 18.5h2"/>',
  touch: '<path d="M9 11V5a2 2 0 0 1 4 0v6l4 1a2 2 0 0 1 1.5 2.3L17.5 20h-8L6 15.5a1.5 1.5 0 0 1 2.3-2L9 14"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M14 21h.01M17.5 17.5V21H21"/>',
  mobileApi: '<rect x="3" y="7" width="10" height="15" rx="2"/><path d="M7 18.5h2M16 9a4 4 0 0 1 3 3M16 4.5a8 8 0 0 1 6 6"/>',
  // domains
  car: '<path d="M3 16v-4l2.5-5h13l2.5 5v4a1 1 0 0 1-1 1h-1M6 17H4a1 1 0 0 1-1-1"/><path d="M3 12h18"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H16"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>',
  wave: '<path d="M2 12h2M6 8v8M10 4v16M14 7v10M18 10v4M20 12h2"/>',
  envelope: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M16 7l3 3M18.5 4.5l2 2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  ain: '<path d="M15.5 6.5a3.5 3.5 0 1 0-4.6 3.3C8.1 10.6 6.5 12.8 6.5 15.4c0 3 2.6 5.1 6.2 5.1 2 0 3.8-.5 5.3-1.5"/>',
  // extra, for cards
  building: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4"/>',
  package: '<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8M7.5 5.5l9 5"/>',
  spec: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 14l2.5 2.5L16 11"/>',
  rocket: '<path d="M12 15l-3-3c1.2-4.5 4.5-8.2 10-9 .3 5.5-3.5 8.8-7 12z"/><path d="M9 12H5l2.5-3.5H11M12 15v4l3.5-2.5V13M6.5 17.5c-1 1-1.5 3-1.5 3s2-.5 3-1.5"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/>',
  repo: '<path d="M5 19.5V5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2 2 2 0 0 0 2 2h12"/><path d="M9 7h6"/>',
};

export const FAMILIES = {
  backend: ['server', 'database', 'braces', 'terminal', 'container', 'queue', 'gear', 'webhook', 'shield', 'lock', 'apiArrows', 'cloud', 'branch'],
  web: ['browser', 'cursor', 'layout', 'code', 'viewport', 'chart'],
  mobile: ['phone', 'tablet', 'touch', 'bell', 'qr', 'mobileApi'],
  domain: ['car', 'route', 'pin', 'briefcase', 'mic', 'wave', 'envelope', 'key', 'globe', 'ain'],
};

export const familyOf = (name) => Object.keys(FAMILIES).find((f) => FAMILIES[f].includes(name));

const r = (n) => Math.round(n * 100) / 100;

// Inline line icon. sw is the stroke width at the rendered size.
export function lineIcon(name, { x, y, size, color, sw = 1.5, opacity }) {
  const k = size / 24;
  return `<g transform="translate(${r(x)} ${r(y)}) scale(${r(k)})" fill="none" stroke="${color}" stroke-width="${r(sw / k)}" stroke-linecap="round" stroke-linejoin="round"${opacity != null ? ` opacity="${opacity}"` : ''}>${ICONS[name]}</g>`;
}

// For icons repeated many times (the hero pattern): define a <symbol>, place with <use>.
export const iconSymbol = (name) =>
  `<symbol id="i-${name}" viewBox="0 0 24 24"><g fill="none" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</g></symbol>`;

// Simple Icons brand mark (24×24, filled).
export function brand(slug, { x, y, size, color }) {
  const icon = simpleIcons[`si${slug}`];
  if (!icon) throw new Error(`simple-icons has no "${slug}"`);
  return `<path transform="translate(${r(x)} ${r(y)}) scale(${r(size / 24)})" fill="${color}" d="${icon.path}"/>`;
}
