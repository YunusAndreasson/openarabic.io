# openarabic-web

## Hard rules

- **Never deploy to, rename or delete the Worker `openarabic-web`.** It serves the live openarabic.io and its admin panel. This repo's Worker is `openarabic-site`, set in `wrangler.jsonc`. Keep that file, because without it the adapter would name the Worker after this folder.
- **Never add a route or custom domain for openarabic.io.** The cutover happens only on the owner's explicit go.
- **The only deploy allowed is `pnpm ship`, to the noindexed `workers.dev` preview of `openarabic-site`.** Never run `wrangler deploy` directly, including `--temporary`, which needs no login: it skips every check. Production is cutover, on the owner's explicit go only.
- **Treat Supabase as production.** Read only, with throttled requests, and never print or commit keys.
- **No admin work here.** The old site is abandoned and this one only promotes the app: no admin, accounts or sign-up. `open-arabic` and its worktrees are read only from this repo.

## Commands

pnpm, with exact pins. Don't copy the spike's `wrangler.jsonc`, `astro.config.mjs` or `deploy.sh`: they point at the deleted sandbox.

| Task | Command |
|---|---|
| Dev | `pnpm dev` |
| Everything except the upload, the one check to run at the end | `pnpm ship --dry-run` |
| Prove the ship's guards still work, after changing `scripts/ship*` | `pnpm ship:test` |
| Deploy to preview; undo it | `pnpm ship`; `pnpm ship:rollback` |
| Generate tokens after changing `DESIGN.md` | `pnpm tokens` |
| Prove the Worker name, after a build | `grep -o '"name":"[^"]*"\|"routes"' dist/*/wrangler.json` prints only `openarabic-site`. A `--name` flag would hide a wrong name |
| Zen, without touching the owner's | `zen-browser --headless --no-remote --profile "$(mktemp -d)" --screenshot /tmp/z.png <url>` |

**Asked to put it live? Don't, and say why:** that's cutover, and only the owner can call it. No CI, hosted repo or schedule exists, and content reaches readers only when someone runs `pnpm ship`. Never push git.

## Read first

| Before | Read |
|---|---|
| Any UI, CSS or layout | `DESIGN.md` |
| Any public sentence | `PRODUCT.md`: use ledger wording; banned phrases stay banned even if asked for. Other new copy is listed as draft |
| Any image | `DESIGN.md` `Imagery`: Codex generates, Claude directs and critiques every candidate. App UI is always a real capture, and images hold no lettering |
| Word tapping, reader or JS | `docs/decisions/2026-10-31-spike-word-tap.md` |
| Word pages, Worker config or cache | `docs/decisions/2026-10-31-spike-word-pages.md` |
| Fetching data or publishing edits | `docs/decisions/2026-10-31-spike-content-freshness.md` |
| URLs and redirects | `docs/research/current-site.md`, `docs/decisions/2026-10-31-spike-category-urls.md` |
| Build order and scope | `docs/site-plan.md` |
| Anything an owner settled | `docs/decisions/2026-10-31-owner-review.md`. It overrides the plan and research |

## Decisions

These say how to build what a task asks for. They aren't a to-do list: don't add routes, generators or fonts the task didn't ask for, and name them in your last message instead.

**Prerender or on-demand.** Default to a prerendered file. On-demand costs 16 ms CPU per render and 7 Supabase reads per miss.

| Request | Answer |
|---|---|
| Word, article, category, author, book, story and legal pages | Prerendered static file |
| Bare-id or stale word URL, real 404, `/word/*/` | Worker: 308 or 404 |
| `/?category=N` | Worker: 301 to `/category/<name>`, keeping other params. Assets ignore the query and `_redirects` can't match it |
| `/download-app?to=&from=` | Worker: counts the tap with no cookie and no script |
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
- The reader shows `sentence_words.word_form`, in `position` order with real spaces, where its letters match `article_sentences.arabic`. On the 352 where they don't, it shows the stored `arabic`, with no tapping. 3 sentences have no words: report them, don't fill them in.

## Done

1. `pnpm ship --dry-run` passes. It proves the Worker name is `openarabic-site` with no routes. Steps marked `NOT BUILT` aren't passes.
2. UI: the `DESIGN.md` `Review` `[T]` rows your change touches were run.
3. UI: checked once in Zen, with Chromium second. Green in Chromium alone isn't a pass.
4. Copy: every sentence is in `PRODUCT.md` or on a draft list.
5. Your last message lists what you did not verify. No iPhone or WebKit is available here, so those stay unproven.
