# openarabic-web

## Hard rules

- **Deploy only to the Worker `openarabic-site`,** set in `wrangler.jsonc`. `openarabic-web` was the old admin panel's Worker, deleted on 2026-11-08. Keep that file, because without it the adapter would name the Worker after this folder.
- **Keep the one custom domain in `wrangler.jsonc`.** A deploy without it could detach the live site. Add no other route or domain.
- **openarabic.io has been served by `openarabic-site` since 2026-11-02.** Every deploy goes live: `pnpm ship --production`, only when the owner asks. Never run `wrangler deploy` directly, including `--temporary`, which needs no login: it skips every check. A plain `pnpm ship` is refused while the domain is in `wrangler.jsonc`.
- **Treat Supabase as production.** Read only, with throttled requests, and never print or commit keys.
- **No admin work here.** The old site is abandoned and this one only promotes the app: no admin, accounts or sign-up. `open-arabic` and its worktrees are read only from this repo.

## Commands

pnpm, with exact pins. Don't copy the spike's `wrangler.jsonc`, `astro.config.mjs` or `deploy.sh`: they point at the deleted sandbox.

| Task | Command |
|---|---|
| Dev | `pnpm dev` |
| Everything except the upload, the one check to run at the end | `pnpm ship --production --dry-run` |
| Prove the ship's guards still work, after changing `scripts/ship*` | `pnpm ship:test`, about a minute. `pnpm ship:test:unit` alone takes seconds |
| Deploy, which goes live; undo it | `pnpm ship --production`; `pnpm ship:rollback` |
| Generate tokens after changing `DESIGN.md` | `pnpm tokens` |
| Make the app screens after a recapture, from `src/lib/captures.mjs` | `node scripts/captures.mjs`; `--hash` prints each source's hash to record |
| Reader's and GA4's real-input checks, on a served build | `node scripts/check-reader.mjs <origin> chromium\|zen`; `node scripts/check-analytics.mjs <origin>` |
| Serve a build locally, no upload | `wrangler dev -c dist/server/wrangler.json --port 4400` |
| Prove the Worker name, after a build | `grep -o '"name":"[^"]*"\|"routes"' dist/*/wrangler.json` prints only `openarabic-site`. A `--name` flag would hide a wrong name |
| Zen, without touching the owner's | `zen-browser --headless --no-remote --profile "$(mktemp -d)" --screenshot /tmp/z.png <url>` |

CI (`.github/workflows/verify.yml`) runs `pnpm ship:test` on every push and pull request, on fixture data, and never deploys. No schedule exists, and content reaches readers only when someone runs `pnpm ship`. `origin` is the public `YunusAndreasson/openarabic.io`: push `main` only when the owner asks.

## Read first

| Before | Read |
|---|---|
| Any UI, CSS or layout | `DESIGN.md` |
| Any public sentence | `PRODUCT.md`: use ledger wording; banned phrases stay banned even if asked for. Other new copy is listed as draft |
| Any image | `DESIGN.md` `Imagery`: Codex generates, Claude directs and critiques every candidate. App UI is always a real capture, and images hold no lettering |
| Word tapping, reader or JS | `docs/decisions/2026-10-31-spike-word-tap.md` |
| Word pages, Worker config or cache | `docs/decisions/2026-10-31-spike-word-pages.md`, `docs/decisions/2026-11-01-content-pages.md` |
| Fetching data or publishing edits | `docs/decisions/2026-10-31-spike-content-freshness.md` |
| URLs and redirects | `docs/research/current-site.md`, `docs/decisions/2026-10-31-spike-category-urls.md` |
| Build order and scope | `docs/site-plan.md` |
| Anything an owner settled | `docs/decisions/2026-10-31-owner-review.md`, `docs/decisions/2026-11-01-owner-go.md`. They override the plan and research |

The repository is public. `docs/site-plan.md`, `docs/research/current-site.md` and the other files under `Private records` in `.gitignore` hold production, account and traffic details, so they stay on the owner's machine and are never committed. Write nothing like them into a tracked file.

## Decisions

These say how to build what a task asks for. They aren't a to-do list: don't add routes, generators or fonts the task didn't ask for, and name them in your last message instead.

**Prerender or on-demand.** Default to a prerendered file. On-demand costs 16 ms CPU per render and 7 Supabase reads per miss.

| Request | Answer |
|---|---|
| Word, article, category, author, book, story and legal pages | Prerendered static file |
| Bare-id or stale word URL, real 404, `/word/*/` | Worker: 308 or 404 |
| `/?category=N` | Worker: 301 to `/category/<name>`, keeping other params. Assets ignore the query and `_redirects` can't match it |
| `/download-app?to=&from=` | Worker: counts the tap with no cookie and no script |
| `/dictionary/search?q=` | Worker: fills the prerendered file from its bundled index. `docs/decisions/2026-11-01-dictionary-search.md` |
| Any other on-demand route | Not without a new decision record |

**Island or plain script.** No islands: no `client:*`, no UI framework, no `ClientRouter`. The hard cap is 1.5 KB gzip of JS on any page except the home page, which is the app's promo and has 60 KB of JS and 24 KB of CSS (`docs/decisions/2026-10-31-home-rebuild.md`).

| Surface | Markup | JS, gzip |
|---|---|---|
| Home page | Static HTML, played by `src/scripts/home.ts`. Tappable words stay `<button popovertarget>` with one popover per word. Reads whole with no script | At most 60 KB |
| Article reader | `<a class=w href=/word/slug data-i=N>`, one shared `popover`, glosses in `/gl/<id>.json` fetched on first pointer contact, plain external deferred script. Words stay links with JS off | 1 KB |
| Word, dictionary, category, legal | No tappable words | 0 |
| Every page | One inline GA4 choice check, counted on top of the above. Visitors who haven't opted in make no third-party request | At most 0.25 KB |

**Arabic text.**

- Never normalise or alter vocalised text you show: no `.normalize()`, mark stripping, re-vocalising, kashida or joining. The one exception is the throwaway copy used for the letter comparison below. If stored text looks wrong, show it as stored and report it.
- The reader shows `sentence_words.word_form`, in `position` order with real spaces, where its letters match `article_sentences.arabic`. On the 350 where they don't, it shows the stored `arabic`, with no tapping. 3 sentences have no words: report them, don't fill them in.

## Done

1. `pnpm ship --production --dry-run` passes. It proves the Worker name is `openarabic-site` with only the live domain. Steps marked `NOT BUILT` aren't passes.
2. UI: the `DESIGN.md` `Review` rows your change touches were run.
3. UI: checked once in Zen, with Chromium second. Green in Chromium alone isn't a pass.
4. Copy: every sentence is in `PRODUCT.md` or on a draft list.
5. Your last message lists what you did not verify. No iPhone or WebKit is available here, so those stay unproven.
