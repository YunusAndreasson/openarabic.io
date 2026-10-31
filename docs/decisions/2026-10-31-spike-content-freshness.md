# Spike: how admin edits reach readers

**Status:** decided by measurement on 2026-10-31. Every edit was simulated on a local copy of the data. **Nothing was written to Supabase.** Code and raw results: `/home/yunus/Work/openarabic-spikes`.

## Decision

**One path: read a full snapshot, compare, rebuild, deploy.** It runs from a scheduled CI job every 6 hours, plus a manual "publish now" run of the same job. No admin features go on the new site. *Superseded:* this record assumed the old admin keeps writing to Supabase, but the content write migration stops that once applied. Failure handling and the guard in step 3 are also superseded by the [publishing contract](../site-plan.md#publishing-contract).

1. Fetch the snapshot: 128 sequential reads at no more than 2 a second.
2. Hash it. If nothing changed since the last published hash, stop.
3. **Check it before publishing.** Stop and alert if row counts fall sharply or many pages change at once.
4. Build and `wrangler deploy` the Worker `openarabic-site`.

**What readers see:** an edit normally reaches them within 6 hours plus about 2 minutes, or about 2 minutes with the manual run. Today it's immediate, so this is a real change for the owner. Edits have to be rare for it to be acceptable: the newest text is from 2026-03-10.

**Recovery:** `wrangler rollback` to the previous version.

## Measured

**One simulated edit run**, covering a word meaning that changes the slug, a sentence's English, and an article title.

| Step | Time |
|---|---:|
| Fetch snapshot (128 requests, 18.8 MB; fetched once and reused) | 64 s |
| Regenerate slug map and build | 17.6 s |
| Deploy, 63 of 13,656 files uploaded | 22.0 s |
| **Total** | **about 104 s** |

A run with no change stops after the fetch and hash. At 6-hourly that is 768 reads a day, against 7 per page view on the live site today.

| Effect of the edit | Result |
|---|---|
| Output files | 63 changed, 1 added, 1 removed |
| New slug `/word/anas-edited-14553` | 200 |
| Old slug `/word/anas-14553` | 308 to the new one |
| Time to visible, polled once a second | All four checks passed between 1.7 s before and 0.3 s after `wrangler deploy` returned |
| Asset cached at the edge with `max-age=600`, `HIT` before the deploy | New content on the first check after |
| Word page with `s-maxage=86400`, `HIT` before the deploy | New content on the first check after |

A deploy therefore clears edge copies of assets, so a long `s-maxage` costs no freshness. A browser `max-age` would still hold old copies, which is why word pages use `max-age=0`.

**Rollback:** 5.3 s for the command, and old content was showing at the first check 0.3 s later, and the old slug returned 200 again. I didn't check the new slug after rollback.

## Alternatives measured or rejected

| Path | Finding | Why not |
|---|---|---|
| On-demand with Workers Cache, purge on edit | Purge by tag took 65-92 ms and the next request was `MISS`, 3 of 3, at CPH | Needs the admin to call a purge, keeps Supabase on the read path, and carries the on-demand costs in the word-pages record. Purge rate limits are always Free tier, and global reach wasn't observed |
| On-demand with TTL only | Not needed; follows from the above | Staleness is the TTL anyway, with a database read on every miss |
| Supabase webhook or trigger starting a build | Not tried | Means adding a trigger to the production database. While public write policies stand, anyone could also fire builds |
| Rebuilding only changed pages | Not needed | A full build is about 14-18 s, and deploy already uploads only what changed |

## How it was measured

- A local copy of the snapshot was edited, built and deployed to the sandbox Worker, then polled with `curl` from before the build started until after the deploy finished.
- Purge used a token-guarded route on the sandbox, calling `ctx.cache.purge({ tags })`.
- Rollback targeted a known version with an explicit `--name openarabic-sandbox`.

## Limits

- **CI not built or run.** Times are from this machine. This repo has no remote yet, so the scheduler and the manual trigger are a choice, not a tested setup. The job also needs a Cloudflare API token.
- **Propagation seen from one location (CPH).** Other edge locations weren't checked.
- **6 hours is a judgement.** No data on how often the owner edits. Live table stats in `2026-10-31-content-write-fix.md` show 0 updates on content tables since about 2026-07-14, which supports it being rare, but I didn't re-read them.
- **Open write access makes step 3 essential.** Per the same record, the fix to public write policies is prepared but **not applied**. Until then, anyone holding the public key could change content that a build then publishes. Rendering escapes HTML, but false text would go out. The check thresholds aren't designed or tested yet.
- **Change detection reads everything.** Only `articles` has `content_hash`, and `roots` has no timestamp, so there's no cheaper test that catches all edits.
- **Sitewide changes are slower.** A CSS change re-uploads every page: 13,648 files, 2 min 12 s.
