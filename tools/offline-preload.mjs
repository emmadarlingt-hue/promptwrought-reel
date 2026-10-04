// Loaded with node --import ahead of render.mjs by tools/check-offline.mjs.
// Cuts the render's browser off from the network without touching the Mac's:
// every request Chromium makes goes to a proxy at 127.0.0.1:9, where nothing
// listens, so it fails at once. Localhost bypasses the proxy, so render.mjs's
// own server still reaches the page.
//
//   OFFLINE=all    nothing outside localhost is reachable
//   OFFLINE=files  the Google Fonts stylesheet loads, the font files don't
import { chromium } from 'playwright';

const reachable = ['127.0.0.1', 'localhost'];
if (process.env.OFFLINE === 'files') reachable.push('fonts.googleapis.com');

const launch = chromium.launch.bind(chromium);
chromium.launch = (options = {}) =>
  launch({ ...options, proxy: { server: 'http://127.0.0.1:9', bypass: reachable.join(',') } });
