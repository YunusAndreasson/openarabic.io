#!/usr/bin/env node
// DESIGN.md `Review` rows for the reader, plan task 2.4, in Chromium and Zen with real input events.
// usage: node scripts/check-reader.mjs <origin> [chromium|zen] [screenshot folder]
// Zen runs headless on a throwaway profile over WebDriver BiDi, so the owner's Zen is never touched.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright-core';

const ORIGIN = process.argv[2] ?? 'http://127.0.0.1:4400';
const WHICH = process.argv[3] ?? 'chromium';
const SHOTS = process.argv[4];
const ARTICLE = '/read/' + (process.env.ARTICLE ?? fs.readdirSync('dist/client/read').find((name) => name.endsWith('-377.html')).replace('.html', ''));

async function chromiumDriver() {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 664 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  return {
    goto: (url) => page.goto(url, { waitUntil: 'load' }),
    ev: (code) => page.evaluate(code),
    key: (key) => page.keyboard.press(key),
    click: (x, y) => page.mouse.click(x, y),
    drag: async (x1, y1, x2, y2) => {
      await page.mouse.move(x1, y1);
      await page.mouse.down();
      await page.mouse.move((x1 + x2) / 2, (y1 + y2) / 2, { steps: 5 });
      await page.mouse.move(x2, y2, { steps: 5 });
      await page.mouse.up();
    },
    shot: (file) => page.screenshot({ path: file }),
    noScript: async (url) => {
      const off = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 664 } });
      const plain = await off.newPage();
      await plain.goto(url);
      const word = plain.locator('#reader a.w').first();
      const href = await word.getAttribute('href');
      await word.click();
      await plain.waitForLoadState();
      const landed = new URL(plain.url()).pathname;
      await off.close();
      return { href, landed };
    },
    quit: () => browser.close(),
  };
}

const KEYS = { Tab: '', Enter: '', Escape: '', ' ': ' ', Shift: '' };

