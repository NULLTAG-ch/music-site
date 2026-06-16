import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const mode = process.argv[2] || 'full';        // 'full' | 'probe'
const probeT = parseFloat(process.argv[3] || '8');

const URL = process.env.OVERLAY_URL || 'http://localhost:8765/tools/facts-rebuild/render/overlay.html';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(URL);
await page.waitForFunction('window.__ready === true', null, { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const DUR = await page.evaluate(() => window.__DUR);

async function frameAt(t) {
  await page.evaluate((tt) => window.__setT(tt), t);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}

if (mode === 'probe') {
  await frameAt(probeT);
  await page.screenshot({ path: path.join(__dir, `probe-${probeT}.png`), omitBackground: true });
  console.log('probe saved at t=' + probeT);
} else {
  const total = Math.round(DUR * FPS);
  console.log(`capturing ${total} frames @ ${FPS}fps (DUR=${DUR}s)`);
  for (let f = 0; f < total; f++) {
    await frameAt(f / FPS);
    const name = String(f).padStart(5, '0');
    await page.screenshot({ path: path.join(__dir, 'frames', `f_${name}.png`), omitBackground: true });
    if (f % 100 === 0) console.log(`  ${f}/${total}`);
  }
  console.log('done: ' + total + ' frames');
}
await browser.close();
