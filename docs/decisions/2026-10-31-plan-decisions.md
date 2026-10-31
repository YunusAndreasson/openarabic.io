# Site plan decisions, 2026-10-31

The owner's answers to the decisions in `docs/site-plan.md`. D12, D13, D14 and D15 stay open, because they depend on work not yet done.

| # | Decision | Answer | Consequence |
|---|---|---|---|
| D1 | Content write migration | Apply. The owner runs it from a run sheet: `docs/decisions/2026-10-31-migration-run-sheet.md` | Admin edits, image changes and review approvals stop. The pipeline needs the service key first |
| D2 | Old admin | `admin.openarabic.io` behind Cloudflare Access | No code change or deploy. The owner sets it up in the dashboard at cutover. The Worker stays as the rollback target |
| D3 | Workers plan | Paid | 100,000 files, no 10 ms CPU limit. The owner confirms the account's plan |
| D4 | Build and deploy | "we only need to build from this repo like 'pnpm ship'" | **No CI, no hosted repo and no scheduled job.** One local command fetches, checks, builds, deploys and smoke-tests. Content changes reach readers only when the owner runs it. The rating refreshes only then too |
| D5 | Word colour on iPhone | The owner looks once on an iPhone they have, using a preview link | Only that iOS version is seen. Older versions fall to one colour through a gate nobody has seen working, so that stays unverified |
| D6 | Reader Arabic | `word_form` where its letters match the sentence; the stored `arabic`, with no tapping, on the 352 where they don't | Nothing is altered. The 352 are listed for the owner |
| D7 | GA4 check | Allow one inline check, 0.25 KB at most, on every page | Word and other "0 JS" pages become "0 JS except this check". The opted-in state has its own ceiling |
| D8 | App Store rating | `/download-app` only | |
| D9 | Article images | Keep all 202. **The owner confirmed they hold the rights;** this is the owner's statement, and no licence records were seen or checked | Article pages need an image in `DESIGN.md`. Images are copied into the build and resized, with `og:image` set per article |
| D10 | Contact and deletion address | `yunus@edenmind.com` | The site publishes it instead of `support@openarabic.io`. No form and no third party |
| D11 | Universal links | Not at cutover | `.well-known` files return 404 until the next app release. The site never promises them |
| D16 | Preview deploys | Allow, for `openarabic-site` on its `workers.dev` URL, noindexed, after the ship guard exists | Becomes the one exception to the `AGENTS.md` deploy rule |
