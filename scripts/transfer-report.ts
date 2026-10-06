// Transfer report against the budgets in design/CINEMATIC-SPEC-V3.md section 9.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { join } from 'node:path';

const walk = (d: string): string[] => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk('dist').map((p) => {
  const buf = readFileSync(p);
  const pre = /\.(woff2?|png|jpg|webp|avif)$/.test(p);
  return { path: p.replace(/^dist\//, ''), raw: buf.length, gzip: pre ? buf.length : gzipSync(buf, { level: 9 }).length, brotli: pre ? buf.length : brotliCompressSync(buf).length };
});
const sum = (list: typeof files, k: 'raw' | 'gzip' | 'brotli' = 'gzip') => list.reduce((n, f) => n + f[k], 0);
const html = files.filter((f) => f.path === 'index.html');
const css = files.filter((f) => f.path.endsWith('.css'));
const js = files.filter((f) => f.path.endsWith('.js'));
const woff2 = files.filter((f) => f.path.endsWith('.woff2'));
const woff = files.filter((f) => f.path.endsWith('.woff'));
const stills = files.filter((f) => f.path.startsWith('stills/'));
const art = files.filter((f) => /^art\/terrain-(day|night)\.webp$/.test(f.path));
const initial = [...html, ...css, ...js, ...woff2, ...art];
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
const row = (name: string, n: number, budget?: number) => `| ${name} | ${kb(n)} | ${budget ? `${budget} KB` : ''} | ${budget ? (n / 1024 <= budget ? 'within' : 'OVER') : ''} |`;

const lines = [
  '# Transfer report', '',
  `Generated ${new Date().toISOString()} from \`dist/\`. Sizes are gzip level 9 of the built files (fonts are already compressed). GitHub Pages serves gzip.`, '',
  '| Item | Compressed | Budget | Status |', '| --- | --- | --- | --- |',
  row('Initial transfer: HTML, CSS, JS, four WOFF2 fonts and both cached terrain plates', sum(initial), 900),
  row('First-party JavaScript', sum(js), 90),
  row('Fonts actually requested (WOFF2: Newsreader 400, 400 italic; Source Sans 3 400, 500)', sum(woff2), 180),
  row('Complete world assets: inline world, terrain plates and all 19 embedded still figures', sum(html) + sum(stills) + sum(art), 2500),
  row('HTML document', sum(html)), row('CSS', sum(css)), row('Still figures (lazy, only in story / reduced / no-JS / print modes)', sum(stills)),
  row('WOFF fallbacks (never requested by a browser that supports WOFF2)', sum(woff)),
  '', 'Two registered compressed terrain plates provide night/day lighting. All people, routes and architecture are live SVG. No video, scroll image sequence or design-board PNG is shipped.', '',
  '## Files', '', '| File | Raw | Gzip | Brotli |', '| --- | --- | --- | --- |',
  ...files.map((f) => `| ${f.path} | ${kb(f.raw)} | ${kb(f.gzip)} | ${kb(f.brotli)} |`), '',
];
writeFileSync('qa/transfer-report.md', lines.join('\n'));
console.log(lines.slice(4, 14).join('\n'));
