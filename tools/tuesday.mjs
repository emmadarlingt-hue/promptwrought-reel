// The Tuesday routine: one issue, every size, ready to post.
//
//   npm run tuesday -- 011
//
// pull-issue → render square, portrait, vertical → encode each. That makes
// nine files in out/: an MP4, a GIF and a still per size.
//
// It changes no tracked file. The issue is pulled into frames/issue.json,
// which git ignores, rather than issue.json, which Netlify deploys. So nothing
// this does can be pushed before the email goes out. Moving the live page to
// the new word is a separate step, after the send.
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ISSUE = join('frames', 'issue.json');      // relative to ROOT, where every step runs
const SIZES = ['square', 'portrait', 'vertical'];

const number = process.argv[2];
if (!/^\d+$/.test(number ?? '') || process.argv.length > 3) {
  console.error('usage: npm run tuesday -- <issue number>, e.g. npm run tuesday -- 011');
  process.exit(1);
}

const started = Date.now();
const warnings = [];

// Runs one step with its output shown as it happens, and stops the routine
// if it fails, naming the step. pull-issue's output is captured instead, so
// its warning can be repeated at the end, then printed straight away.
function step(label, command, args, { capture = false } = {}) {
  console.log(`\n── ${label}`);
  const run = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  if (capture) {
    process.stdout.write(run.stdout ?? '');
    process.stderr.write(run.stderr ?? '');
    warnings.push(...`${run.stdout}${run.stderr}`.split('\n').filter((line) => line.includes('warning:')));
  }
  if (run.error || run.status !== 0) {
    console.error(`\ntuesday: ${label} failed${run.error ? ` (${run.error.message})` : ''}. `
      + 'Nothing after it ran; fix that step and run tuesday again.');
    process.exit(1);
  }
}

step(`pull issue ${number}`, 'python3', ['tools/pull-issue.py', number, '--to', ISSUE], { capture: true });
for (const size of SIZES) step(`render ${size}`, process.execPath, ['render.mjs', '--size', size, '--issue', ISSUE]);
for (const size of SIZES) step(`encode ${size}`, process.execPath, ['encode.mjs', '--size', size]);

// The nine files this run made, named as encode names them.
const { no, word } = JSON.parse(readFileSync(join(ROOT, ISSUE), 'utf8'));
const prefix = `${String(no).padStart(3, '0')}-${word}-`;
const made = readdirSync(join(ROOT, 'out')).filter((name) => name.startsWith(prefix)).sort();
console.log(`\n── ready to post: ${made.length} files in out/, ${((Date.now() - started) / 1000).toFixed(0)} s`);
for (const name of made) {
  console.log(`  ${name.padEnd(prefix.length + 22)} ${(statSync(join(ROOT, 'out', name)).size / 1e6).toFixed(1)} MB`);
}
for (const line of warnings) console.log(`\n${line.trim()}`);
