// Builds the live activity cards into dist/ (published to the `output` branch by CI).
// Contribution counts come from the GitHub contribution calendar, which includes private
// contributions once "Include private contributions on my profile" is enabled.
// Run: GITHUB_TOKEN=... npm run stats
import fs from 'node:fs';
import { themes } from './lib/theme.mjs';
import { F, Typesetter, measure, capHeight } from './lib/type.mjs';
import { lineIcon } from './lib/icons.mjs';
import { doc, card } from './lib/svg.mjs';

const LOGIN = process.env.PROFILE_LOGIN || 'm55med';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!TOKEN) throw new Error('Set GITHUB_TOKEN (or GH_TOKEN) to query the GraphQL API.');

const OUT = new URL('../dist/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });

async function gql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': `${LOGIN}-profile` },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`GraphQL: ${res.status} ${JSON.stringify(json.errors ?? json)}`);
  return json.data;
}

const YEAR_QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      restrictedContributionsCount
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
}`;

async function load() {
  const { user } = await gql('query($login: String!) { user(login: $login) { createdAt } }', { login: LOGIN });
  const now = new Date();
  const thisYear = now.getUTCFullYear();
  const years = [];
  for (let y = new Date(user.createdAt).getUTCFullYear(); y <= thisYear; y++) {
    const to = y === thisYear ? now.toISOString() : `${y}-12-31T23:59:59Z`;
    const { user: u } = await gql(YEAR_QUERY, { login: LOGIN, from: `${y}-01-01T00:00:00Z`, to });
    years.push({ year: y, ...u.contributionsCollection });
  }
  const days = years
    .flatMap((y) => y.contributionCalendar.weeks.flatMap((w) => w.contributionDays))
    .filter((d) => d.date <= now.toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date));
  const current = years.at(-1);
  return {
    year: thisYear,
    total: current.contributionCalendar.totalContributions,
    restricted: current.restrictedContributionsCount,
    weeks: current.contributionCalendar.weeks.map((w) => w.contributionDays.reduce((a, d) => a + d.contributionCount, 0)),
    days,
  };
}

function streaks(days) {
  let longest = { len: 0 };
  let run = { len: 0 };
  for (const d of days) {
    if (d.contributionCount > 0) {
      run = run.len ? { ...run, len: run.len + 1, end: d.date } : { len: 1, start: d.date, end: d.date };
      if (run.len > longest.len) longest = run;
    } else {
      run = { len: 0 };
    }
  }
  // Today still counts as "in progress": a streak that ended yesterday is current.
  let i = days.length - 1;
  if (i >= 0 && days[i].contributionCount === 0) i--;
  let current = { len: 0 };
  for (; i >= 0 && days[i].contributionCount > 0; i--) {
    current = { len: current.len + 1, start: days[i].date, end: current.end ?? days[i].date };
  }
  return { current, longest };
}

const fmt = (n) => n.toLocaleString('en-US');
const shortDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const range = (s) => (s.len ? (s.start === s.end ? shortDate(s.start) : `${shortDate(s.start)} – ${shortDate(s.end)}`) : '—');

function statsCard(t, data) {
  const W = 400, H = 180;
  const ts = new Typesetter('g');
  const c = card(t, { id: 'c', w: W, h: H, accent: 'backend' });
  let body = c.svg;
  body += ts.text(`${data.year} CONTRIBUTIONS`, { font: F.jb500, size: 11, x: 20, y: 36, ls: 2, fill: t.muted }).svg;

  // Floor, so a mostly-private year reads "99%" rather than an implausible "100%".
  const share = data.total ? Math.floor((data.restricted / data.total) * 100) : 0;
  if (data.restricted > 0) {
    const label = 'PRIVATE INCLUDED';
    const tw = measure(label, F.jb500, 9.5, 1);
    const w = tw + 36, x = W - 20 - w, y = 22;
    body += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="21" rx="6" fill="${t.surface2}" stroke="${t.backend}" stroke-opacity=".45"/>`;
    body += lineIcon('lock', { x: x + 9, y: y + 4.5, size: 12, color: t.backend, sw: 1.4 });
    body += ts.text(label, { font: F.jb500, size: 9.5, x: x + 26, y: y + 10.5 + (9.5 * capHeight(F.jb500)) / 2, ls: 1, fill: t.backend }).svg;
  }

  body += ts.text(fmt(data.total), { font: F.sg700, size: 44, x: 20, y: 90, fill: t.text }).svg;
  const note = data.restricted > 0 ? `~${share}% in private repositories` : 'across public and private work';
  body += ts.text(note, { font: F.sg400, size: 13, x: 20, y: 114, fill: t.muted }).svg;

  // Weekly totals for the year, newest on the right.
  const weeks = data.weeks;
  const max = Math.max(1, ...weeks);
  const gap = 2, bw = (360 - gap * (weeks.length - 1)) / weeks.length, base = 160, top = 132;
  body += weeks
    .map((v, i) => {
      const h = v ? Math.max(2, ((base - top) * v) / max) : 1.5;
      const op = v ? 0.35 + 0.65 * (v / max) : 1;
      const fill = v ? t.backend : t.border;
      return `<rect x="${(20 + i * (bw + gap)).toFixed(2)}" y="${(base - h).toFixed(2)}" width="${bw.toFixed(2)}" height="${h.toFixed(2)}" rx="1" fill="${fill}" opacity="${op.toFixed(2)}"/>`;
    })
    .join('');

  return doc({
    w: W, h: H, ts, defs: c.defs, body,
    title: `${fmt(data.total)} contributions in ${data.year}`,
    desc: data.restricted > 0 ? `${fmt(data.total)} contributions in ${data.year}, about ${share}% in private repositories.` : `${fmt(data.total)} contributions in ${data.year}.`,
  });
}

