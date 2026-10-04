// Render reel.html to frames/0001.png … one PNG per frame of the loop.
//
//   npm run render
//
// A video render is a camera asking the page "what do you look like at t?"
// once per frame. The page answers through window.seek(t), which draws from
// t alone, so the same t always gives the same picture. ?render switches off
// the page's own requestAnimationFrame playback, so nothing moves between the
// question and the screenshot.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const FRAMES = join(ROOT, 'frames');
const FPS = 30;
const SIZE = 1080;              // the tile's canvas: one CSS pixel per video pixel
const READY_TIMEOUT = 30_000;   // fonts come from Google, so allow for a slow line

// What the page has to have loaded before a frame is worth keeping. Without
// this check, a render with no connection would quietly come out in Georgia.
const FONTS = ['Playfair Display 600', 'DM Sans 400', 'DM Sans 500'];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const pad = (n, width) => String(n).padStart(width, '0');

// fetch refuses file://, so the page needs http. This serves the repo folder
// on a port the system picks, so it never clashes with a running preview.
function serve() {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT + sep)) return res.writeHead(404).end();
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function main() {
  const started = Date.now();
  const issuePath = join(ROOT, 'issue.json');
  if (!existsSync(issuePath)) throw new Error('there is no issue.json. Run python3 tools/pull-issue.py 010 first.');
  const { no, word } = JSON.parse(readFileSync(issuePath, 'utf8'));

  const server = await serve();
  // By default Chromium repaints only the part of a tile that changed. Where
  // that patch crosses the faint baseline, the line's anti-aliased edge comes
  // out one level different, so two frames with identical SVG differed and the
  // seam check failed. Repainting whole tiles makes every frame depend on the
  // drawing alone: renders now repeat byte for byte.
  const browser = await chromium.launch({ args: ['--disable-partial-raster'] });
  try {
    const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
    page.on('pageerror', (err) => console.error(`  page error: ${err.message}`));
    await page.goto(`http://127.0.0.1:${server.address().port}/reel.html?render`);

    // Nothing is cleared, drawn or saved until the page says it is ready:
    // issue.json fetched, fonts loaded and measured, frame 0 painted.
    console.log(`waiting for reel.html to be ready (${pad(no, 3)} ${word})…`);
    try {
      await page.waitForFunction(() => window.__ready === true, null, { timeout: READY_TIMEOUT });
    } catch {
      const said = await page.evaluate(() =>
        [...document.querySelectorAll('#stage text')].map((t) => t.textContent).join(' '));
      throw new Error(`reel.html never became ready.${said ? ` The page says: ${said}` : ''}`);
    }

    const missing = await page.evaluate((wanted) => {
      const loaded = [...document.fonts]
        .filter((face) => face.status === 'loaded')
        .map((face) => `${face.family.replace(/["']/g, '')} ${face.weight}`);
      return wanted.filter((font) => !loaded.includes(font));
    }, FONTS);
    if (missing.length) {
      throw new Error(`fonts didn't load (${missing.join(', ')}), so the frames would use a fallback. `
        + 'Check the connection to Google Fonts and render again.');
    }

    // Only now, with a page that can draw, is it safe to clear the last render.
    const loop = await page.evaluate(() => window.LOOP_SECONDS);
    const total = Math.round(loop * FPS);
    rmSync(FRAMES, { recursive: true, force: true });
    mkdirSync(FRAMES);

    let first, last;
    for (let i = 0; i < total; i++) {
      // t is worked out from i every time and never added up, so frame 0133
      // is t = 4.4 s whatever came before it.
      await page.evaluate((t) => window.seek(t), i / FPS);
      const png = await page.screenshot({
        path: join(FRAMES, `${pad(i + 1, 4)}.png`),
        clip: { x: 0, y: 0, width: SIZE, height: SIZE },
      });
      if (i === 0) first = png;
      last = png;
      if ((i + 1) % FPS === 0 || i + 1 === total) process.stdout.write(`\r  ${i + 1}/${total} frames`);
    }
    process.stdout.write('\n');

    // The loop joins up if the last frame is the same picture as the first.
    if (first.equals(last)) console.log(`loop seam: frame 0001 = frame ${pad(total, 4)}`);
    else console.warn(`warning: frame 0001 and frame ${pad(total, 4)} differ, so the loop will jump at the seam`);

    // encode names its files from this, so they always match what was rendered.
    writeFileSync(join(FRAMES, 'render.json'),
      JSON.stringify({ no, word, fps: FPS, frames: total, loopSeconds: loop, size: SIZE }, null, 2) + '\n');

    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    console.log(`${total} frames of ${pad(no, 3)} ${word} in frames/, ${seconds} s. Next: npm run encode`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(`render: ${err.message}`);
  process.exitCode = 1;
});
