import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright-core';
import { fail, ROOT } from './lib.mjs';
import { pageType, routeOf } from './budgets.mjs';

const CHROMIUM = '/usr/bin/chromium';
const FIRST_LOAD = 1_000_000;
const LCP_MS = 2500;
const CLS = 0.1;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.woff2': 'font/woff2', '.png': 'image/png', '.avif': 'image/avif', '.webp': 'image/webp' };

/** A plain server over dist/client that gzips text, so transfer sizes resemble the real thing. */
function serve(clientDir) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x').pathname;
    const base = path.normalize(path.join(clientDir, url));
    const file = [base, `${base}.html`, path.join(base, 'index.html')].find(
      (candidate) => candidate.startsWith(clientDir) && fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
    );
    if (!file) {
      res.writeHead(404).end();
      return;
    }
    const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
    const body = fs.readFileSync(file);
    if (/text|json|svg/.test(type)) {
      res.writeHead(200, { 'content-type': type, 'content-encoding': 'gzip' }).end(gzipSync(body));
    } else {
      res.writeHead(200, { 'content-type': type }).end(body);
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/**
 * The browser rows of `Budgets`: no third-party request, phone first load, LCP and CLS, one page
 * per page type, at 390x664 with mobile emulation, 4x CPU and slow 4G. Lab numbers only.
 * External requests are aborted, so a seeded one never leaves this machine.
 */
export async function checkInBrowser(pages, root = ROOT) {
  if (!fs.existsSync(CHROMIUM)) fail(`${CHROMIUM} is missing, so the browser budgets can't run.`);
  const clientDir = path.join(root, 'dist/client');
  const byType = new Map();
  for (const page of pages) {
    const route = routeOf(page, clientDir);
    const { type } = pageType(route);
    if (!byType.has(type)) byType.set(type, route);
  }

  const server = await serve(clientDir);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: CHROMIUM, headless: true });
  const facts = [];
  try {
    for (const route of byType.values()) {
      const context = await browser.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
      const page = await context.newPage();
      const thirdParty = [];
      await page.route('**/*', (request) => {
        const url = request.request().url();
        if (/^(data|blob):/.test(url) || url.startsWith(origin)) return request.continue();
        thirdParty.push(url);
        return request.abort();
      });
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      let transferred = 0;
      cdp.on('Network.loadingFinished', (event) => {
        transferred += event.encodedDataLength;
      });
      await page.addInitScript(() => {
        window.__lcp = 0;
        window.__cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) window.__lcp = entry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(origin + route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const { lcp, cls } = await page.evaluate(() => ({ lcp: window.__lcp, cls: window.__cls }));
      await context.close();

      if (thirdParty.length > 0) fail(`${route} made a third-party request in the browser: ${thirdParty[0]}. Budget: none.`);
      if (transferred > FIRST_LOAD) fail(`${route} transferred ${(transferred / 1e6).toFixed(2)} MB on a phone first load, over 1 MB.`);
      if (lcp > LCP_MS) fail(`${route} LCP is ${Math.round(lcp)} ms in the lab, over ${LCP_MS} ms.`);
      if (cls > CLS) fail(`${route} CLS is ${cls.toFixed(3)} in the lab, over ${CLS}.`);
      facts.push({ route, transferred, lcp: Math.round(lcp), cls: Number(cls.toFixed(3)) });
    }
  } finally {
    await browser.close();
    server.close();
  }
  return facts;
}
