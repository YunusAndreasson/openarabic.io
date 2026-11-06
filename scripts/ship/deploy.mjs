import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { bin, fail, LIVE_DOMAIN, ROOT, walk, WORKER } from './lib.mjs';

export const VERSION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PREVIEW = new RegExp(`^https://${WORKER}\\.[a-z0-9-]+\\.workers\\.dev$`);
const PUBLISHED = path.join(ROOT, '.ship/published');
// Untracked: `published` is committed, and the preview URL stays off anything that could become public.
const PREVIEW_URL = path.join(ROOT, '.ship/preview-url');

const LIVE_ORIGIN = `https://${LIVE_DOMAIN}`;
const wrangler = (args, env = {}) => bin('wrangler', args, { stdio: ['ignore', 'inherit', 'inherit'], env });

/** Checked before anything uses it, so a hand-edited record can't put another name or a flag into a wrangler command. */
export function readPublished() {
  if (!fs.existsSync(PUBLISHED)) return null;
  let record;
  try {
    record = JSON.parse(fs.readFileSync(PUBLISHED, 'utf8'));
  } catch {
    fail(".ship/published isn't valid JSON.");
  }
  if (record.worker !== WORKER) fail(`.ship/published is for "${record.worker}", not ${WORKER}.`);
  for (const entry of [record, record.previous]) {
    if (entry?.workerVersion !== undefined && !VERSION.test(entry.workerVersion)) fail(`.ship/published holds "${entry.workerVersion}", which isn't a Worker version id.`);
  }
  return record;
}

export function writePublished(record) {
  const temporary = `${PUBLISHED}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(record, null, 2)}\n`);
  fs.renameSync(temporary, PUBLISHED);
}

export const readPreviewUrl = () => {
  const url = fs.existsSync(PREVIEW_URL) ? fs.readFileSync(PREVIEW_URL, 'utf8').trim() : '';
  return PREVIEW.test(url) || url === LIVE_ORIGIN ? url : null;
};

export const writePreviewUrl = (url) => fs.writeFileSync(PREVIEW_URL, `${url}\n`);

/** What was built, recorded beside the snapshot hash, so a rebuild from the saved file can be compared. wrangler.json is left out: it holds this machine's paths. */
export function hashBuild() {
  const client = path.join(ROOT, 'dist/client');
  const hash = createHash('sha256');
  for (const file of walk(client).sort()) {
    const name = path.relative(client, file);
    if (name !== 'wrangler.json') hash.update(name).update(fs.readFileSync(file));
  }
  return hash.digest('hex');
}

/** The last stop before an upload. No --name: that would hide a wrong name in the config it uploads. */
export function uploadCommand(built) {
  console.log(`[worker] ${built.file} names: ${built.name}`);
  if (built.name !== WORKER) fail(`The built config names "${built.name}". Only "${WORKER}" may ship.`);
  return ['deploy', '--config', built.file];
}

/** Returns { version, url }. A failure here means nothing can be assumed live, and `published` stays as it was. */
export function upload(command) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'openarabic-ship-'));
  const outputFile = path.join(dir, 'wrangler-output.ndjson');
  try {
    const result = wrangler(command, { WRANGLER_OUTPUT_FILE_PATH: outputFile });
    if (result.status !== 0) return { failed: `wrangler deploy exited with ${result.status ?? result.signal}` };
    const lines = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, 'utf8').trim().split('\n') : [];
    const entry = lines.map((line) => JSON.parse(line)).findLast((line) => line.type === 'deploy');
    if (!entry) return { failed: 'wrangler deploy reported no deployment' };
    return { name: entry.worker_name, version: entry.version_id, targets: entry.targets ?? [] };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const LIVE_TARGET = /^(https:\/\/)?openarabic\.io(\/?\*?| \(custom domain\))$/;

/** Where to check a new version. Under --production that is the live domain whenever it is attached; otherwise the one workers.dev URL. Any other target is refused. */
export const previewTarget = (targets, production = false) => {
  const preview = targets.filter((target) => PREVIEW.test(target));
  const live = targets.filter((target) => LIVE_TARGET.test(target));
  if (preview.length + live.length !== targets.length) return null;
  if (production && live.length === 1 && preview.length <= 1) return LIVE_ORIGIN;
  return live.length === 0 && preview.length === 1 ? preview[0] : null;
};

/** The name is this constant, in every caller. Never an argument. */
export function rollbackTo(target, reason) {
  return wrangler(['rollback', target.workerVersion, '--name', WORKER, '--yes', '--message', reason]).status === 0;
}

export const rollbackCommandText = (target, reason) => `wrangler rollback ${target.workerVersion} --name ${WORKER} --yes --message "${reason}"`;
