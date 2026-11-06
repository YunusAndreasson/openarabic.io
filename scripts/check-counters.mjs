#!/usr/bin/env node
// Plan task 3.0: when the page-view image misses and when it double-counts, cold, cached and with images off, in Chromium and Zen.
// Counts requests for /v as the browser sees them. usage: node scripts/check-counters.mjs <origin>
import { chromium } from 'playwright-core';
import { CHROMIUM } from './ship/lib.mjs';
import { zenSession } from './zen-driver.mjs';

const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:4400';
const A = `${ORIGIN}/privacy`;
const B = `${ORIGIN}/terms`;
const rows = [];
const row = (browser, name, expected, got) => {
  rows.push([browser, name, expected, got]);
  console.log(`${browser} | ${name} | wanted ${expected} | got ${got}`);
};

async function scenario(browser, driver) {
  const views = async (action) => {
    driver.reset();
    await action();
    await driver.wait(600);
    return driver.views();
  };
  row(browser, 'First visit, cold', 1, await views(() => driver.goto(A)));
  row(browser, 'Same page, reload', 1, await views(() => driver.reload()));
  row(browser, 'Second page', 1, await views(() => driver.goto(B)));
  row(browser, 'Back', 'unknown', await views(() => driver.back()));
  row(browser, 'Forward', 'unknown', await views(() => driver.forward()));
}

async function chromiumRun(args, name) {
  const browser = await chromium.launch({ executablePath: CHROMIUM, headless: true, args });
  const page = await (await browser.newContext()).newPage();
  let count = 0;
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/v') count += 1;
  });
  await scenario(name, {
    goto: (url) => page.goto(url, { waitUntil: 'load' }),
    reload: () => page.reload({ waitUntil: 'load' }),
    back: () => page.goBack({ waitUntil: 'load' }),
    forward: () => page.goForward({ waitUntil: 'load' }),
    wait: (ms) => page.waitForTimeout(ms),
    reset: () => (count = 0),
    views: () => count,
  });
  await browser.close();
}

async function zenRun(prefs, name) {
  const zen = await zenSession({ prefs });
  let count = 0;
  await zen.send('session.subscribe', { events: ['network.beforeRequestSent'] });
  zen.onEvent((data) => {
    if (data.method === 'network.beforeRequestSent' && new URL(data.params.request.url).pathname === '/v') count += 1;
  });
  await scenario(name, {
    goto: zen.goto,
    reload: () => zen.send('browsingContext.reload', { context: zen.context, wait: 'complete' }),
    back: () => zen.send('browsingContext.traverseHistory', { context: zen.context, delta: -1 }),
    forward: () => zen.send('browsingContext.traverseHistory', { context: zen.context, delta: 1 }),
    wait: zen.wait,
    reset: () => (count = 0),
    views: () => count,
  });
  await zen.quit();
}

await chromiumRun([], 'Chromium');
await chromiumRun(['--blink-settings=imagesEnabled=false'], 'Chromium, images off');
await zenRun({}, 'Zen');
await zenRun({ 'permissions.default.image': 2 }, 'Zen, images off');

const crawler = await fetch(`${ORIGIN}/v?p=word`, { headers: { 'user-agent': 'Googlebot/2.1' } });
console.log(`Crawler answer: ${crawler.status}, ${crawler.headers.get('cache-control')}, cookie: ${crawler.headers.has('set-cookie')}`);