async function zenDriver() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openarabic-zen-'));
  fs.writeFileSync(path.join(dir, 'user.js'), ['browser.shell.checkDefaultBrowser', 'datareporting.policy.dataSubmissionEnabled', 'browser.aboutwelcome.enabled'].map((name) => `user_pref("${name}",false);`).join('\n'));
  const port = 9400 + Math.floor(Math.random() * 400);
  const proc = spawn('/usr/bin/zen-browser', ['--headless', '--no-remote', '--profile', dir, `--remote-debugging-port=${port}`, '--width', '390', '--height', '664', 'about:blank'], { stdio: 'ignore', detached: true });
  let ws;
  for (let tries = 0; tries < 80 && !ws; tries += 1) {
    await sleep(500);
    try {
      const socket = new WebSocket(`ws://127.0.0.1:${port}/session`);
      await new Promise((resolve, reject) => {
        socket.onopen = resolve;
        socket.onerror = reject;
      });
      ws = socket;
    } catch {
      // Not up yet.
    }
  }
  if (!ws) throw new Error('Zen never answered.');
  let id = 0;
  const pending = new Map();
  ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (data.id && pending.has(data.id)) {
      const entry = pending.get(data.id);
      pending.delete(data.id);
      if (data.type === 'error') entry.reject(new Error(`${data.error}: ${data.message}`));
      else entry.resolve(data.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  await send('session.new', { capabilities: { alwaysMatch: {} } });
  const context = (await send('browsingContext.getTree')).contexts[0].context;
  await send('browsingContext.setViewport', { context, viewport: { width: 390, height: 664 }, devicePixelRatio: 2 });
  const pointer = (actions) => send('input.performActions', { context, actions: [{ type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions }] });
  return {
    goto: (url) => send('browsingContext.navigate', { context, url, wait: 'complete' }),
    ev: async (code) => {
      const result = await send('script.evaluate', { expression: `Promise.resolve(${code}).then((value) => JSON.stringify(value))`, target: { context }, awaitPromise: true });
      if (result.type === 'exception') throw new Error(result.exceptionDetails.text);
      const raw = result.result?.value;
      return raw === undefined ? undefined : JSON.parse(raw);
    },
    key: async (key) => {
      await send('input.performActions', { context, actions: [{ type: 'key', id: 'keys', actions: [{ type: 'keyDown', value: KEYS[key] ?? key }, { type: 'keyUp', value: KEYS[key] ?? key }] }] });
      await sleep(40);
    },
    click: (x, y) => pointer([{ type: 'pointerMove', x: Math.round(x), y: Math.round(y) }, { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 }]),
    drag: (x1, y1, x2, y2) =>
      pointer([
        { type: 'pointerMove', x: Math.round(x1), y: Math.round(y1) },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration: 80 },
        { type: 'pointerMove', x: Math.round((x1 + x2) / 2), y: Math.round((y1 + y2) / 2), duration: 80 },
        { type: 'pointerMove', x: Math.round(x2), y: Math.round(y2), duration: 80 },
        { type: 'pointerUp', button: 0 },
      ]),
    shot: async (file) => fs.writeFileSync(file, Buffer.from((await send('browsingContext.captureScreenshot', { context })).data, 'base64')),
    noScript: async () => null,
    quit: async () => {
      await send('session.end').catch(() => {});
      try {
        process.kill(-proc.pid, 'SIGTERM');
      } catch {
        // Already gone.
      }
      await sleep(500);
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

const results = [];
const check = (name, ok, detail = '') => {
  results.push(ok);
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail === '' ? '' : `: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`}`);
};
const activeName = `(() => { const e = document.activeElement; return e.id || e.className || e.tagName; })()`;
const openSheet = `!!document.querySelector('#sheet:popover-open')`;
const centerOf = (selector, index = 0) => `(() => { const r = document.querySelectorAll(${JSON.stringify(selector)})[${index}].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`;

const d = WHICH === 'zen' ? await zenDriver() : await chromiumDriver();
try {
  const url = ORIGIN + ARTICLE;
  await d.goto(url);
  await sleep(400);
  const shape = await d.ev(`({ sentences: document.querySelectorAll('.t').length, buttons: document.querySelectorAll('.t[role=button]').length, hrefs: document.querySelectorAll('#reader a[href]').length, hint: !document.getElementById('hint').hidden, plain: document.querySelectorAll('#reader p.reading:not(.t)').length, labels: [...document.querySelectorAll('.t')].every((p) => p.getAttribute('aria-label')) })`);
  check('Each tappable sentence is one button, with its own label and no word links', shape.sentences === shape.buttons && shape.hrefs === 0 && shape.hint && shape.labels, shape);

  // From the top of the page to the offer's first store link.
  const until = async (test, limit) => {
    for (let count = 1; count <= limit; count += 1) {
      await d.key('Tab');
      if (await d.ev(test)) return count;
    }
    return null;
  };
  await d.goto(url);
  await sleep(300);
  const skip = await until(`document.activeElement.classList.contains('skip')`, 12);
  check('Tabbing reaches "Skip past the text"', skip !== null, `${skip} Tabs`);
  await d.key('Enter');
  await sleep(150);
  check('Enter on it moves focus to the next section heading', (await d.ev(`document.activeElement.id`)) === 'after-h');

  await d.goto(url);
  await sleep(300);
  const before = skip ?? 0;
  const stops = await until(`!!document.activeElement.closest('.offer')`, shape.sentences + before + 3);
  check('Top of page to the first control after the text is at most sentences + 2, past the header links', stops !== null && stops - before <= shape.sentences + 2, { stops, before, sentences: shape.sentences });

  // A real click on a word, right gloss, Escape back on the same word.
  await d.goto(url);
  await sleep(300);
  const gl = await d.ev(`fetch(document.getElementById('reader').dataset.gl).then((r) => r.json())`);
  await d.ev(`document.querySelectorAll('.t')[1].scrollIntoView({ block: 'center' })`);
  await sleep(150);
  const [x, y] = await d.ev(centerOf('.t .w', 8));
  const wordIndex = await d.ev(`document.querySelectorAll('.t .w')[8].dataset.i`);
  const started = Date.now();
  await d.click(x, y);
  await sleep(350);
  const gloss = await d.ev(`document.getElementById('se').textContent`);
  check('A click on a word opens the card with its own gloss', (await d.ev(openSheet)) && gloss === gl[wordIndex][0], { gloss, wanted: gl[wordIndex][0], ms: Date.now() - started });
  if (SHOTS) await d.shot(path.join(SHOTS, `reader-card-${WHICH}.png`));
  check('Focus is on the card, so the meaning is spoken', ['sheet', 'se'].includes(await d.ev(`document.activeElement.id`)));
  const scrolled = await d.ev('scrollY');
  await d.key('Escape');
  await sleep(150);
  check('Escape closes it and returns focus to that word, with no scroll', !(await d.ev(openSheet)) && (await d.ev(`document.activeElement.dataset.i`)) === wordIndex && (await d.ev('scrollY')) === scrolled);

  await d.click(x, y);
  await sleep(350);
  const close = await d.ev(`(() => { const r = document.getElementById('sc').getBoundingClientRect(); return [r.left + 40, r.top + r.height / 2]; })()`);
  await d.click(close[0], close[1]);
  await sleep(150);
  check('Close closes it, back on that word', !(await d.ev(openSheet)) && (await d.ev(`document.activeElement.dataset.i`)) === wordIndex);

  // Keyboard: a sentence, then its words.
  await d.goto(url);
  await sleep(300);
  await d.ev(`document.querySelector('.t').focus()`);
  await d.key('Enter');
  await sleep(100);
  const first = await d.ev(`document.activeElement.classList.contains('w') && document.activeElement.getAttribute('role')`);
  check('Enter on a sentence lands on its first word', first === 'button', first);
  await d.key('Tab');
  await sleep(60);
  check('Tab moves to the next word', (await d.ev(`document.activeElement.dataset.i`)) === (await d.ev(`document.querySelector('.t .w:nth-of-type(2)')?.dataset.i ?? document.querySelectorAll('.t .w')[1].dataset.i`)));
  await d.key(' ');
  await sleep(350);
  check('Space opens that word', await d.ev(openSheet));
  await d.key('Escape');
  await sleep(100);
  await d.key('Escape');
  await sleep(100);
  check('A second Escape steps back out to the sentence', await d.ev(`document.activeElement.classList.contains('t') && document.activeElement.getAttribute('role') === 'button'`));

  // The very first gesture is a drag: selection has to work.
  await d.goto(url);
  await sleep(600);
  await d.ev(`document.querySelectorAll('.t')[1].scrollIntoView({ block: 'center' })`);
  await sleep(150);
  const [bx] = await d.ev(`(() => { const words = [...document.querySelectorAll('.t')[1].querySelectorAll('.w')]; const line = words.filter((w) => Math.abs(w.getBoundingClientRect().top - words[0].getBoundingClientRect().top) < 4); const r = line.at(-1).getBoundingClientRect(); return [r.left + 2]; })()`);
  const [fx, fy] = await d.ev(`(() => { const r = document.querySelectorAll('.t')[1].querySelector('.w').getBoundingClientRect(); return [r.right - 2, r.top + r.height / 2]; })()`);
  await d.drag(fx, fy, bx, fy);
  await sleep(250);
  const selected = await d.ev('String(getSelection())');
  check('A drag as the very first gesture selects Arabic text and opens nothing', selected.length > 3 && !(await d.ev(openSheet)), selected);

  const plain = await d.noScript(url);
  if (plain) check('With no script a word is a link to its word page', plain.href === plain.landed && plain.landed.startsWith('/word/'), plain);
  else console.log('not run: no script in this browser');

  // Reduced to what a person checks by eye.
  if (SHOTS) {
    await d.goto(url);
    await sleep(500);
    await d.shot(path.join(SHOTS, `reader-${WHICH}.png`));
  }
} finally {
  await d.quit();
}
console.log(`\n${WHICH}: ${results.filter(Boolean).length}/${results.length} passed.`);
process.exit(results.every(Boolean) ? 0 : 1);
