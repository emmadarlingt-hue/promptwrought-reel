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

## Tuesday

```bash
npm run tuesday -- 011
```

That one line pulls issue 011 from the site, then renders and encodes square,
portrait and vertical. You get nine files in `out/`: an MP4, a GIF and a still
for each size. It takes about 30 seconds.

- **It changes no tracked file.** It pulls the issue into `frames/issue.json`,
  which git ignores, not into `issue.json`. So it's safe to run before the
  email goes out, and nothing it does can be pushed early.
- **Post the videos after the 13:31 email.** If the issue hasn't gone out yet,
  the run ends by repeating pull-issue's warning.
- **After the send, if you like,** move the live check page to the new word:
  `python3 tools/pull-issue.py 011`, then commit and push.
- **If a step fails,** tuesday names it ("render portrait failed") and stops
  there. Each step can be run on its own with the commands below.

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

### Keeping generated folders out of iCloud

This repo is on `~/Desktop`, which iCloud Drive syncs. **The repo will move off
`~/Desktop` after 6 Oct.** Until then, the three generated folders are kept out
of iCloud, and every command still uses the usual names.

- **Why.** Each render rewrites hundreds of frames. iCloud answered with
  conflict copies such as `0078 2.png`, about 150 at a time, and once dropped
  one into `frames/square/` mid-delete, which failed the render.
- **`frames` and `out` are symlinks** to `frames.nosync` and `out.nosync`.
  iCloud skips any name ending `.nosync`.
- **`node_modules` stays a real folder**, because `npm install` replaces a
  symlinked `node_modules` with a real one. It carries the attribute iCloud
  honours instead, `com.apple.fileprovider.ignore#P`, which `npm install`
  leaves in place.
- **`npm ci` deletes `node_modules` outright.** After running it, set the
  attribute again:

  ```bash
  xattr -w 'com.apple.fileprovider.ignore#P' 1 node_modules
  ```

- **To check what iCloud thinks,** run the command below. It should show
  `isExcludedFromSync = 1`; repeat it for `out.nosync` and `node_modules`.

  ```bash
  fileproviderctl evaluate "$PWD/frames.nosync"
  ```

- **After the move off `~/Desktop`,** none of this is needed. `frames` and `out`
  can go back to being plain folders, and `.gitignore` ignores either form.

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

**Don't push an issue's `issue.json` before its email has gone out.** The repo
is public and Netlify deploys every push to `main`, so a push publishes the
word twice: on GitHub and on the reel site. The script warns on stderr while
an issue's 13:31 London send is still ahead.

To render early without touching `issue.json`, add `--to`; that's what
`npm run tuesday` does:

```bash
python3 tools/pull-issue.py 011 --to frames/issue.json
```

## The three commands

| Command | What it does | Arrives |
|---|---|---|
| `npm run preview` | Serve the folder on port 8000. Open <http://localhost:8000/reel.html> to play the loop. It needs a server because `fetch` refuses `file://`. | ✅ M1 |
| `npm run render` | Open `reel.html?render` in headless Chromium, wait for the page to be ready, then step through all 240 frames and save each one to `frames/square/` as a PNG, plus `still.png` from t = 4.4 s. Add `-- --size portrait` for 1080 × 1350, or `-- --size vertical` for 1080 × 1920, into `frames/<size>/`. | ✅ M2, portrait M3, vertical M3.5 |
| `npm run encode` | Pass `frames/square/` to ffmpeg and get `out/010-ghostwrought-square.mp4`, `.gif` and `-still.png` back. Add `-- --size portrait` or `-- --size vertical` for those sets. | ✅ M2, portrait M3, vertical M3.5 |
| `npm run check:offline` | Prove render refuses fallback fonts. It runs render with its browser cut off from the network (`tools/offline-preload.mjs`), once with nothing reachable and once with only the stylesheet. Both runs must stop with "fonts didn't load" and leave `frames/` untouched. Takes about a second. | ✅ M2 |
| `npm run check:square` | Prove the square render hasn't changed. It renders the frozen 010 fixture (`tools/fixtures/`) into a temporary folder and compares all 240 frames and the still with `tools/check-square.md5`. It leaves `issue.json` and `frames/` alone and takes about 9 seconds. After a change that's meant to show, look at the frames, then re-take the baseline with `-- --update`. | ✅ M3.5 |

Render and encode stay separate, so a failure points at one half or the other.
`npm run tuesday` (M4, above) chains them: pull-issue → render × 3 → encode × 3.
Render also takes `--issue <file>`, to draw from a file other than
`issue.json`, and `--frames <dir>`, to write somewhere other than
`frames/<size>/`. Tuesday and `check:square` use those.

