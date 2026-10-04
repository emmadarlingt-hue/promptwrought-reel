// Prove the square render hasn't changed.
//
//   npm run check:square                compare against the baseline
//   npm run check:square -- --update    re-take the baseline after a change meant to show
//
// Renders a fixed issue (tools/fixtures/010-ghostwrought.json) into a
// temporary folder, so issue.json and frames/ are left alone, and compares the
// md5 of all 240 frames and the still with tools/check-square.md5. Renders
// repeat byte for byte (render.mjs runs Chromium with --disable-partial-raster),
// so any difference is a real change in the picture. The usual causes:
//
//   - a deliberate change to reel.html: look at it, then re-take with --update;
//   - a new Playwright, which brings a new Chromium (package.json pins it);
//   - Google changing the Playfair Display or DM Sans font files.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = join(ROOT, 'tools', 'fixtures', '010-ghostwrought.json');
const BASELINE = join(ROOT, 'tools', 'check-square.md5');

const { update } = parseArgs({ options: { update: { type: 'boolean', default: false } } }).values;

function render(into) {
  const run = spawnSync(process.execPath, [join(ROOT, 'render.mjs'), '--issue', FIXTURE, '--frames', into],
    { cwd: ROOT, encoding: 'utf8' });
  if (run.status !== 0) {
    console.log(`${run.stdout}${run.stderr}`.trim().replace(/^/gm, '      '));
    throw new Error('render failed, so there is nothing to compare.');
  }
  // "hash  name", one line per frame and the still, as md5sum writes them.
  return new Map(readdirSync(into).filter((name) => /^(\d{4}|still)\.png$/.test(name)).sort()
    .map((name) => [name, createHash('md5').update(readFileSync(join(into, name))).digest('hex')]));
}

const tmp = mkdtempSync(join(tmpdir(), 'check-square-'));
try {
  const now = render(join(tmp, 'square'));
  if (update) {
    writeFileSync(BASELINE, [...now].map(([name, hash]) => `${hash}  ${name}`).join('\n') + '\n');
    console.log(`baseline re-taken: ${now.size} files in tools/check-square.md5`);
  } else {
    const was = new Map(readFileSync(BASELINE, 'utf8').trim().split('\n')
      .map((line) => line.split(/\s+/).reverse()));
    const names = [...new Set([...was.keys(), ...now.keys()])].sort();
    const changed = names.filter((name) => was.get(name) !== now.get(name));
    if (changed.length === 0) {
      console.log(`ok    square render matches the baseline: all ${names.length} files byte-identical`);
    } else {
      process.exitCode = 1;
      const shown = changed.slice(0, 5).join(', ') + (changed.length > 5 ? ', …' : '');
      console.log(`FAIL  ${changed.length} of ${names.length} files differ from the baseline (${shown}).`);
      console.log('      If the change is meant, look at frames from npm run render, then npm run check:square -- --update.');
    }
  }
} catch (err) {
  console.log(`FAIL  ${err.message}`);
  process.exitCode = 1;
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
