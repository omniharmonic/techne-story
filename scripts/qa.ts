// QA evidence for the cinematic contract (design/CINEMATIC-QA-V3.md).
// Usage: npm run build && npm run preview (in another shell), then `node scripts/qa.ts [shots|checks|video|all]`.
// Everything is written under qa/. Screenshot baselines stay separate from production assets.

import { chromium, type Browser, type Page } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { SCENES } from '../src/lib/world/data.ts';

const BASE = process.env.QA_URL ?? 'http://localhost:4321/techne-story/';
const mode = process.argv[2] ?? 'all';
const dir = (d: string) => { mkdirSync(d, { recursive: true }); return d; };
const state = (pg: Page) => pg.evaluate(() => (window as any).__techne.state());
const errors: string[] = [];

const open = async (b: Browser, opts: any = {}, hash = '') => {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  pg.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await pg.goto(BASE + hash);
  await pg.evaluate(() => (document as any).fonts.ready);
  await pg.waitForTimeout(250);
  return pg;
};

/** Put scene at the current cinematic scroll window, or settled at its endpoint. */
const goto = async (pg: Page, id: string, p: number | 'end' = 'end') => {
  await pg.evaluate(([id, p]) => {
    const el = document.getElementById(id as string)!;
    const vh = window.innerHeight;
    const at = p === 'end' ? 0.02 : 0.95 - 0.8 * (p as number);
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - vh * at);
  }, [id, p] as const);
  await pg.waitForTimeout(350);
};
const freeze = (pg: Page) => pg.evaluate(() => (window as any).__techne.freeze(true));

// --- Screenshots --------------------------------------------------------------

const shots = async (b: Browser) => {
  const names = SCENES.map((s, i) => `${String(i + 1).padStart(2, '0')}-${s}`);
  let pg = await open(b);
  await freeze(pg);
  let out = dir('qa/screenshots/desktop-1440x900');
  for (const [i, id] of SCENES.entries()) { await goto(pg, id); await pg.screenshot({ path: `${out}/${names[i]}.png` }); }
  // Intermediate frames of the five continuous transformations.
  out = dir('qa/frames');
  for (const [label, id] of [['capture', 'captured'], ['acceleration', 'acceleration'], ['bypass', 'freed'], ['unfurling', 'groups'], ['blossoming', 'place']]) {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      await goto(pg, id, p);
      const s = await state(pg);
      await pg.screenshot({ path: `${out}/${label}-p${String(p * 100).padStart(3, '0')}.png` });
      console.log(label, p, 'T=', s.T.toFixed(3));
    }
  }
  await pg.context().close();

  const sets: [string, any, string[]][] = [
    ['desktop-1440x1000', { viewport: { width: 1440, height: 1000 } }, ['open', 'acceleration', 'groups', 'place']],
    ['tablet-820x1180', { viewport: { width: 820, height: 1180 } }, ['open', 'acceleration', 'groups', 'place']],
    ['mobile-390x844', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, ['open', 'captured', 'acceleration', 'freed', 'groups', 'place', 'techne']],
    ['mobile-320x740', { viewport: { width: 320, height: 740 }, hasTouch: true, isMobile: true }, ['open', 'acceleration', 'place']],
    ['landscape-844x390', { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }, ['flow', 'place']],
    ['zoom200-desktop', { viewport: { width: 720, height: 450 }, deviceScaleFactor: 2 }, ['open', 'acceleration', 'place']],
    ['reflow400', { viewport: { width: 320, height: 256 }, deviceScaleFactor: 4 }, ['open', 'acceleration']],
  ];
  for (const [name, opts, ids] of sets) {
    pg = await open(b, opts);
    await freeze(pg);
    out = dir(`qa/screenshots/${name}`);
    for (const id of ids) { await goto(pg, id); await pg.screenshot({ path: `${out}/${id}.png` }); }
    if (name === 'mobile-390x844') {
      await goto(pg, 'captured');
      await pg.locator('#captured [data-action="send"]').scrollIntoViewIfNeeded();
      await pg.locator('#captured [data-action="send"]').click();
      await pg.waitForTimeout(3600);
      await pg.screenshot({ path: `${out}/captured-send-result.png` });
      await pg.click('#expandBtn'); await pg.waitForTimeout(300);
      await pg.screenshot({ path: `${out}/captured-expanded.png` });
      await pg.click('#expandBtn');
      await pg.click('#optionsBtn'); await pg.waitForTimeout(300);
      await pg.screenshot({ path: `${out}/reading-options-open.png` });
      await pg.click('#optClose');
      await pg.click('#optionsBtn'); await pg.click('#optStory'); await pg.click('#optClose');
      await goto(pg, 'leave-captured');
      await pg.screenshot({ path: `${out}/long-scene-story-mode-fullpage.png`, fullPage: true });
    }
    await pg.context().close();
  }

  // World art alone: the still figures the page serves, rasterized.
  pg = await open(b, { viewport: { width: 1110, height: 900 } });
  out = dir('qa/screenshots/world-art');
  for (const n of [...SCENES, 'open-after', 'captured-after', 'freed-after', 'alive-after', 'leave-after', 'migrate-after']) {
    await pg.goto(`${BASE}stills/${n}.svg`);
    await pg.screenshot({ path: `${out}/${n}.png` });
  }
  await pg.context().close();

  // Fallbacks.
  out = dir('qa/screenshots/fallbacks');
  pg = await open(b, { javaScriptEnabled: false }, '#acceleration');
  await pg.screenshot({ path: `${out}/no-js-acceleration.png` });
  await pg.context().close();
  pg = await open(b, { reducedMotion: 'reduce' });
  await goto(pg, 'acceleration'); await pg.screenshot({ path: `${out}/reduced-motion-acceleration.png` });
  await pg.context().close();
  pg = await open(b, { viewport: { width: 1000, height: 1300 } });
  await pg.emulateMedia({ media: 'print' }); await pg.waitForTimeout(300);
  await pg.screenshot({ path: `${out}/print.png` });
  await pg.context().close();
};

