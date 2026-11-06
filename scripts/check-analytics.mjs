#!/usr/bin/env node
// Plan task 3.4's GA4 tests, in Chromium and a throwaway headless Zen: no request to Google and no cookie before opting in, on 5 page types; opt-in fires; refuse clears.
// Requests to Google are stopped at the browser, so these runs add nothing to the property. usage: node scripts/check-analytics.mjs <origin>
import fs from 'node:fs';
import { chromium } from 'playwright-core';
import { CHROMIUM } from './ship/lib.mjs';
import { zenSession } from './zen-driver.mjs';

const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:4400';
const read = fs.readdirSync('dist/client/read')[0].replace('.html', '');
const word = fs.readdirSync('dist/client/word')[0].replace('.html', '');
const PAGES = ['/', `/read/${read}`, `/word/${word}`, '/dictionary', '/privacy'];
let failed = 0;
const check = (name, ok, detail = '') => {
  if (!ok) failed += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
};

async function run(name, driver) {
  for (const route of PAGES) {
    await driver.goto(ORIGIN + route);
    const seen = driver.google();
    check(`${name}: ${route} makes no Google request and has no cookie, no choice made`, seen.length === 0 && (await driver.ev('document.cookie')) === '', seen[0] ?? '');
  }
  await driver.goto(`${ORIGIN}/analytics-choice`);
  check(`${name}: the status says it is off`, /have not made a choice/.test(await driver.ev(`document.getElementById('choice-status').textContent`)));
  await driver.ev(`document.querySelector('[data-choice=granted]').click()`);
  await driver.wait(500);
  check(`${name}: Allow asks for Google's script at once`, driver.google().length > 0);
  driver.reset();
  await driver.goto(`${ORIGIN}/privacy`);
  await driver.wait(300);
  check(`${name}: and on the next page`, driver.google().length > 0);
  await driver.ev(`document.cookie = "_ga=GA1.1.1; path=/"`);
  await driver.goto(`${ORIGIN}/analytics-choice`);
  await driver.wait(300);
  driver.reset();
  await driver.ev(`document.querySelector('[data-choice=denied]').click()`);
  await driver.wait(200);
  const state = await driver.ev(`({ cookie: document.cookie, off: window['ga-disable-G-00Q1GM3YQP'] === true, queue: (window.dataLayer || []).length })`);
  check(`${name}: Refuse removes the cookie, disables it here and empties the queue`, state.cookie === '' && state.off && state.queue === 0, JSON.stringify(state));
  driver.reset();
  await driver.goto(`${ORIGIN}/`);
  await driver.wait(300);
  check(`${name}: nothing to Google after refusing`, driver.google().length === 0);
}

const browser = await chromium.launch({ executablePath: CHROMIUM, headless: true });
const context = await browser.newContext();
const page = await context.newPage();
let google = [];
await page.route(/googletagmanager|google-analytics/, (route) => {
  google.push(route.request().url());
  return route.abort();
});
await run('chromium', { goto: (url) => page.goto(url, { waitUntil: 'load' }), ev: (code) => page.evaluate(code), wait: (ms) => page.waitForTimeout(ms), google: () => google, reset: () => (google = []) });
await browser.close();

const zen = await zenSession();
await zen.block(/googletagmanager|google-analytics/);
await run('zen', { goto: zen.goto, ev: zen.ev, wait: zen.wait, google: () => zen.blocked, reset: () => (zen.blocked.length = 0) });
await zen.quit();
console.log(failed === 0 ? '\nAll passed.' : `\n${failed} failed.`);
process.exit(failed === 0 ? 0 : 1);
