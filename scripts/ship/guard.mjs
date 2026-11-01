import fs from 'node:fs';
import path from 'node:path';
import { parse, printParseErrorCode } from 'jsonc-parser';
import { fail, LIVE_DOMAIN, LIVE_WORKER, rel, ROOT, walk, WORKER } from './lib.mjs';
import { NOINDEX_META } from './smoke.mjs';

const ROUTE_KEYS = new Set(['route', 'routes', 'custom_domain', 'custom_domains', 'zone_id', 'zone_name']);

function* entries(value, trail = []) {
  if (value === null || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const here = [...trail, key];
    yield [here, key, child];
    yield* entries(child, here);
  }
}

const isEmpty = (value) =>
  value === null || value === undefined || value === false || (Array.isArray(value) ? value.length === 0 : false);

/** Shared by the source file and the generated file, so neither can hold what the other can't. */
// The one route that may ever be added, and only under --production, after the owner has moved the domain. docs/site-plan.md Phase 6.
const LIVE_ROUTE = JSON.stringify([{ pattern: LIVE_DOMAIN, custom_domain: true }]);

function checkConfig(config, label, production = false) {
  if (config.name !== WORKER) {
    fail(`${label} names the Worker "${config.name}". Only "${WORKER}" may ship.`);
  }
  if (config.topLevelName !== undefined && config.topLevelName !== WORKER) {
    fail(`${label} has topLevelName "${config.topLevelName}". Only "${WORKER}" may ship.`);
  }
  if (config.workers_dev !== true) {
    fail(`${label} has workers_dev ${JSON.stringify(config.workers_dev)}. The preview lives on workers.dev, so it must be true.`);
  }
  if (config.env && Object.keys(config.env).length > 0) {
    fail(`${label} defines environments (${Object.keys(config.env).join(', ')}), which could carry another name or route.`);
  }
  if (Array.isArray(config.definedEnvironments) && config.definedEnvironments.length > 0) {
    fail(`${label} defines environments (${config.definedEnvironments.join(', ')}), which could carry another name or route.`);
  }
  const liveRoute = production && JSON.stringify(config.routes) === LIVE_ROUTE;
  for (const [trail, key, value] of entries(config)) {
    if (liveRoute && trail[0] === 'routes') continue;
    if (ROUTE_KEYS.has(key) && !isEmpty(value)) {
      fail(`${label} holds a route at ${trail.join('.')}: ${JSON.stringify(value)}. No routes or domains before the cutover.`);
    }
    if (typeof value === 'string') {
      if (value.toLowerCase().includes(LIVE_DOMAIN)) {
        fail(`${label} mentions ${LIVE_DOMAIN} at ${trail.join('.')}. Nothing may point at the live domain before the cutover.`);
      }
      // Exact match: configPath legitimately holds this folder's name, which is also the live Worker's.
      if (value === LIVE_WORKER) {
        fail(`${label} refers to the live Worker "${LIVE_WORKER}" at ${trail.join('.')}.`);
      }
    }
  }
}

/** wrangler.jsonc, comments ignored: its comment names the live site on purpose and has to stay. */
export function checkSourceConfig(root = ROOT, production = false) {
  const file = path.join(root, 'wrangler.jsonc');
  if (!fs.existsSync(file)) {
    fail(`wrangler.jsonc is missing. Without it the adapter names the Worker after the package or folder.`);
  }
  const errors = [];
  const config = parse(fs.readFileSync(file, 'utf8'), errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    fail(`wrangler.jsonc doesn't parse: ${printParseErrorCode(errors[0].error)} at offset ${errors[0].offset}.`);
  }
  checkConfig(config, 'wrangler.jsonc', production);
  return config;
}

/**
 * The config wrangler really uses: dist/<side>/wrangler.json, reached through the redirect in
 * .wrangler/deploy/config.json. A pure static build writes it in dist/client, a build with
 * Worker code in dist/server, so every candidate is checked.
 */
export function checkBuiltConfig(root = ROOT, production = false) {
  const dist = path.join(root, 'dist');
  const found = fs.existsSync(dist)
    ? fs
        .readdirSync(dist, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(dist, entry.name, 'wrangler.json'))
        .filter((file) => fs.existsSync(file))
    : [];
  if (found.length === 0) fail('No generated wrangler.json in dist. The build must produce one.');

  for (const file of found) {
    let config;
    try {
      config = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      fail(`${path.relative(root, file)} isn't valid JSON.`);
    }
    checkConfig(config, `Built config ${path.relative(root, file)}`, production);
  }

  const redirect = path.join(root, '.wrangler/deploy/config.json');
  if (!fs.existsSync(redirect)) fail('.wrangler/deploy/config.json is missing, so wrangler would read another config.');
  const target = path.resolve(path.dirname(redirect), JSON.parse(fs.readFileSync(redirect, 'utf8')).configPath ?? '');
  if (!found.includes(target)) {
    fail(`.wrangler/deploy/config.json sends wrangler to ${target}, not a config this guard checked.`);
  }
  return { file: path.relative(root, target), name: JSON.parse(fs.readFileSync(target, 'utf8')).name };
}

/** The other direction, for --production: a noindex left on an indexable page would take it out of Google. */
export function checkIndexable(htmlFiles, root = ROOT) {
  const headers = fs.readFileSync(path.join(root, 'dist/client/_headers'), 'utf8');
  if (/X-Robots-Tag/i.test(headers)) fail('dist/client/_headers still has X-Robots-Tag on a production build. It would take the site out of Google.');
  const allowed = new Set(['dictionary/search.html', 'analytics-choice.html']);
  for (const file of htmlFiles) {
    const name = path.relative(path.join(root, 'dist/client'), file);
    const hasMeta = NOINDEX_META.test(fs.readFileSync(file, 'utf8'));
    if (hasMeta !== allowed.has(name)) fail(`${rel(file)} ${hasMeta ? 'has a noindex meta on a production build' : 'should be noindex, and is not'}.`);
  }
}

/** Task 1.3's rule, already true: noindex by meta on every page and by header on every path. */
export function checkNoindex(htmlFiles, root = ROOT) {
  const headers = path.join(root, 'dist/client/_headers');
  const text = fs.existsSync(headers) ? fs.readFileSync(headers, 'utf8') : '';
  if (!/^\/\*\s*\n(?:[ \t]+.*\n)*?[ \t]+X-Robots-Tag:\s*noindex/im.test(text)) {
    fail('dist/client/_headers has no "X-Robots-Tag: noindex" on /*. A preview must not be indexed.');
  }
  for (const file of htmlFiles) {
    if (!NOINDEX_META.test(fs.readFileSync(file, 'utf8'))) {
      fail(`${rel(file)} has no noindex meta. A preview must not be indexed.`);
    }
  }
}
