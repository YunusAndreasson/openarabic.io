# Cutover runbook

**Done 2026-11-02, by a simpler route than steps 3 and 4 below.** With the domain in `wrangler.jsonc`, `pnpm ship --production` moved it in one call. To roll back now, use `pnpm ship:rollback`, which returns `openarabic-site` to its previous version; the old `openarabic-web` Worker this runbook moved the domain from was deleted on 2026-11-08.

`docs/site-plan.md` Phase 6, as built. The plan's rehearsal on a throwaway hostname is skipped unless the owner names one. That means the domain's behaviour across a deploy is checked for the first time at step 6, on the live domain.

## State of the plan's gate, 2026-11-01

| Line | State |
|---|---|
| Migration hand checks (0.4) | **Not recorded.** Owner |
| Admin at its new host; Supabase auth settings checked (D2, 0.9) | **Open.** Owner |
| Parity 100% with noindex off | Offline yes. On Cloudflare at step 2, on the apex at step 5 |
| Budgets, draft copy, `og` image | Done, draft copy approved |
| Legal pages 200, deletion email | Done; the owner confirmed the mail |
| iPhone | **Skipped by the owner, risk accepted.** Unseen |
| T1 and T2 reported, decisions recorded | T1 reported; D13 at its default. **T2 not done:** the line isn't checked against a printed edition |
| Screen reader tasks (5.7) | **Not rerun on the built pages.** The 2.0 contract was tested on specimens, and the same script ships |
| Rehearsal | **Skipped** |

## Steps

| # | Who | Step | Check |
|---|---|---|---|
| 1 | Agent | Set `PRODUCTION_ALLOWED = true` in `scripts/ship/lib.mjs`. | |
| 2 | Agent | `pnpm ship --production`. Uploads to `openarabic-site`, on workers.dev, with noindex off. Canonicals point at openarabic.io, and nothing links to it | Smoke and parity pass |
| 3 | Owner | Cloudflare, Workers & Pages, `openarabic-web`, Settings, Domains & Routes: add `admin.openarabic.io`, then put an Access policy on it allowing only your email. Skip only if you don't need admin | Admin login works |
| 4 | Owner | Same page: remove `openarabic.io` from `openarabic-web`. Then `openarabic-site`, Settings, Domains & Routes, Add, Custom domain: `openarabic.io`. **Do these back to back:** the site is down between them. Never deploy to, rename or delete `openarabic-web` | `openarabic.io` answers from the new site |
| 5 | Agent | Run the plan's smoke list and parity against `https://openarabic.io` | 100% |
| 6 | Agent | Add `"routes": [{ "pattern": "openarabic.io", "custom_domain": true }]` to `wrangler.jsonc`, then one more `pnpm ship --production`. **Required before any later deploy:** Cloudflare's docs say a deploy overrides dashboard routes, and say nothing on custom domains | Domain still attached; the site still answers |
| 7 | Owner, or agent on your go | Submit `https://openarabic.io/sitemap.xml` in Search Console | Accepted; 13,914 URLs |

## Rollback

- **A bad deploy on the new site:** `pnpm ship:rollback`.
- **The new site is failing:** the owner reverses step 4, moving `openarabic.io` back to `openarabic-web`. That restores the false claims and consent-less GA4, so it's a stopgap.
- **Trigger in the first 24 hours:** a store-required page not 200, a `noindex` on an indexable page, a broken store redirect, a sustained error rate. A rankings dip on day one is not a trigger.
- **Keep `openarabic-web` alive** after cutover.

## After

- Turn off the `workers.dev` URL once the apex has held for a day: it serves indexable copies, with canonicals to the apex. The guard requires `workers_dev: true` today, so this needs a guard change and a smoke target on the apex.
- Plan Phase 7: Search Console by page type against the baseline, weekly for 8 weeks.
