# Content pages and the Worker, 2026-11-01

Plan tasks 2.3 to 2.7 and 3.2. Calls made while building, none of which needed the owner. Each is easy to change.

| Decision | Detail |
|---|---|
| The Worker | `src/worker.ts`, set as `main` in `wrangler.jsonc`. `output: 'server'` exists only so the adapter builds it: an integration prerenders every page, so no on-demand page exists and the 13,917 pages never run it. `pnpm dev` alone falls through to Astro's handler, and that branch is dropped from the production bundle |
| `articles.book` | Now fetched, because every article must name its work and the snapshot didn't have it. Added to the attribution fields, so a change to it is held. The compare step skips a column its baseline never had and says so in the report, so adding it didn't hold 242 rows |
| "side by side" | 265 stored grammar notes say two Arabic nouns sit "side by side". That's grammar, not the reader-layout claim the ban is for, and stored text stays as stored. So this one phrase is judged on our own copy, including outside the book page. Every other banned phrase is still scanned in all raw output |
| Stored text in the claims check | Elements marked `data-stored` hold database or enrichment text, and don't need tracing to the ledger. Banned phrases still see them. A draft line with `{}` is a template that has to match a whole string, for titles and descriptions around stored text |
| D6's letter rule | The plan's rule wasn't kept. Base Arabic letters only, with alef forms and alef maqsura folded, gives 350 sentences with different letters (349 published) against its 352 (351), and no folding gives 529 against its 530. So 2 sentences differ from the plan's count, and they can't be identified |
| Colour with no token | The classifier returned `tint` 9 times and `violet` 22 times, out of 45,000 parts. `DESIGN.md` has no token for either, so those parts stay one colour |
| Audio | Word and article audio stay on the app's Supabase bucket, as `preload="none"`, so nothing moves until a press. Copying every word, root and sentence track would add over 80,000 files, far past the 90,000 limit once pages count. The budget check allows exactly this and nothing else. `__cf_bm` from that host is still untraced, so "cookieless" stays unclaimed until task 3.3 |
| Article images | 185 distinct images on published articles, copied once into `.ship/images`, resized to at most 4 widths plus a 1200×630 `og:image`, all generated into `public/img`. One that can't be fetched costs its picture only, and the run says so. Quality 60, because article pages have a phone LCP to keep |
| LCP budget | Best of three fresh loads, because a throttled single load swung from 736 to 2,844 ms with another project building on this machine |
| Footer | A row of browse links was added above the legal row, so letter, category and scholar pages are reachable from every page. `DESIGN.md` didn't have this and it now needs saying when that file is rewritten |
| New store surface | `from=download`, for the `/download-app` page's own badges |
| `/download-app` tokens | Play gets `utm_source=web&utm_campaign=<surface>`, and marketer `utm_*` links keep their tags. Apple's `ct` waits for the provider token only the owner can generate, so App Store links are plain today. Token length is 30, per the plan |
| Search Console | The old site's HTML verification tag is on every page. Without it the property would lose verification at the cutover |
| Book page | Page count corrected to the PDF's real 411 (the old code says 308). "Free to share" stays off until the Terms exception, task 4.10. The old page's wording about the book and its author is kept and on the draft list, because that page earns 7% of search clicks |
| Analytics choice | `public/ga.js` is requested only after a visitor opts in. It carries the old worktree's two fixes: refusing empties the queue and stops other tabs. Opted in, Google's script is 186 KB gzip, measured today, and that's the recorded ceiling. No CSP exists on the site yet, so the "hash in the CSP" part of D7 isn't done |

## Found, for the owner

Article images, all 185 looked at on contact sheets, at about 240 px each, so a small detail could be missed:

- **Many carry a small "Grok" mark in the bottom-right corner.** The plan's image record has the owner holding the rights, on the owner's statement. A visible generator mark is worth a second look alongside that, and `DESIGN.md` rejects images we can date.
- **Generated lettering:** open books with script (not checked as real text), a magnifier over Arabic, Chinese-looking neon signs on city scenes, an "OPEN" sign. `DESIGN.md` rejects lettering and fake Arabic on sight. That rule was written for images we generate, and D9 keeps all of these, so nothing was changed.
- **People:** many close faces, and one woman's face close up with no hijab visible, in a car. Same rule, same outcome.
