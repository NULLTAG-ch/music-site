import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const BASE = process.env.OVERLAY_URL || 'http://localhost:8765/tools/facts-rebuild/render/overlay-vertical.html';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.log('[pageerror]', e.message));

for (let sn = 0; sn < 6; sn++) {
  await page.goto(`${BASE}?scene=${sn}`);
  await page.waitForFunction('window.__ready === true', null, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const DUR = await page.evaluate(() => window.__DUR);
  const total = Math.round(DUR * FPS);
  const dir = path.join(__dir, 'frames-v', 's' + sn);
  fs.mkdirSync(dir, { recursive: true });
  for (let f = 0; f < total; f++) {
    await page.evaluate((tt) => window.__setT(tt), f / FPS);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.screenshot({ path: path.join(dir, `f_${String(f).padStart(5,'0')}.png`), omitBackground: true });
  }
  console.log(`scene ${sn}: ${total} frames`);
}
await browser.close();
console.log('done');
