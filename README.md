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
| `npm run render` | Open `reel.html?render` in headless Chrome, step through all 240 frames and save each one as a PNG. | M2 |
| `npm run encode` | Pass the PNGs to ffmpeg and get an MP4 and a GIF back. | M2 |

Render and encode stay separate, so a failure points at one half or the other.
`npm run tuesday` arrives at M4 and chains pull-issue → render → encode.

`reel.html` already has the hooks the render step needs. Every frame is drawn
from the time alone, so `seek(t)` draws the frame at `t` and nothing builds up
between frames. `window.LOOP_SECONDS` is `8`. `window.__ready` turns true once
`issue.json` and the fonts have loaded and been measured. If `issue.json`
can't be fetched, the page says so on the stage and `__ready` never turns
true. Adding `?render` to the URL stops the
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
