# Spike: tapping a word, and the JS budget

**Status:** decided by measurement on 2026-10-31. Not tested on any iPhone. Code and raw results: `/home/yunus/Work/openarabic-spikes` (`tests/`, `results/`).

## Decision

Colour-only adjacent spans inside an `inline-block` word, with these rules:

| Page | Word markup | Sheet content | JS |
|---|---|---|---|
| Article reader | `<a class=w href=/word/slug data-i=N>` | One shared `popover`, filled from a per-article `/gl/<id>.json` fetched on first pointer contact | `tap-final.js`, 614 B gzip |
| Story page (a few words, concept A) | `<button popovertarget>` with one popover per word | In the HTML | Only the old-iOS gate (below) |
| Word, dictionary, category, legal pages | No tappable words | None | 0 |

- **With JS off:** reader words stay links to the word page, which has the meaning, grammar notes and audio. Story words still open their popover.
- **With JS on:** the script removes each word's `href`. Otherwise mouse selection fails: a drag started on a word selected nothing in Chromium, and `draggable=false` fixed this only in Zen.
- **Two shaping rules at build time:**
  1. A mark-only segment takes its base letter with it.
  2. A kasra or shadda left of a boundary before ي moves into the ي's span. Without this Zen visibly misshapes the word. Concept A's line has this shape in فَكَأَنِّي.
- **Old iOS:** where `CSS.supports('field-sizing:content')` is false, the script unwraps words to one colour. This stays unproven until it runs on a device.

## JS budget

| Page type | Budget | Measured or reserved |
|---|---|---|
| Word, dictionary, category, legal | 0 KB | 0 B shipped in the spike |
| Article reader | 1 KB gzip for tapping | 1,256 B minified, 614 B gzip, 498 B brotli |
| Story page | 0.25 KB gzip for the gate | Gate's size not measured alone; it is one line of `tap-final.js` |
| Any page, hard cap | 1.5 KB gzip | Leaves about 0.5 KB for the store-tap counter, which is **not built or measured** |
| Reader HTML | 12 KB brotli at the longest article | 7.1 KB measured |
| Per-article glossary, loaded on contact | 25 KB brotli | 20.0 KB at the longest article |

This replaces the 3 KB reader and 5 KB cap in `platform-2026.md`, which were judgement.

## Measured

**Page weight, real data.** Longest article: id 377, 467 words. Median article: id 372, 142 words. Sizes are local brotli of the built HTML. Chromium is at 4x CPU with emulated slow 4G, 5 fresh loads, median.

| Variant | 377 raw | 377 brotli | 372 brotli | DOM nodes (377) | LCP (Chromium) |
|---|---:|---:|---:|---:|---:|
| Plain text, no spans | 15.6 KB | 3.8 KB | 2.0 KB | 69 | 436 ms |
| Spans, not tappable | 31.9 KB | 4.4 KB | 2.2 KB | 844 | 564 ms |
| A: one popover per word, no JS | 230.3 KB | 28.8 KB | 9.6 KB | 3,028 | 1,012 ms |
| B: links + inline JSON glossary | 152.0 KB | 27.1 KB | 9.1 KB | 852 | 704 ms |
| **C: links + lazy glossary (chosen)** | 45.0 KB | 7.1 KB | 3.1 KB | 851 | 588 ms |

Per-word popovers cost about 52 B brotli per word, which is fine for a nine-word line and wrong for an article. Zen load times swung too widely to rank (3 runs, same variant up to 5 s), so only Chromium's are given.

**Tap, chosen variant, article 377, 10 words spread through the page.** Pointer down to the frame after the popover opened.

| Browser and setting | Right gloss | Tap to next frame, p50 / max | Handler, p50 / max |
|---|---:|---:|---:|
| Chromium 154, touch, no throttle | 10/10 | 32 / 34 ms | 0.9 / 1.7 ms |
| Chromium 154, touch, 4x CPU | 10/10 | 44 / 88 ms | 1.4 / 4.2 ms |
| Chromium 154, touch, 6x CPU | 10/10 | 46 / 87 ms | 2.4 / 4.2 ms |
| Zen 1.23.2b (Gecko 157), touch | 10/10 | 43 / 51 ms | under the 16 ms reporting threshold |
| Zen 1.23.2b, mouse | 10/10 | 19 / 27 ms | under the threshold |

All are under Nielsen's 100 ms. Variant A's worst tap was 202 ms at 6x CPU against 87 ms for C. All four variants gave 10/10 in both browsers.

**First tap, glossary not yet loaded (Chromium, 4x CPU, slow 4G, 5 runs).** The sheet opens at once. The gloss fills 287-309 ms after contact. To reach the same state without slow 4G: 18-74 ms across the Chromium and Zen runs. In practice the first scroll touch on the reader also starts the fetch, though that path wasn't timed separately.

**Removing the links.** 2 ms for 467 words in Chromium, 7.5 ms at 4x CPU, 12.2 ms at 6x. Zen: 3.5 ms for 142 words.

