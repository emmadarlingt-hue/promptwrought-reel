# Promptwrought reel — build plan

Planned 4 Oct 2026. One 8-second motion loop per issue, rendered to MP4 and GIF from the issue JSON, for LinkedIn / Substack Notes / the post header each Tuesday.

Status: M0–M3.5 done 4 Oct 2026. Netlify deploys from `main` and the repo is public. Next: M4.

## What it is

Charlie Hills' tile 10 (elastic type), already recoloured into the emmadarling.dev tokens as `opus-5-5-motion-graphics/effect-10-elastic-type.html`, with issue 010 typed in by hand. The build removes the typing: the page reads the issue data from a file, a script renders it to video, and the Tuesday routine gains one command.

Analogy: right now the tile is a letterpress block with "ghostwrought" carved into it. We're turning it into a frame with movable type — same press, new word every week.

## Decisions (made while reading the real files)

1. It lives in its own folder and repo, `promptwrought-reel`, not in `promptwrought-site`. The site's CLAUDE.md is firm: Python standard library only, no package manifest, and a push to `main` is a publication. Rendering a browser to video needs Playwright (a Node dependency) and ffmpeg. Neither belongs in that repo. The reel reads the site's `issues/0NN-word.json` by path and never writes back.
2. The date is computed, not stored. `issues/010-ghostwrought.json` has `no`, `word`, `pos`, `definition`, `issueUrl` — no date. `build-lexicon.py` derives it: ISO week = `no` + 30 in 2026, release day Tuesday. A small Python script in the reel folder uses the same rule and writes `issue.json` with a `date` added ("29 Sept 2026" — the card's existing style). Keeping the rule in Python mirrors the site's own tool, so if the volume changes the two can be fixed side by side.
3. The page stays a pure `seek(t)`. Every frame is a function of time, no accumulated state. That is what makes frame-by-frame rendering deterministic and what makes the loop seamless (frame 0 and the last frame are the same picture).
4. Square first, portrait second. 1080×1080 is what the tile already is and what LinkedIn and Substack both accept. 1080×1350 portrait comes at M3 once square is proven.
5. Public repo, like the other seven — the `seek(t)` pattern is a portfolio talking point in itself. (Created private at M0; flip when M2 has something worth reading.)
6. Automation last, and never inside the site's PR. Tuesday is one hand-run command until the whole thing has survived three real issues. An Action, if wanted, runs in the reel repo on a button press (`workflow_dispatch`), fetching the JSON from the site's raw URL.
7. Command names (settled at M0): `npm run preview` (local server), `npm run render` (frames), `npm run encode` (ffmpeg → MP4/GIF). Render and encode stay separate so a failure at M2 points at one half. M4 adds `npm run tuesday`, which chains pull-issue → render → encode.
8. The plan lives in the repo. `BUILD-PLAN.md` (this file) and a short `CLAUDE.md` (read BUILD-PLAN first; the site's issue JSON is read-only; the page stays a pure `seek(t)`), so Claude Code never has to guess from one pasted milestone.

## Milestones

Each one ends with a commit and push. Open each in Claude Code in plan mode; M2 touches the only genuinely new machinery, so read its plan slowly.

### M0 — Folder, repo, first push ✅ 4 Oct 2026

- Folder `Desktop/Coding Projects/promptwrought-reel`; repo `emmadarlingt-hue/promptwrought-reel` (private for now).
- `reel.html` is a byte-identical copy of `effect-10-elastic-type.html`. README + `.gitignore` added.
- Mac check: ffmpeg 9.0.2 at `/opt/homebrew/bin/ffmpeg`, Node v24.21.0 — both noted in the README.
- Netlify project `promptwrought-reel` deployed by folder upload: https://promptwrought-reel.netlify.app/reel.html (bare address 404s; fine). Not yet linked to the repo — link it in the dashboard (Project configuration → Build & deploy → Link repository; no build command, publish directory root) so pushes deploy from M1 on.
- Phone: square sits at the top with teal below because the tile fixes `viewport` at 1080 — correct for a square video; revisit at M3.

### M1 — The page reads its words from a file ✅ 4 Oct 2026

- `tools/pull-issue.py 010` copies `../promptwrought-site/issues/010-*.json` to `issue.json` beside `reel.html`, adding `date` (Tuesday of week `no`+30) and `issueLabel` ("Issue 010 · 29 Sept 2026").
- `reel.html` replaces its hard-coded WORD / SUMMARY / META / LINK constants with a `fetch('issue.json')`, and waits for both the JSON and `document.fonts.ready` before the first `seek(0)`.
- Preview with `npm run preview` (a local server — fetch refuses `file://`, same lesson as the site).
- Run it for issue 009 too. If verifidget's definition wraps differently and the layout survives, M1 is done.
- You learn: the separation of data from drawing — the same split as `issues/*.json` → `index.html` on the site, now applied to motion. Also why `fetch` needs a server.

### M2 — Render to video ✅ 4 Oct 2026

- `render.mjs` (Node + Playwright): opens `reel.html?render`, waits for `window.__ready`, then for each of 240 frames (8 s × 30 fps) calls `seek(t)` and screenshots `frames/0001.png` … (`npm run render`).
- ffmpeg stitches frames → `out/010-ghostwrought.mp4` (H.264, `yuv420p`, so LinkedIn and Substack accept it) and → `out/010-ghostwrought.gif` (two-pass palette, so cream and gold don't band) (`npm run encode`).
- Checks before commit: frame 0001 and frame 0240 are identical (loop seam); file plays in QuickTime; GIF under 8 MB.
- You learn: why `?render` turns off the `requestAnimationFrame` loop — a video render is a camera asking the page "what do you look like at 1.6 seconds?" 240 times, and the page must give the same answer each time. Also the first Node dependency you've managed yourself (`package.json`, `node_modules` in `.gitignore`).

### M3 — Portrait and a still ✅ 4 Oct 2026

- `npm run render -- --size portrait` → 1080×1350; the page reads a `?size=` parameter and moves the baseline and summary block, nothing else.
- A still PNG from the hold (t = 4.4 s) as a share image.
- You learn: parameterising one drawing for two canvases without copying the file.

### M3.5 — Vertical, a truer caliper, a fast refusal ✅ 4 Oct 2026

- `?size=vertical` → 1080×1920 for Reels / TikTok. The block is centred within the apps' safe zone, the part of the frame their own buttons and captions don't cover, not placed by the `SHIFT` rule.
- The caliper measures the peak glyph's real top instead of cap height, so on a tall peak such as the `f` in verifidget and handfinish it sits on the letter rather than partway down it. This changes square's frames on purpose, so square's hash baseline is re-taken afterwards.
- A `window.__failed` flag, set when the page refuses to draw, so a refused render exits at once instead of after the 30-second wait.
- Added while finishing: the handle keeps a fixed clearance of 0.1 × S above the letter's real top, the same for every letter. `npm run check:square` re-proves the square render against a committed hash baseline in about 9 s. `frames`, `out` and `node_modules` are kept out of iCloud until the repo moves off `~/Desktop` after 6 Oct.
- You learn: designing around another app's interface, measuring the ink rather than trusting a font metric, and making failure as quick to see as success.

### M4 — The Tuesday command

- One line in the README's Tuesday section: `npm run tuesday -- 011` = pull-issue → render square + portrait + still → encode.
- Run it live for 011 handfinish on 6 Oct (or 012 if M2 isn't done by then). Post the MP4. That's the acceptance test.
- Optional, after three issues have gone through by hand: a `workflow_dispatch` Action in this repo that does the same on a runner and attaches the files as a build artifact.
- You learn: npm scripts as a way of naming a routine, and the discipline of automating a thing only after it's boring.

### M5 — Check

- Batch-render all ten past issues. Any layout that breaks on a long definition (ghostwrought's is the longest so far) gets fixed in the page, not by editing the JSON.
- `/accessibility-review` is not relevant to a video; instead write the alt text template for the post into the README ("The word X stretching letter by letter on a baseline, with its definition").
- Known and left alone: on a phone, `reel.html?size=vertical` is about 80 px taller than Safari's visible area, so it starts at the top and scrolls a little rather than centring. Only the check page is affected; the video is what matters.

## Not doing (and why)

- Not adding anything to `promptwrought-site` — the house rules, and the publish gate, stay intact.
- Not putting motion on promptwrought.com or emmadarling.dev from this work — the mobile LCP work on emmadarling.dev comes first.
- Not using HyperFrames for this one — the tile is already a pure `seek(t)` SVG and needs only a camera, not a second authoring model. HyperFrames stays the tool for the longer reels in `videos/`.
