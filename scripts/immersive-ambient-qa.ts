import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 3440, height: 1440 } });
await page.goto(process.env.QA_URL || 'http://127.0.0.1:4321/techne-story/');
await page.waitForFunction(() => Boolean((window as any).__film?.state().ready));
await page.evaluate(() => (window as any).__film.go(5));
await page.waitForTimeout(1000);
const wideP95 = await page.evaluate(async () => {
  const intervals: number[] = []; let last = performance.now();
  for (let i = 0; i < 180; i++) {
    await new Promise(requestAnimationFrame);
    const now = performance.now();
    if (i > 20) intervals.push(now - last);
    last = now;
  }
  intervals.sort((a, b) => a - b);
  return intervals[Math.floor(intervals.length * .95)];
});
const first = await page.locator('canvas').screenshot();
await page.waitForTimeout(1200);
const second = await page.locator('canvas').screenshot();
await page.locator('#motion').click();
await page.waitForTimeout(500);
const quietFirst = await page.locator('canvas').screenshot();
await page.waitForTimeout(1000);
const quietSecond = await page.locator('canvas').screenshot();
const result = { wideP95, ambientMoves: !first.equals(second), quietStable: quietFirst.equals(quietSecond) };
writeFileSync('qa/immersive/ambient.json', JSON.stringify(result, null, 2) + '\n');
console.log(result);
await browser.close();
if (wideP95 >= 34 || !result.ambientMoves || !result.quietStable) process.exitCode = 1;
