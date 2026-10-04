// Prove render.mjs refuses to render on fallback fonts.
//
//   npm run check:offline
//
// Runs the real render.mjs twice with its browser cut off from the network
// (see offline-preload.mjs), once with nothing reachable and once with the
// stylesheet but not the font files. Each run must stop with "fonts didn't
// load" and leave frames/ exactly as it was. Exits 1 if either does not.
//
// This exists because render does not use document.fonts.check(). With no
// network the stylesheet never arrives, there are no faces to check, and
// check() returns true. A guard nobody can re-prove quickly stops being
// trusted, so this re-proves it in a few seconds.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FRAMES = join(ROOT, 'frames');
const PRELOAD = pathToFileURL(join(ROOT, 'tools', 'offline-preload.mjs')).href;

const CASES = [
  ['all', 'nothing reachable'],
  ['files', 'stylesheet but no font files'],
];

// Every file under frames/ (square/ and portrait/ alike) with its size and
// modification time, so "untouched" means untouched, not merely "still has
// 240 files".
function snapshot() {
  if (!existsSync(FRAMES)) return 'no frames/';
  return readdirSync(FRAMES, { recursive: true }).sort()
    .map((name) => { const s = statSync(join(FRAMES, name)); return `${name}:${s.size}:${s.mtimeMs}`; })
    .join('\n');
}

let failed = 0;
for (const [mode, label] of CASES) {
  const before = snapshot();
  const run = spawnSync(process.execPath, ['--import', PRELOAD, join(ROOT, 'render.mjs')], {
    cwd: ROOT,
    env: { ...process.env, OFFLINE: mode },
    encoding: 'utf8',
  });
  const output = `${run.stdout}${run.stderr}`;
  const refused = run.status !== 0 && output.includes("fonts didn't load");
  const untouched = snapshot() === before;

  if (refused && untouched) {
    console.log(`ok    ${label}: render refused (fonts didn't load), frames/ untouched`);
  } else {
    failed++;
    console.log(`FAIL  ${label}: ${refused ? 'refused' : `exit ${run.status}, no font refusal`}, `
      + `frames/ ${untouched ? 'untouched' : 'CHANGED'}`);
    console.log(output.trim().replace(/^/gm, '      '));
  }
}

if (failed) process.exitCode = 1;
else console.log('render will not draw the word in a fallback font.');