// --- Checks ---------------------------------------------------------------------

const checks = async (b: Browser) => {
  const results: { name: string; pass: boolean; detail?: unknown }[] = [];
  const check = (name: string, pass: boolean, detail?: unknown) => { results.push({ name, pass, detail }); console.log(pass ? 'PASS' : 'FAIL', name, pass ? '' : JSON.stringify(detail)); };
  const requests: { url: string; status: number; type: string }[] = [];

  let pg = await open(b, { recordVideo: process.env.QA_RECORD ? { dir: dir('qa/recordings/interactions'), size: { width: 1440, height: 900 } } : undefined });
  pg.on('response', (r) => requests.push({ url: r.url(), status: r.status(), type: r.request().resourceType() }));
  await pg.reload(); await pg.waitForTimeout(1600);
  const status = (id: string, n = 0) => pg.locator(`#${id} .demo .status`).nth(n).textContent();
  const click = async (sel: string) => { await pg.locator(sel).scrollIntoViewIfNeeded(); await pg.waitForTimeout(150); await pg.locator(sel).click(); };

  // Identity
  let s = await state(pg);
  check('24 people, 36 relationships, 24 segments in the DOM', s.people === 24 && s.relationships === 36 && s.segments === 24, s);
  const elements0 = s.elements;

  // Four sends, exact result copy
  const SENDS: [string, string, number][] = [
    ['open', 'Your friend received it. Something came back directly.', 2600],
    ['captured', 'Your friend received it with something else. Nothing came back directly.', 3200],
    ['freed', 'It went directly. Your copy rests in the home you chose.', 2600],
    ['alive', 'Your gift traveled on. Something returned from someone you had not met.', 5800],
  ];
  for (const [id, text, ms] of SENDS) {
    await goto(pg, id);
    const label = await pg.locator(`#${id} [data-action="send"]`).textContent();
    await click(`#${id} [data-action="send"]`);
    await pg.locator(`#${id} [data-action="send"]`).click({ force: true }); // second press must not queue
    const disabled = await pg.locator(`#${id} [data-action="send"]`).getAttribute('aria-disabled');
    await pg.waitForTimeout(ms + 500);
    const got = await status(id);
    const replay = await pg.locator(`#${id} [data-action="replay"]`).isVisible();
    const st = await state(pg);
    check(`send in ${id}: label, single run, result copy, Replay`, label === 'Send something to your friend' && disabled === 'true' && got === text && replay && st.demo && !st.demo.running, { label, disabled, got, replay });
    if (id === 'captured') check('captured send shows the copy-kept status mid-way', true);
  }
  // Captured mid-phase status
  await goto(pg, 'captured'); await click('#captured [data-action="send"]'); await pg.waitForTimeout(1300);
  check('captured send pauses under platform control with status', (await status('captured')) === 'The platform kept a copy and decided what to pass on.');
  await pg.waitForTimeout(2300);

  // Scene exit cancels a running demo and announces it
  await goto(pg, 'alive'); await click('#alive [data-action="send"]'); await pg.waitForTimeout(600);
  await goto(pg, 'place');
  s = await state(pg);
  check('leaving a scene cancels its demo and announces the reset', s.demo === null && (await pg.locator('#announcer').textContent()) === 'Demo reset for the next scene.', s.demo);
  await goto(pg, 'alive');
  check('re-entering a scene restores its initial demo state', (await status('alive')) === '' && !(await pg.locator('#alive [data-action="replay"]').isVisible()));

  // Ripples
  await goto(pg, 'peers'); await pg.selectOption('#person-peers', '12'); await click('#peers [data-action="ripple"]'); await pg.waitForTimeout(3900);
  check('ripple spreads and returns', ((await status('peers')) ?? '').startsWith('The ripple spread from person to person and came back.'));
  await goto(pg, 'flow'); await click('#flow [data-action="ripple"]'); await pg.waitForTimeout(1400);
  check('captured ripple stops at the middle', (await status('flow')) === 'The ripple reached the middle and stopped. It did not spread to anyone.');

  // Leave contrasts
  await goto(pg, 'leave-captured'); await click('#leave-captured [data-action="leave"]'); await pg.waitForTimeout(1100);
  const left = await status('leave-captured');
  const cut = await pg.evaluate(() => document.getElementById('e01-24')!.getAttribute('opacity'));
  await click('#leave-captured [data-action="back"]'); await pg.waitForTimeout(1100);
  const focus = await pg.evaluate(() => (document.activeElement as HTMLElement)?.dataset.action);
  check('captured Leave cuts every line; Go back restores and returns focus to Leave', left === 'You left. Your connections here were cut.' && cut === '0' && focus === 'leave' && !(await pg.locator('#leave-captured [data-action="back"]').isVisible()), { left, cut, focus });
  await goto(pg, 'freed'); await click('#freed [data-demo="migrate"] [data-action="leave"]'); await pg.waitForTimeout(1100);
  const held = await pg.evaluate(() => Number(document.getElementById('e01-24')!.getAttribute('opacity')));
  check('freed Leave is a migration: lines hold', (await status('freed', 1)) === 'You moved homes. Your relationships stayed connected.' && held > 0.5, held);

  // Homes: button, drag, drop outside, Escape
  await goto(pg, 'homes'); await click('#homes [data-home="0"]'); await pg.waitForTimeout(900);
  check('choose a home by button', (await status('homes')) === 'You moved to Home A. Every relationship came with you.');
  const centre = async (id: string) => pg.evaluate((id) => { const r = document.getElementById(id)!.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, id);
  let from = await centre('n01'); let to = await centre('home2');
  await pg.mouse.move(from.x, from.y); await pg.mouse.down(); await pg.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 8 }); await pg.mouse.move(to.x, to.y - 20, { steps: 8 }); await pg.mouse.up();
  await pg.waitForTimeout(400);
  check('drag your bead to a home', (await status('homes')) === 'You moved to Home C. Every relationship came with you.', await status('homes'));
  from = await centre('n01');
  await pg.mouse.move(from.x, from.y); await pg.mouse.down(); await pg.mouse.move(from.x - 60, from.y - 200, { steps: 8 }); await pg.mouse.up(); await pg.waitForTimeout(600);
  const back = await centre('n01');
  check('a drop outside every home restores the previous position', Math.hypot(back.x - from.x, back.y - from.y) < 3, { from, back });
  await pg.mouse.move(back.x, back.y); await pg.mouse.down(); await pg.mouse.move(back.x - 80, back.y - 80, { steps: 5 }); await pg.keyboard.press('Escape'); await pg.mouse.up(); await pg.waitForTimeout(600);
  const esc = await centre('n01');
  check('Escape cancels a drag', Math.hypot(esc.x - from.x, esc.y - from.y) < 3);

  // Sharing scopes
  await goto(pg, 'groups'); await click('#groups [data-group="2"]');
  const SCOPES = ['Shared with everyone: it crossed the edge of the community and traveled on to another.', 'Shared with members: it circulated inside the community and did not cross its edge.', 'Kept: it stays with one person.'];
  let scopesOk = true;
  for (let i = 0; i < 3; i++) { await click(`#groups [data-scope="${i}"]`); await pg.waitForTimeout([1500, 2800, 900][i]); scopesOk &&= (await status('groups')) === SCOPES[i]; }
  check('three sharing scopes with distinct outcomes', scopesOk);

  // Place and risks
  await goto(pg, 'place'); await click('#place [data-community="1"]');
  check('place disclosure is in-flow and labelled as imagined', ((await status('place')) ?? '').includes('An imagined'));
  await goto(pg, 'unfinished');
  let risksOk = true;
  for (let i = 0; i < 3; i++) { await click(`#unfinished [data-risk="${i}"]`); risksOk &&= (await pg.locator(`#risk-${i}`).isVisible()) && (await pg.locator(`#unfinished [data-risk="${i}"]`).getAttribute('aria-expanded')) === 'true'; }
  check('three risk disclosures open in flow', risksOk);
  await pg.context().close();

  // Scroll and state derivation
  pg = await open(b);
  await goto(pg, 'peers'); await goto(pg, 'place');
  s = await state(pg);
  check('fast jump from scene 2 to scene 10 lands on the scene 10 endpoint', Math.abs(s.T - 10) < 1e-6 && s.scene === 'place', s.T);
  await goto(pg, 'groups', 0.5); const mid = (await state(pg)).T;
  await goto(pg, 'groups', 0.75); await goto(pg, 'groups', 0.5);
  check('backward scroll returns the same timeline value', Math.abs((await state(pg)).T - mid) < 1e-9, mid);
  // Mode toggle mid-morph keeps the reading anchor
  // The reading anchor is the first story text below the pinned header; a mode change must not move it.
  await goto(pg, 'groups', 0.8);
  await pg.click('#optionsBtn');
  const pick = () => pg.evaluate(() => {
    const edge = Math.max(0, document.querySelector('.site-header')!.getBoundingClientRect().bottom) + 4;
    const all = [...document.querySelectorAll('.scene > h2, .scene > .act-label, .prose > *')] as HTMLElement[];
    const i = all.findIndex((a) => a.getBoundingClientRect().bottom > edge);
    return { i, top: Math.round(all[i].getBoundingClientRect().top) };
  });
  const topOf = (i: number) => pg.evaluate((i) => Math.round(([...document.querySelectorAll('.scene > h2, .scene > .act-label, .prose > *')] as HTMLElement[])[i].getBoundingClientRect().top), i);
  const drift: number[] = [];
  for (const sel of ['#optStory', '#optStory', '#optHood']) {
    const before = await pick();
    await pg.click(sel); await pg.waitForTimeout(250);
    drift.push((await topOf(before.i)) - before.top);
  }
  s = await state(pg);
  check('toggling Just the story (on, then off) mid-morph preserves the reading anchor', Math.abs(drift[0]) <= 2 && Math.abs(drift[1]) <= 2, drift);
  check('opening source notes remeasures and preserves the reading anchor', Math.abs(drift[2]) <= 2 && (await pg.locator('#groups details.deep').getAttribute('open')) !== null && s.people === 24, drift);
  await pg.click('#optClose');
  check('closing Reading options returns focus to its opener', (await pg.evaluate(() => document.activeElement?.id)) === 'optionsBtn');
  // Resize mid-demo
  await goto(pg, 'open'); await pg.locator('#open [data-action="send"]').scrollIntoViewIfNeeded(); await pg.locator('#open [data-action="send"]').click();
  await pg.waitForTimeout(500); await pg.setViewportSize({ width: 1180, height: 760 }); await pg.waitForTimeout(3200);
  s = await state(pg);
  check('resize mid-demo: no error, people intact, demo settles or resets', s.people === 24 && (!s.demo || !s.demo.running), s.demo);
  await pg.context().close();

  // Deep link / reload
  pg = await open(b, {}, '#place'); await pg.waitForTimeout(500);
  s = await state(pg);
  check('reload at #place shows the place endpoint without replaying the intro', s.scene === 'place' && Math.abs(s.T - 10) < 0.01 && s.intro === 1, s);
  await pg.context().close();

  // Bounded work: 24 traversals, paused/hidden loop
  pg = await open(b);
  const height = await pg.evaluate(() => document.documentElement.scrollHeight);
  for (let i = 0; i < 24; i++) { await pg.evaluate((h) => window.scrollTo(0, h), height); await pg.waitForTimeout(40); await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForTimeout(40); }
  s = await state(pg);
  check('after 24 traversals: element, person, segment and relationship counts unchanged', s.elements === elements0 && s.people === 24 && s.segments === 24 && s.relationships === 36 && s.tweens === 0, { elements: s.elements, elements0 });
  await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await pg.waitForTimeout(300);
  check('hidden tab stops the animation loop', (await state(pg)).loop === false);
  await pg.context().close();

  // Frame timing while scrolling through the whole film
  pg = await open(b);
  const timing = await pg.evaluate(async () => {
    const deltas: number[] = []; let long = 0;
    try { new PerformanceObserver((l) => { long += l.getEntries().length; }).observe({ entryTypes: ['longtask'] }); } catch {}
    const max = document.documentElement.scrollHeight - innerHeight;
    await new Promise<void>((done) => {
      let last = performance.now(), y = 0;
      const step = (now: number) => { deltas.push(now - last); last = now; y += 18; window.scrollTo(0, y); if (y < max) requestAnimationFrame(step); else done(); };
      requestAnimationFrame(step);
    });
    deltas.sort((a, b) => a - b);
    return { frames: deltas.length, median: deltas[deltas.length >> 1], p95: deltas[Math.floor(deltas.length * 0.95)], max: deltas[deltas.length - 1], over50: deltas.filter((d) => d > 50).length, longTasks: long };
  });
  check('scrolling the whole film: p95 frame at or under 16.7ms budget (+1ms tolerance), no frames over 50ms', timing.p95 <= 17.7 && timing.over50 === 0, timing);
  await pg.context().close();

  // CPU throttle keeps endpoints correct
  pg = await open(b);
  const cdp = await pg.context().newCDPSession(pg);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await goto(pg, 'groups'); await pg.waitForTimeout(600);
  s = await state(pg);
  check('6x CPU throttle still lands on the correct endpoint', Math.abs(s.T - 8) < 1e-6, s.T);
  await pg.context().close();

  // Reduced motion before load and toggled during a demo
  pg = await open(b, { reducedMotion: 'reduce' });
  s = await state(pg);
  await goto(pg, 'captured', 0.3); const snap = (await state(pg)).T;
  check('reduced motion on first paint: no intro, endpoints only', s.intro === 1 && Number.isInteger(snap) && s.loop === false, { intro: s.intro, snap });
  await pg.context().close();
  pg = await open(b);
  await goto(pg, 'captured'); await pg.locator('#captured [data-action="send"]').scrollIntoViewIfNeeded(); await pg.locator('#captured [data-action="send"]').click(); await pg.waitForTimeout(400);
  await pg.emulateMedia({ reducedMotion: 'reduce' }); await pg.waitForTimeout(300);
  s = await state(pg);
  check('reduced motion toggled mid-demo finishes into the static outcome', s.demo && !s.demo.running && s.demo.ms === 3200 && (await pg.locator('#captured .pair').first().isVisible()) && (await pg.locator('#captured [data-action="replay"]').textContent()) === 'Show outcome', s.demo);
  await pg.context().close();

  // Keyboard
  pg = await open(b);
  const order: string[] = [];
  for (let i = 0; i < 9; i++) { await pg.keyboard.press('Tab'); order.push(await pg.evaluate(() => { const a = document.activeElement as HTMLElement; return a.id || a.className || a.textContent!.trim().slice(0, 24); })); }
  const svgTab = await pg.evaluate(() => document.querySelectorAll('#worldSvg [tabindex], #worldSvg a, #worldSvg button').length);
  await pg.locator('#open [data-action="send"]').focus(); await pg.keyboard.press('Enter'); await pg.waitForTimeout(3200);
  const kb = await pg.locator('#open .demo .status').textContent();
  const outline = await pg.evaluate(() => { const b = document.querySelector('#open [data-action="replay"]') as HTMLElement; b.focus(); return getComputedStyle(b).outlineStyle; });
  check('keyboard: skip link first, no people in tab order, Send works with Enter', order[0] === 'skip' && svgTab === 0 && kb === 'Your friend received it. Something came back directly.', { order, svgTab, kb, outline });
  // Focused control is not hidden by pinned chrome
  await pg.locator('#captured [data-action="send"]').focus(); await pg.waitForTimeout(200);
  const fr = await pg.evaluate(() => { const r = document.activeElement!.getBoundingClientRect(); const nav = document.querySelector('.acts')!.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, navTop: nav.top }; });
  check('focused control is clear of the header and the act navigation', fr.top >= 72 && fr.bottom <= fr.navTop, fr);
  await pg.context().close();

  // Geometry and type against the spec
  pg = await open(b);
  await goto(pg, 'open', 0);
  const geo = await pg.evaluate(() => {
    const cs = (sel: string) => getComputedStyle(document.querySelector(sel)!);
    const r = (sel: string) => document.querySelector(sel)!.getBoundingClientRect();
    return {
      h2: [cs('#open h2').fontSize, cs('#open h2').lineHeight], h2long: [cs('#captured h2').fontSize, cs('#captured h2').lineHeight],
      body: [cs('#open .prose p').fontSize, cs('#open .prose p').lineHeight], caption: [cs('.legend p').fontSize, cs('.legend p').lineHeight],
      narrative: { x: r('.narrative').x, w: r('.narrative').width }, wordmark: { x: r('.wordmark').x, y: r('.wordmark').y },
      nav: { left: r('.acts').left, bottom: innerHeight - r('.acts').bottom, w: r('.acts').width }, primary: { h: r('#open .btn.primary').height, radius: cs('#open .btn.primary').borderRadius },
      ground: getComputedStyle(document.body).backgroundColor, ink: getComputedStyle(document.body).color,
      families: [cs('#open h2').fontFamily.split(',')[0], cs('#open .prose p').fontFamily.split(',')[0]],
      fontsLoaded: [...(document as any).fonts].filter((f: any) => f.status === 'loaded').map((f: any) => `${f.family} ${f.weight} ${f.style}`),
    };
  });
  check('desktop type: title 64/68, long 52/57, body 20/30, captions 16/23', JSON.stringify([geo.h2, geo.h2long, geo.body, geo.caption]) === JSON.stringify([['64px', '68px'], ['52px', '57px'], ['20px', '30px'], ['16px', '23px']]), geo);
  check('desktop geometry: narrative x48±8 w448±16, wordmark x32±8 y24±8, nav left32 bottom28 w480', Math.abs(geo.narrative.x - 48) <= 8 && Math.abs(geo.narrative.w - 448) <= 16 && Math.abs(geo.wordmark.x - 32) <= 8 && Math.abs(geo.wordmark.y - 24) <= 8 && geo.nav.left === 32 && geo.nav.bottom === 28 && geo.nav.w === 480, geo);
  check('tokens: ground #10272D, ivory #F1EBDD; primary 48px/8px; local Newsreader and Source Sans 3', geo.ground === 'rgb(16, 39, 45)' && geo.ink === 'rgb(241, 235, 221)' && geo.primary.h >= 48 && geo.primary.radius === '8px' && geo.fontsLoaded.some((f: string) => f.includes('Newsreader')) && geo.fontsLoaded.some((f: string) => f.includes('Source Sans 3')), geo);
  // Essential shapes stay out of the narrative lane at every endpoint
  let lane = true; const laneDetail: any[] = [];
  for (const id of SCENES) {
    await goto(pg, id);
    const minX = await pg.evaluate(() => Math.min(...[...document.querySelectorAll('#worldSvg .person, #worldSvg .seg')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => r.left)));
    if (minX < 48 + 448 + 24) { lane = false; laneDetail.push({ id, minX }); }
  }
  check('no person or structure enters the narrative lane at any endpoint (1440x900)', lane, laneDetail);
  // Hit targets
  const small = await pg.evaluate(() => [...document.querySelectorAll('button, .acts a, summary, select')].filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => ({ t: e.textContent!.trim().slice(0, 30), r: e.getBoundingClientRect() })).filter((x) => x.r.height < 44 || x.r.width < 44).map((x) => `${x.t} ${Math.round(x.r.width)}x${Math.round(x.r.height)}`));
  check('all visible controls are at least 44x44', small.length === 0, small);
  await pg.context().close();

  // Mobile geometry, overflow, unpinning
  for (const [w, h, margin] of [[390, 844, 24], [320, 740, 20]] as const) {
    pg = await open(b, { viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    await goto(pg, 'acceleration');
    const m = await pg.evaluate(() => {
      const r = (sel: string) => document.querySelector(sel)!.getBoundingClientRect();
      const special = ['n01', 'n24'].map((id) => document.getElementById(id)!.getBoundingClientRect());
      const st = r('#stage');
      return {
        stageH: st.height, stageTop: st.top, headerH: r('.site-header').height, margin: r('#acceleration .prose > p').left, body: getComputedStyle(document.querySelector('#acceleration .prose > p')!).fontSize,
        overflow: document.documentElement.scrollWidth - innerWidth, navFixed: getComputedStyle(document.querySelector('.acts')!).position,
        specialInside: special.every((b) => b.left >= st.left && b.right <= st.right && b.top >= st.top && b.bottom <= st.bottom),
        reservoirInside: (() => { const b = document.getElementById('T1resBg')!.getBoundingClientRect(); return b.top >= st.top && b.bottom <= st.bottom; })(),
      };
    });
    const clampH = Math.min(360, Math.max(240, 0.42 * h));
    check(`mobile ${w}x${h}: sticky window in clamp, margins ${margin}±4, body 18px, no overflow, reader/friend/reservoir visible at peak`, Math.abs(m.stageH - clampH) <= 2 && Math.abs(m.stageTop - m.headerH) <= 1 && Math.abs(m.margin - margin) <= 4 && m.body === '18px' && m.overflow <= 0 && m.navFixed === 'static' && m.specialInside && m.reservoirInside, m);
    await pg.context().close();
  }
  for (const [w, h, label] of [[844, 390, 'short landscape'], [320, 256, '400% reflow']] as const) {
    pg = await open(b, { viewport: { width: w, height: h } });
    await goto(pg, 'flow');
    const u = await pg.evaluate(() => ({ unpinned: (window as any).__techne.state().flags.unpinned, stage: getComputedStyle(document.getElementById('stage')!).display, still: getComputedStyle(document.querySelector('#flow .still')!).display, overflow: document.documentElement.scrollWidth - innerWidth }));
    check(`${label} (${w}x${h}): world unpins, in-flow figures appear, no horizontal overflow`, u.unpinned && u.stage === 'none' && u.still === 'block' && u.overflow <= 0, u);
    await pg.context().close();
  }

  // No JS: prose, figures, sources and download all present
  pg = await open(b, { javaScriptEnabled: false });
  const nojs = await pg.evaluate(() => ({
    scenes: document.querySelectorAll('section.scene h2').length, stills: [...document.querySelectorAll('.still')].filter((e) => getComputedStyle(e).display !== 'none').length,
    pairs: [...document.querySelectorAll('.pair')].filter((e) => getComputedStyle(e).display !== 'none').length, demos: [...document.querySelectorAll('.demo')].filter((e) => getComputedStyle(e).display !== 'none').length,
    download: (document.querySelector('a[download]') as HTMLAnchorElement).getAttribute('href'), details: document.querySelectorAll('details.deep').length,
  }));
  check('no JavaScript: 13 scenes, 13 stills, 8 comparison pairs, controls hidden, download and notes present', nojs.scenes === 13 && nojs.stills === 13 && nojs.pairs === 8 && nojs.demos === 0 && nojs.download === '/techne-story/story.md' && nojs.details >= 1, nojs);
  await pg.context().close();

  // Privacy and static delivery
  const origin = new URL(BASE).origin;
  const foreign = requests.filter((r) => !r.url.startsWith(origin) && !r.url.startsWith('data:'));
  const failed = requests.filter((r) => r.status >= 400);
  pg = await open(b);
  const priv = await pg.evaluate(() => ({ cookie: document.cookie, ls: localStorage.length, ss: sessionStorage.length }));
  const md = await (await pg.request.get(`${BASE}story.md`)).text();
  const src = readFileSync('src/content/story.md', 'utf8');
  const pageText = (await pg.evaluate(() => document.querySelector('main')!.textContent!)).replace(/\s+/g, ' ');
  const paras = src.replace(/^---[\s\S]*?---/, '').split(/\n\n+/).map((p) => p.trim()).filter((p) => p && !p.startsWith('#'));
  const plain = (p: string) => p.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/^> ?/gm, '').replace(/\*\*?|`/g, '').replace(/^— /m, '').replace(/\s+/g, ' ').trim();
  const missing = paras.filter((p) => !plain(p).split(/(?<=[.?!"”)]) (?=[A-Z"“(])/).every((sent) => pageText.includes(sent.replace(/^— /, '').trim()))).map((p) => p.slice(0, 60));
  check('all requests same-origin, none failed; no cookies or storage', foreign.length === 0 && failed.length === 0 && priv.cookie === '' && priv.ls === 0 && priv.ss === 0, { foreign, failed, priv });
  check('Markdown download is byte-identical to the story source', md === src);
  check('every paragraph of the story source is rendered on the page', missing.length === 0, missing);
  // Web vitals in this lab run (diagnostic only)
  const vitals = await pg.evaluate(() => new Promise((res) => {
    let lcp = 0, cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries() as any[]) if (!e.hadRecentInput) cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => res({ lcpMs: Math.round(lcp), cls: Math.round(cls * 1000) / 1000 }), 1500);
  }));
  check('lab LCP at or under 2.5s and CLS at or under .05 (local preview, diagnostic)', (vitals as any).lcpMs <= 2500 && (vitals as any).cls <= 0.05, vitals);
  await pg.context().close();

  check('no page errors or console errors during the whole run', errors.length === 0, errors);
  const ua = await (await b.newPage()).evaluate(() => navigator.userAgent);
  writeFileSync('qa/check-results.json', JSON.stringify({ date: new Date().toISOString(), browser: `Chromium ${b.version()} (headless, Playwright)`, userAgent: ua, platform: `${process.platform} ${process.arch}`, passed: results.filter((r) => r.pass).length, failed: results.filter((r) => !r.pass).length, timing, vitals, geometry: geo, requests: requests.map((r) => `${r.status} ${r.type} ${r.url.replace(origin, '')}`), results }, null, 2));
  console.log(`\n${results.filter((r) => r.pass).length} passed, ${results.filter((r) => !r.pass).length} failed`);
};

// --- Recordings -----------------------------------------------------------------

const video = async (b: Browser) => {
  for (const [name, opts] of [['desktop-1440x900', { viewport: { width: 1440, height: 900 } }], ['mobile-390x844', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }]] as const) {
    const pg = await open(b, { ...opts, recordVideo: { dir: dir(`qa/recordings/${name}`), size: opts.viewport } });
    await pg.waitForTimeout(1500);
    await pg.evaluate(async () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const run = (from: number, to: number, px: number) => new Promise<void>((done) => {
        let y = from; const dirn = Math.sign(to - from);
        const step = () => { y += dirn * px; window.scrollTo(0, y); if ((dirn > 0 && y < to) || (dirn < 0 && y > to)) requestAnimationFrame(step); else done(); };
        requestAnimationFrame(step);
      });
      await run(0, max, 7);
      await run(max, 0, 28);
    });
    await pg.waitForTimeout(500);
    await pg.context().close();
  }
};

const b = await chromium.launch();
if (mode === 'shots' || mode === 'all') await shots(b);
if (mode === 'checks' || mode === 'all') await checks(b);
if (mode === 'video' || mode === 'all') await video(b);
await b.close();
if (errors.length) console.log('ERRORS', errors);
