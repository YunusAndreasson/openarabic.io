# Spike: `/?category=` pages

**Status:** decided by measurement on 2026-10-31. Code and raw results: `/home/yunus/Work/openarabic-spikes`.

## Decision

**Move them.** Each category becomes a prerendered page at `/category/<name>`, and a short check in the Worker 301s the old URLs. `/` needs `run_worker_first` for this, and nothing else about `/` changes.

| Request | Answer on the sandbox |
|---|---|
| `/?category=1` | 301 to `/category/aqeedah`, which returns 200 |
| `/?category=1&utm_source=x` | 301 to `/category/aqeedah?utm_source=x` |
| `/?category=99`, `/?category=abc`, `/?category=` | 301 to `/` |
| `/?utm_source=x` | 200, no redirect, so campaign links are safe |

The 7 sitemap URLs change to the new paths, with canonicals to match. All 7 categories have published texts: aqeedah 43, fiqh 16, hadith 22, quran 6, seerah 50, ihsan 79, tafsir 23.

## Why

What is at stake, from `current-site.md`, over 133 days of Search Console: 7 sitemap URLs, 5 of them seen by Google, **0 clicks, 64 impressions**, average position 10.4. `/?category=1` is indexed. No hard-coded external target in that research points at these URLs.

Keeping the query URLs would cost about the same and leave the site with query-based canonicals for pages worth nothing in search. Moving makes them ordinary files, and a 301 keeps whatever value they hold.

## Measured

Milliseconds from end of TLS to first byte, run 2, one edge location (CPH), n=15-40.

| Path | p50 | p90 |
|---|---:|---:|
| Plain asset, no Worker | 49 | 55-72 |
| `/` through the Worker to the asset | 53 | 97-165 |
| `/?category=2`, 301 | 13 (Workers Cache `HIT`) | 16-19 |
| `/?category=2&keep=1`, the rejected keep option, 200 | 33 | 36-39 |

- **Cost of the Worker on `/`:** about 4 ms at p50, 0-1 ms of CPU, and one Worker request per home page view. `wrangler tail` confirmed the Worker ran for `/` but not for a word page.
- **Doing nothing is not an option.** Assets ignore the query, so `/plain-home?category=1` returned that page with 200. `/?category=1` would duplicate the home page.
- **`_redirects` can't do this.** A rule for `/plain-home?category=1` also redirected plain `/plain-home`, so the query isn't matched. It would have redirected the whole home page.

## How it was measured

Worker `openarabic-sandbox`, `curl`, new connection per request. The keep option served the prerendered category file through `env.ASSETS.fetch` at the old URL, and is measured above.

## Limits

- **How Google handles the move is not measured.** Recrawl dates in `current-site.md` suggest months to show.
- **The 301 was cached.** The sandbox had Workers Cache on and the 301 showed `HIT`, cleared by a deploy. With Workers Cache off in production, the Worker would answer it instead (wall time about 5 ms). I didn't run that exact setup.
- **Latency is from one machine and one location.**
- **The `/category/` path and the raw names are provisional.** Display names belong to the site plan.
- **IG, Facebook and other outside links** to these URLs can't be seen from here.
