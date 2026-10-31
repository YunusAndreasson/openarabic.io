# Spike: prerender or on-demand for 13,627 word pages

**Status:** decided by measurement on 2026-10-31. Code and raw results: `/home/yunus/Work/openarabic-spikes`.

## Decision

**Prerender all 13,627 pages as static assets**, with these settings:

- `Cache-Control: public, max-age=0, s-maxage=86400` on `/word/*` in `public/_headers`. The edge serves hits, browsers always revalidate, and a deploy clears the edge (see the freshness record).
- `prerenderEnvironment: 'node'`, `build.format: 'file'`, `trailingSlash: 'never'`.
- A small Worker only for what files can't answer: bare-id and stale-slug 308s, real 404s, and `/word/*/` through `run_worker_first`, because assets alone answer that path with a 307.

Hits are equally fast either way, so speed isn't the reason. Prerendering wins on misses, on the load it spares the database the app shares, and on CPU.

## Measured

**Response time on the sandbox.** Milliseconds from end of TLS to first byte, single requests from this machine. Run 2 was all one edge location (CPH) on a quiet connection. Run 1 was split across ARN and AMS on a noisy one, under default asset headers, so its hit and repeat rows aren't comparable.

| Path | n | Run 2 p50 | Run 2 p90 | Run 1 p50 |
|---|---:|---:|---:|---:|
| Prerendered, first hit at this edge | 30 | **251** | 313 | 322 |
| Prerendered, edge hit (`s-maxage`) | 60 | **15** | 120 on the first pass, 19 on the second | not tested |
| Prerendered, default `max-age=0, must-revalidate` | 30 | not rerun | not rerun | 141 |
| On-demand, Workers Cache miss | 15 | **341** | 643 | 612 |
| On-demand, Workers Cache hit | 30 | **15** | 17-19 | 110-170, some misses |
| On-demand, no cache | 15 | **573** | 740 | 631 |
| 308 from a stale or bare-id URL | 15 | 72 | 274 | 488 |
| Live site, `/word/anas-14553`, first byte | 5 | 22 (streamed shell) | 414 | not tested |

Full response, run 2 p50: prerendered hit 59 ms, Workers Cache hit 61 ms, on-demand no cache 599 ms, live site 378 ms. Brotli body: 2.5 KB for a prerendered word page against 14.9 KB on the live site, though the spike template is not the final design.

**Worker CPU per request, from `wrangler tail`.**

| Route | p50 | Max |
|---|---:|---:|
| On-demand render, no cache | 16 ms | 39 ms across both runs |
| 308 redirect (335 KB slug map bundled) | 3-7 ms | 20 ms |
| `/`, Worker then asset | 0 ms | 1 ms |
| Prerendered word page | Worker not invoked: 0 of 90 requests in the log, and 0 of 2 in a separate check where `/` did appear. The log missed some `/` requests in the long run, so the separate check is the firmer one |

Workers Free allows 10 ms CPU per request, and on-demand rendering exceeds that at p50. Every request still returned `ok`, and I don't know which plan this account is on.

**Database load.**

| Path | Supabase requests |
|---|---:|
| Prerender: whole snapshot, sequential, 500 rows a page, 2 a second | **128 per build**, 64 s, 18.8 MB |
| On-demand: one cache miss, same sequence as the live site | 7 |
| On-demand: warming all pages once | About 95,000, and again after every deploy, since a deploy emptied Workers Cache |

**Build, on this machine (8 cores, 31 GB).** Build from the local snapshot, no network, 13,659 files of output.

| Measure | Result |
|---|---:|
| Three repeat builds | 13.8, 13.9, 14.8 s |
| First cold build | 33.5 s |
| Prerender under `workerd`, the adapter default | **Failed at 5 s**: it can't read the local snapshot file (`/bundle/data/snapshot.json`). I didn't try to make it work |

**Files against Cloudflare's limits.** 20,000 per version on Free, 100,000 on Paid, per the [limits page](https://developers.cloudflare.com/workers/platform/limits/).

| Output | Files | Size |
|---|---:|---:|
| Word pages | 13,627 | median 6.0 KB, p95 10.3 KB, max 24.4 KB |
| Whole spike | 13,659 | 92 MB |

Projection for the real site, **calculated, not built**: 13,627 word + 242 read + 239 glossary + 28 letter + 16 author + 7 category + about 20 other pages and assets + 59 images at 4 widths = **about 14,415 files, leaving about 5,600 on Free**. Generating responsive images for more than a few sizes is what could change this.

**Deploy to the sandbox.**

| Case | Files uploaded | Total time |
|---|---:|---:|
| First deploy | 13,653 | 3 min 47 s |
| Sitewide change (CSS is inlined, so every page changes) | 13,648 | 2 min 12 s |
| 63 pages changed | 63 | 22 s |
| 3 files changed | 3 | 25 s |

The very first attempt failed with `fetch failed` after 41 s, and an immediate retry worked. CI should retry.

Worker bundle: 1.9 MB, 586 KB gzip, startup 14-25 ms, including the 1.2 MB enrichment file only the on-demand routes need. A prerender-only Worker would be smaller (not built).

## How it was measured

- Worker `openarabic-sandbox` on workers.dev, noindexed by header and meta, verified on every route type, then deleted.
- Real Supabase snapshot. Page template follows the live word page: entry, enrichment, up to 24 examples, up to 12 related words, JSON-LD.
- `curl` with a new connection per request, one request at a time. On-demand requests were 3.5 s apart, to keep Supabase at about 2 reads a second on average.
- Seeded random word samples, different samples per path.

## Limits

- **One machine, up to three edge locations (ARN, AMS, CPH).** Nothing here shows latency elsewhere, and 71% of clicks are on mobile. No field data and no real phones.
- **Live-site baseline is 5 samples.**
- **Workers plan not verified.** This decides whether the 10 ms limit applies and whether the Free file limit is the relevant one. Check the dashboard.
- **CI build time not measured.** A runner will be slower than this machine.
- **Spike template only.** Final HTML size and build time will move, and generated images aren't included.
- **`cacheCloudflare()` not used.** I tested plain Workers Cache with `Cache-Control` and `Cache-Tag`. Tiered behaviour across locations wasn't observed.
- **Search effect of these changes not measured.** Bare-id and stale-slug 308s and the 404s match `current-site.md`'s parity rules. `/word/x/` reached 308 only through the `run_worker_first` pattern above.