**Shaping.** Each word was rendered plain and split, forced to white, and compared within one engine. 3,044 of 11,383 distinct split forms were tested (the most frequent, plus every form with a colour boundary inside an Amiri ligature), covering 60.7% of multi-colour word tokens.

| Share of the word's ink that differs | Chromium: forms / tokens | Zen, before the ي rule: forms / tokens |
|---|---:|---:|
| 0% | 2,011 / 9,018 | 2,970 / 12,610 |
| Under 1% | 789 / 2,546 | 12 / 24 |
| 1-5% | 244 / 1,336 | 47 / 157 |
| 5% or more | 0 / 0 | 15 / 109 |

- **Zen:** every form in the 5%-or-more row has the boundary directly before ي, such as لِ|ي at 7.1%. Rendered alone at 64 px, 7 such forms differ by 11.8-14.7% in Zen, and by 0% once the kasra moves into the ي's span. Across a whole article with the rule on, Zen differs from unsplit words by 0% (372) and 0.011% (377).
- **Chromium:** nothing reached 5%. The small differences look like edge smoothing at colour boundaries, from looking at enlarged words rather than from a measurement. In Chromium, splitting can also shift words by a fraction of a pixel and rewrap a line in a long article, so the whole-page diff (2.6-7.7%) overstates the change.
- **Ligatures:** 78 of 21,239 multi-colour words (0.37%) have a boundary inside an Amiri ligature, per HarfBuzz. None of those tested reached 5% in either browser.

**No JS, with JS disabled in the browser.**

| Variant | Chromium 154 | Zen 1.23.2b |
|---|---|---|
| Popover per word | Opens, with the correct text read back | Page visibly changes on tap. Scripting is off, so text couldn't be read back |
| Reader links (B, C, chosen) | Goes to `/word/bakr-5423` | Goes to `/word/bakr-5423` |

**Selection, mouse drag along the first line, article 372.**

| Markup | Chromium 154 | Zen 1.23.2b |
|---|---|---|
| Plain text, spans | 53 chars | 53 chars |
| `<button>` word | **0** | **0** |
| `<a href>` word | **0** | **0** |
| `<a href draggable=false>` | **0** | 53 |
| Chosen (`href` removed by script) | 53 | 53 |

Selecting a whole sentence by script returned the page's exact text, spaces included, in every variant and both browsers.

**Other checks.** Enter on a focused word opens the sheet in both, tested with a synthetic key event. Audio reached `canplay` through the sheet in both, under the page's real CSP, with 0 CSP errors. The old-iOS unwrap took 1-4 ms for up to 467 words and left 0% difference from an unsplit word in both browsers. That proves the unwrap, not the gate.

## How it was measured

- Astro 7.4.4, `@astrojs/cloudflare` 14.4.3, deployed to the sandbox Worker with production headers and the Astro CSP meta.
- Real Supabase data, colour segments from the app's own analysis code run at build time, Amiri all-features subset (51.5 KB).
- 390×664 at 2x. Chromium driven by Playwright. Zen driven by WebDriver BiDi in a throwaway profile on a private X display, so the owner's Zen was not touched.
- First Zen tap timings came from a hidden tab and were thrown out. Only the rerun in a visible tab, at a confirmed 17-20 ms per frame, is reported.

## Limits

- **No iPhone and no WebKit in this spike.** Playwright WebKit would not launch (missing host libraries). The only WebKit evidence is still the table in `platform-2026.md`. iOS below 26.2, the unwrap gate, and the "." break on iOS 26.2-27.2 are all unverified.
- **No real Android or phone.** CPU throttling is desktop emulation. Zen has no throttle setting, so Zen numbers are from this desktop only.
- **Touch selection not tested.** Long-press can't be driven here, including how iOS treats an `<a>` with no `href`.
- **No screen reader tested.** The reader has one tab stop per word (467 at the longest), which is probably too many. Needs a real check before launch.
- **SEO effect of removing `href`s not measured.** Crawlers that run JS would no longer see these links. Worth testing: remove them on first pointer contact instead, so crawlers keep the links.
- **39% of multi-colour tokens were not shape-tested.** The ي rule was tested on 7 forms and 2 whole articles, and the kasra then takes the ي's colour in Zen.
- **Spike styling only.** The sheet has no anchor positioning, motion or final design. Real CSS will change LCP.
- **A cookie to trace.** During the audio test Zen logged a rejected `__cf_bm` cookie. I didn't confirm which host sent it. Check this against the consent work.
- **Chromium here reports 154**, not the 156 in `platform-2026.md`.

## For the owner to review

- **Which Arabic the reader shows.** Tapping needs `sentence_words.word_form`, which is fully vocalised, while `article_sentences.arabic` is often not: the two differ in 4,206 of 5,523 sentences, and 403 differ in word count. I used `word_form`, which is also stored text. 3 sentences have no words at all.
- **Separated prefixes.** 214 tokens are a lone prefix, so the page shows "فَ خَرَجْنَا" with a space. That is in the data, not the rendering.
- **Teaching trade-off.** 1,409 words have a mark-only segment, so a case ending colours its letter too.
