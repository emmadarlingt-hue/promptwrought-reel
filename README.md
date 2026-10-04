# promptwrought-reel

The Promptwrought word of the week as a square motion loop, made to be posted.

`reel.html` is the drawing. It shows one issue's word as an 8-second loop at
1080 × 1080, the word stretching letter by letter against a locked baseline.
It started as tile 10, elastic type, of Charlie Hills' Opus 5.5 Motion
Graphics board, and was adapted to the emmadarling.dev palette. The word,
definition, date and link come from `issue.json`, so the same page draws any
issue.

This folder exists to turn that page into a video, the same way every week.
`BUILD-PLAN.md` lays out how, one milestone at a time.

## Setup, once per clone

```bash
npm install
```

```bash
npx playwright install chromium
```

The first installs Playwright, pinned to 1.63.0 in `package.json`. The second
downloads the Chromium build that version uses, and does nothing if it is
already there. They are separate on purpose, so that installing never
downloads a browser without asking.

## Pulling an issue

```bash
python3 tools/pull-issue.py 010
```

This copies `../promptwrought-site/issues/010-*.json` to `issue.json` and adds
the two fields the site never stores: `date` ("29 Sept 2026") and `issueLabel`
("Issue 010 · 29 Sept 2026"). It works the date out the same way the site's
`build-lexicon.py` does: the Tuesday of ISO week `no` + 30. It only ever reads
the site's files.

`issue.json` is generated, so don't edit it by hand. Re-run the script instead.
It is committed, because the deployed page fetches it.

**Don't push an issue's `issue.json` before its email has gone out.** Once
Netlify is linked to this repo, a push puts the word on the reel site. The
script warns on stderr while an issue's 13:31 London send is still ahead.
Pulling early to render on the Mac is fine.

## The three commands

| Command | What it does | Arrives |
|---|---|---|
| `npm run preview` | Serve the folder on port 8000. Open <http://localhost:8000/reel.html> to play the loop. It needs a server because `fetch` refuses `file://`. | ✅ M1 |
| `npm run render` | Open `reel.html?render` in headless Chromium, wait for the page to be ready, then step through all 240 frames and save each one to `frames/` as a PNG. | ✅ M2 |
| `npm run encode` | Pass `frames/` to ffmpeg and get `out/010-ghostwrought.mp4` and `.gif` back. | ✅ M2 |

Render and encode stay separate, so a failure points at one half or the other.
`npm run tuesday` arrives at M4 and chains pull-issue → render → encode.

`frames/` and `out/` are generated and ignored by git. `frames/render.json`
records which issue the frames show, and encode names its files from that
rather than from `issue.json`, which may have changed since.

### How the render works

A video render is a camera asking the page "what do you look like at 1.6
seconds?" 240 times, and the page has to give the same answer each time.

- **`seek(t)` draws from the time alone.** Every frame is a function of `t`,
  so the frame at `t` comes out the same however it was reached.
  `window.LOOP_SECONDS` is `8`.
- **`?render` stops the live playback,** so nothing moves between a `seek` and
  its screenshot.
- **`window.__ready` turns true** once `issue.json` and the fonts have loaded
  and been measured. Render waits for it before clearing or writing any frame.
  If the page can't draw, it says why on the stage, `__ready` never turns
  true, and render stops after 30 seconds with that message and leaves the
  last good frames alone.
- **Render refuses to use fallback fonts.** If Google Fonts can't be reached,
  it stops rather than drawing the word in Georgia.
- **Chromium runs with `--disable-partial-raster`.** Without it, Chromium
  repaints only the patch of the page that changed, and the faint baseline's
  edge came out one level different depending on the patch. Two frames with
  identical drawings differed, and frame 0001 didn't match frame 0240. With
  it, renders repeat byte for byte, and render checks that the first and last
  frames match.

### What encode makes

| File | Details |
|---|---|
| MP4 | H.264, `yuv420p`, CRF 18, tagged BT.709, faststart. 240 frames, 8.000 s, about 0.2 MB. |
| GIF | 25 fps, because GIF frame delays are whole hundredths of a second and 30 fps would drift. Two-pass palette with Bayer dithering. About 0.5 MB, and encode fails at 8 MB or more. |

## Tools on this Mac

Checked on 4 Oct 2026, on the Mac and not in Cowork:

| Check | Result |
|---|---|
| `which ffmpeg` | `/opt/homebrew/bin/ffmpeg`, ffmpeg 9.0.2 via Homebrew, so no install needed |
| `node -v` | `v24.21.0`, with npm 11.19.0 |

## Live copy

The folder is deployed to Netlify as `promptwrought-reel`, so the loop can be
checked on a phone at every stage:

<https://promptwrought-reel.netlify.app/reel.html>

The site root has no page yet, so open `reel.html` itself.
