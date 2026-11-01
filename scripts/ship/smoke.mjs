import { createHash } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

export const NOINDEX_META = /<meta\s+name="robots"\s+content="noindex[^"]*"/i;
export const sha256 = (data) => createHash('sha256').update(data).digest('hex');

const headerProblems = (route, response, production) => {
  const problems = [];
  const tagged = /\bnoindex\b/i.test(response.headers.get('x-robots-tag') ?? '');
  if (!production && !tagged) problems.push(`${route} has no "X-Robots-Tag: noindex"`);
  if (production && tagged) problems.push(`${route} still says "X-Robots-Tag: noindex" on a production ship`);
  if (response.headers.has('set-cookie')) problems.push(`${route} sets a cookie`);
  return problems;
};

/** One look at the edge. `expectedSha`, when known, also proves `/` is this build and not the one before it. */
export async function look(origin, { expectedSha = null, otherRoutes = [], fetchImpl = fetch, production = false } = {}) {
  const request = (route) => fetchImpl(`${origin}${route}`, { redirect: 'manual', headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(15_000) });
  const problems = [];
  const home = await request('/');
  if (home.status !== 200) problems.push(`/ answered ${home.status}, not 200`);
  problems.push(...headerProblems('/', home, production));
  const body = await home.text();
  if (NOINDEX_META.test(body) === production) problems.push(production ? '/ still has a noindex meta on a production ship' : '/ has no noindex meta');
  if (expectedSha && sha256(body) !== expectedSha) problems.push('/ is not the expected build: its bytes differ');
  for (const route of otherRoutes) {
    const response = await request(route);
    await response.arrayBuffer();
    if (response.status !== 200) problems.push(`${route} answered ${response.status}, not 200`);
    problems.push(...headerProblems(route, response, production));
  }
  return problems;
}

/** Retries briefly, since a new version can take seconds to reach this edge location. */
export async function smoke(origin, options = {}) {
  const { attempts = 8, waitMs = 5_000, ...lookOptions } = options;
  let problems = [];
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      problems = await look(origin, lookOptions);
    } catch (error) {
      problems = [`no answer: ${error.cause?.code ?? error.name}`];
    }
    if (problems.length === 0) return { ok: true, problems, attempts: attempt };
    if (attempt < attempts) await sleep(waitMs);
  }
  return { ok: false, problems, attempts };
}