function streakCard(t, data) {
  const W = 400, H = 180;
  const ts = new Typesetter('g');
  const c = card(t, { id: 'c', w: W, h: H, accent: 'mobile' });
  const { current, longest } = streaks(data.days);
  const active = data.days.filter((d) => d.date.startsWith(String(data.year)) && d.contributionCount > 0).length;
  const cols = [
    ['CURRENT', current.len, range(current)],
    ['LONGEST', longest.len, range(longest)],
    [`ACTIVE ${data.year}`, active, 'days with commits'],
  ];
  let body = c.svg;
  cols.forEach(([label, value, sub], i) => {
    const x = 20 + i * 127;
    body += ts.text(label, { font: F.jb500, size: 10, x, y: 36, ls: 1.5, fill: t.muted }).svg;
    const v = ts.text(fmt(value), { font: F.sg700, size: 34, x, y: 78, fill: t.text });
    body += v.svg;
    if (i < 2) body += ts.text(value === 1 ? 'day' : 'days', { font: F.sg400, size: 13, x: x + v.width + 6, y: 78, fill: t.muted }).svg;
    body += ts.text(sub, { font: F.jb400, size: 9.5, x, y: 98, fill: t.muted }).svg;
  });

  // Last 30 days, same color ramp as the contribution snake.
  const last = data.days.slice(-30);
  const max = Math.max(1, ...last.map((d) => d.contributionCount));
  const level = (n) => (n === 0 ? 0 : Math.min(4, 1 + Math.floor((3 * n) / max)));
  body += last
    .map((d, i) => `<rect x="${20 + i * 12}" y="122" width="10" height="10" rx="2.5" fill="${t.heat[level(d.contributionCount)]}"/>`)
    .join('');
  body += ts.text('last 30 days', { font: F.jb400, size: 9.5, x: 20, y: 152, fill: t.muted }).svg;
  body += ts.text('today', { font: F.jb400, size: 9.5, x: 380, y: 152, anchor: 'end', fill: t.muted }).svg;

  return doc({
    w: W, h: H, ts, defs: c.defs, body,
    title: `Current streak ${current.len} days, longest ${longest.len} days`,
    desc: `Current streak: ${current.len} days. Longest streak: ${longest.len} days. Active days in ${data.year}: ${active}.`,
  });
}

const data = await load();
for (const t of Object.values(themes)) {
  fs.writeFileSync(new URL(`stats-${t.name}.svg`, OUT), statsCard(t, data));
  fs.writeFileSync(new URL(`streak-${t.name}.svg`, OUT), streakCard(t, data));
}
// Hand the snake step its colors from the same tokens, so the palette lives in one place.
if (process.env.GITHUB_OUTPUT) {
  const snake = (t) => `dist/snake-${t.name}.svg?color_snake=${t.backend}&color_dots=${t.heat.join(',')}`;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `snake_dark=${snake(themes.dark)}\nsnake_light=${snake(themes.light)}\n`);
}

const { current, longest } = streaks(data.days);
console.log(`${data.year}: ${data.total} contributions (${data.restricted} private); streak ${current.len} (longest ${longest.len})`);