`frames/` and `out/` are generated and ignored by git. Each size renders into
its own folder, so the sizes can sit side by side. Each folder's `render.json`
records which issue the frames show, and encode names its files from that
rather than from `issue.json`, which may have changed since.

### Square, portrait and vertical

One page draws all three canvases. `?size=square` is the default.

**Portrait** (`?size=portrait`, 1080 × 1350) is the 4:5 shape that takes up more
of a LinkedIn feed.

- **What moves.** The baseline keeps the same fraction of the height: 460 of
  1080, and 575 of 1350. The definition and meta line move down with it, by
  115 px in portrait.
- **What stays.** The eyebrow stays where it is, and the link stays 70 px from
  the bottom edge.

**Vertical** (`?size=vertical`, 1080 × 1920) is for Reels and TikTok. Those apps
lay their own buttons and captions over the edges of the frame, so vertical
isn't placed by the portrait rule.

- **Everything sits inside the safe zone.** That's x 65–940, y 269–1248, the
  strictest of the two apps on each edge:
  - top: Reels covers 14%;
  - bottom: Reels covers 35%;
  - left: Reels covers about 65 px;
  - right: TikTok's button column covers 140 px.

  Sources: [Hopper](https://www.hopperhq.com/blog/instagram-reel-size/),
  [1ClickReport](https://www.1clickreport.com/blog/meta-ads-creative-safe-zones-2026-guide),
  [Cadenus](https://cadenus.io/resources/blog/tiktok-safe-zone/).
- **The block is centred in that zone both ways.** The word is 780 px wide at
  rest, against 880 in the other sizes. The centre line is x 502, 38 px left of
  the frame's middle. The spacing inside the block is square's, with the link
  a fixed 160 px below the meta line.
- **The block's height is measured.** It runs from the eyebrow's ink to the
  link's ink, so a definition that wraps to more lines is re-centred
  automatically.

**For all three:**

- **The page tells the renderer what it needs.** `window.CANVAS` gives the
  canvas size, which sets the camera, and `window.STILL_SECONDS` gives the
  still's moment: 4.4 s, the middle of the hold, with the word fully
  stretched.
- **On a phone,** the page centres the tile vertically. A render's viewport is
  exactly the canvas, so the centring never shows in frames.

### The caliper

The dashed line, circle and arrow on the gold peak letter measure the letter's
real top. The page asks the canvas how far the glyph's ink actually reaches
(`actualBoundingBoxAscent`) and doesn't assume a cap height. A `w` tops out at
about 0.52 × the font size and an `f` at about 0.78 ×, so a single guess of 0.7
left the handle floating above the `w` and partway down the `f`. The letter
stretches about its baseline, so its top is always that height times its
stretch. The handle keeps the same clearance above that top for every letter,
0.1 × the font size (about 11 px on ghostwrought, 13 px on verifidget), and the
dashed line runs on up into it.

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
- **`window.__failed` is set if the page can't draw,** for example with a
  missing `issue.json` or an unknown size. The page says why on the stage and
  `__ready` never turns true. Render stops at once with the page's message and
  leaves the last good frames alone. Its 30-second timeout is only for a page
  that hangs without saying why.
- **Render refuses to use fallback fonts.** If Google Fonts can't be reached,
  it stops rather than drawing the word in Georgia. It looks in
  `document.fonts` for Playfair Display 600 and DM Sans 400 and 500 with
  status `loaded`. It deliberately doesn't use `document.fonts.check()`: with
  no network the stylesheet never arrives, there are no faces to check, and
  `check()` returns true.
- **Chromium runs with `--disable-partial-raster`.** Without it, Chromium
  repaints only the patch of the page that changed, and the faint baseline's
  edge came out one level different depending on the patch. Two frames with
  identical drawings differed, and frame 0001 didn't match frame 0240. With
  it, renders repeat byte for byte, and render checks that the first and last
  frames match.

### What encode makes

For each size, as `out/NNN-word-<size>.*`:

| File | Details |
|---|---|
| `.mp4` | H.264, `yuv420p`, CRF 18, tagged BT.709, faststart. 240 frames, 8.000 s, about 0.2 MB. |
| `.gif` | 25 fps, because GIF frame delays are whole hundredths of a second and 30 fps would drift. Two-pass palette with Bayer dithering. About 0.5 MB, and encode fails at 8 MB or more. |
| `-still.png` | The share image: the frame at t = 4.4 s, copied losslessly. About 0.1 MB. |

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
