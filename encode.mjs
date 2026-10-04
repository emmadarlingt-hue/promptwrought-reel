// Turn frames/<size>/ into out/NNN-word-<size>.mp4, .gif and -still.png.
//
//   npm run encode                      square
//   npm run encode -- --size portrait   portrait
//
// Reads frames/<size>/render.json, written by npm run render, so the files are
// named after what was actually rendered rather than whatever issue.json says now.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'out');

// GIF frame delays are whole hundredths of a second. 25 fps is exactly 4 of
// them; 30 fps would have to be rounded, and the 8-second loop would drift.
const GIF_FPS = 25;
const GIF_LIMIT = 8_000_000;    // bytes; the plan's ceiling for posting

const pad = (n, width) => String(n).padStart(width, '0');
const mb = (file) => (statSync(file).size / 1e6).toFixed(1);

function ffmpeg(args) {
  const run = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (run.error?.code === 'ENOENT') throw new Error('ffmpeg is not installed. brew install ffmpeg, then try again.');
  if (run.error) throw run.error;
  if (run.status !== 0) throw new Error(`ffmpeg stopped with exit code ${run.status}`);
}

function main() {
  const { size } = parseArgs({ options: { size: { type: 'string', default: 'square' } } }).values;
  if (!/^[a-z]+$/.test(size)) throw new Error(`"${size}" is not a size. Use square or portrait.`);
  const FRAMES = join(ROOT, 'frames', size);
  const again = `npm run render${size === 'square' ? '' : ` -- --size ${size}`}`;

  const manifest = join(FRAMES, 'render.json');
  if (!existsSync(manifest)) throw new Error(`there is no frames/${size}/render.json. Run ${again} first.`);
  const { no, word, fps, frames } = JSON.parse(readFileSync(manifest, 'utf8'));
  for (const file of [...Array.from({ length: frames }, (_, i) => `${pad(i + 1, 4)}.png`), 'still.png']) {
    if (!existsSync(join(FRAMES, file))) throw new Error(`frames/${size}/${file} is missing. Run ${again} again.`);
  }

  mkdirSync(OUT, { recursive: true });
  const name = `${pad(no, 3)}-${word}-${size}`;
  const input = ['-framerate', String(fps), '-i', join(FRAMES, '%04d.png')];

  // MP4: H.264 in yuv420p, which is what LinkedIn and Substack accept. The
  // conversion uses BT.709 and the file says so, so players turn the teal and
  // gold back into the right colours. The tags are set in the filter chain
  // with setparams: ffmpeg lets the frames' own colour properties override
  // -color_primaries / -color_trc given as output options. faststart lets it
  // play before it has finished downloading.
  const mp4 = join(OUT, `${name}.mp4`);
  ffmpeg([...input,
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,'
      + 'setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    '-movflags', '+faststart', mp4]);
  console.log(`${relative(ROOT, mp4)}  ${mb(mp4)} MB`);

  // GIF, in two passes. The first finds the 256 colours this loop actually
  // uses, so cream and gold don't band. The second maps every frame onto them.
  // Bayer dithering keeps the same pattern from frame to frame, where error
  // diffusion would shimmer, and diff_mode=rectangle re-encodes only the part
  // of each frame that changed: the word.
  const palette = join(FRAMES, 'palette.png');
  ffmpeg([...input, '-vf', `fps=${GIF_FPS},palettegen=stats_mode=diff`, '-update', '1', palette]);
  const gif = join(OUT, `${name}.gif`);
  ffmpeg([...input, '-i', palette,
    '-lavfi', `fps=${GIF_FPS}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
    '-loop', '0', gif]);
  console.log(`${relative(ROOT, gif)}  ${mb(gif)} MB`);

  // The still is already a lossless PNG at full size, so it is copied as it is.
  const still = join(OUT, `${name}-still.png`);
  copyFileSync(join(FRAMES, 'still.png'), still);
  console.log(`${relative(ROOT, still)}  ${mb(still)} MB`);

  if (statSync(gif).size >= GIF_LIMIT) {
    throw new Error(`${relative(ROOT, gif)} is ${mb(gif)} MB, over the 8 MB limit for posting.`);
  }
}

try {
  main();
} catch (err) {
  console.error(`encode: ${err.message}`);
  process.exitCode = 1;
}
