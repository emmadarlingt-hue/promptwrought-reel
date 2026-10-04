# promptwrought-reel

The Promptwrought word of the week as a square motion loop, made to be posted.

`reel.html` is the source. It is one self-contained HTML file that draws a
single issue's word as an 8-second loop at 1080 × 1080: issue 010,
*ghostwrought*, stretching letter by letter against a locked baseline. It
started as tile 10, elastic type, of Charlie Hills' Opus 5.5 Motion Graphics
board, and was adapted to the emmadarling.dev palette. It is copied in
unchanged from `../opus-5-5-motion-graphics/effect-10-elastic-type.html`.

This folder exists to turn that file into a video, the same way every week.
`BUILD-PLAN.md` lays out how, one milestone at a time.

## The three commands

None of these exist yet. M0 only sets up the folder, the repo and the deploy.

| Command | What it will do | Arrives |
|---|---|---|
| `npm run preview` | Serve the folder and play the loop in a browser. It needs a server because `reel.html` will fetch `issue.json`, and `fetch` refuses `file://`. | M1 |
| `npm run render` | Open `reel.html?render` in headless Chrome, step through all 240 frames and save each one as a PNG. | M2 |
| `npm run encode` | Pass the PNGs to ffmpeg and get an MP4 and a GIF back. | M2 |

Render and encode stay separate, so a failure points at one half or the other.
`npm run tuesday` arrives at M4 and chains pull-issue → render → encode.

`reel.html` already has the hooks the render step needs. Every frame is drawn
from the time alone, so `seek(t)` draws the frame at `t` and nothing builds up
between frames. `window.LOOP_SECONDS` is `8`. `window.__ready` turns true once
the fonts have loaded and been measured. Adding `?render` to the URL stops the
live playback, so frames can be stepped one at a time.

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
