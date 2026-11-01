// Zen, headless, on a throwaway profile over WebDriver BiDi, so the owner's Zen is never touched.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

export async function zenSession({ width = 1200, height = 800, prefs = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openarabic-zen-'));
  const all = { 'browser.shell.checkDefaultBrowser': false, 'datareporting.policy.dataSubmissionEnabled': false, 'browser.aboutwelcome.enabled': false, ...prefs };
  fs.writeFileSync(path.join(dir, 'user.js'), Object.entries(all).map(([name, value]) => `user_pref("${name}",${JSON.stringify(value)});`).join('\n'));
  const port = 9400 + Math.floor(Math.random() * 400);
  const proc = spawn('/usr/bin/zen-browser', ['--headless', '--no-remote', '--profile', dir, `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore', detached: true });
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
  const blocked = [];
  let blockPattern = null;
  let send;
  const listeners = [];
  ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    for (const listener of listeners) listener(data);
    if (data.id && pending.has(data.id)) {
      const entry = pending.get(data.id);
      pending.delete(data.id);
      if (data.type === 'error') entry.reject(new Error(`${data.error}: ${data.message}`));
      else entry.resolve(data.result);
    } else if (data.method === 'network.beforeRequestSent' && data.params.isBlocked) {
      const url = data.params.request.url;
      if (blockPattern?.test(url)) {
        blocked.push(url);
        send('network.failRequest', { request: data.params.request.request }).catch(() => {});
      } else send('network.continueRequest', { request: data.params.request.request }).catch(() => {});
    }
  };
  send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      id += 1;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  await send('session.new', { capabilities: { alwaysMatch: {} } });
  const context = (await send('browsingContext.getTree')).contexts[0].context;
  await send('browsingContext.setViewport', { context, viewport: { width, height } });
  return {
    onEvent: (listener) => listeners.push(listener),
    send,
    context,
    blocked,
    block: async (pattern) => {
      blockPattern = pattern;
      await send('session.subscribe', { events: ['network.beforeRequestSent'] });
      await send('network.addIntercept', { phases: ['beforeRequestSent'] });
    },
    goto: (url) => send('browsingContext.navigate', { context, url, wait: 'complete' }),
    ev: async (code) => {
      const result = await send('script.evaluate', { expression: `Promise.resolve(${code}).then((value) => JSON.stringify(value))`, target: { context }, awaitPromise: true });
      if (result.type === 'exception') throw new Error(result.exceptionDetails.text);
      const raw = result.result?.value;
      return raw === undefined ? undefined : JSON.parse(raw);
    },
    wait: (ms) => sleep(ms),
    shot: async (file) => fs.writeFileSync(file, Buffer.from((await send('browsingContext.captureScreenshot', { context })).data, 'base64')),
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
