# CLAUDE.md

**Read `BUILD-PLAN.md` first.** It says what this repo is for, which decisions
are already made, and which milestone comes next. Do not reopen a decision it
records.

Two rules hold at every milestone:

- **The issue JSON in `../promptwrought-site/issues/` is read-only.** The reel
  reads those files by path and never writes back. That means no edits, no new
  files and no commits in `promptwrought-site` from here. A push to that repo's
  `main` publishes the site. If a word's text breaks the layout, fix
  `reel.html`, not the JSON.
- **The page stays a pure `seek(t)`.** Every frame is drawn from `t` alone.
  Nothing carries over from one frame to the next: no CSS animations or
  transitions, no tween libraries, no unseeded randomness, and no clock read
  inside the drawing code. Only the `requestAnimationFrame` driver at the end
  of `reel.html` reads the clock, and `?render` switches it off. Keep
  `window.seek`, `window.LOOP_SECONDS`, `window.__ready`, `window.__failed`,
  `window.CANVAS` and `window.STILL_SECONDS` working, because the renderer
  depends on them. This is what makes a render deterministic and
  the loop seamless: the first and last frames are the same picture.

**Before committing** a change to `reel.html` or `render.mjs`, run
`npm run check:square` and `npm run check:offline`. If `check:square` fails
because of a change you meant, show the frames before re-taking the baseline
with `-- --update`. Never re-take it just to make the check pass.

**Until the repo moves off `~/Desktop` (after 6 Oct),** `frames` and `out` are
symlinks to `*.nosync` folders that iCloud skips. Don't replace them with real
folders. The README's "Keeping generated folders out of iCloud" section has the
details.
