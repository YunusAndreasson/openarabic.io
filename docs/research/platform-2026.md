# Platform research, 2026

All findings dated **2026-10-31**, for Astro 7.4.4 and @astrojs/cloudflare 14.4.3 on Workers.

- **Sources:** support versions come from [`@mdn/browser-compat-data` 8.1.7](https://www.npmjs.com/package/@mdn/browser-compat-data) (BCD, built 2026-10-22) and [`web-features` 3.44.0](https://www.npmjs.com/package/web-features) (built 2026-10-30), read from the packages. Support order is always **Safari iOS / Chrome Android / Firefox**.
- **"Tested"** means run on this machine in Chromium 156, Zen 1.23.2b (Gecko 157.0.1), Firefox 159.0 and WebKitGTK 2.54.1, with Zen and Firefox in headless temporary profiles.
- **Not tested: any real iPhone.** WebKitGTK shapes with HarfBuzz and iOS uses CoreText, so every WebKit result is a hint about Safari, not proof.
- **Current releases:** Chrome 156 (BCD), [Firefox 159](https://www.firefox.com/en-US/firefox/159.0/releasenotes/), [Safari 27.2](https://webkit.org/blog/18515/webkit-features-for-safari-27-2/).

## 1. Cross-document view transitions vs `ClientRouter`

- **Support:** `@view-transition` is 18.2 / 126 / none. BCD says false, and Firefox 159 and Zen dropped the rule when tested. [Bug 1860854](https://bugzilla.mozilla.org/show_bug.cgi?id=1860854) is open with no release target. [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition): limited availability.
- **Fallback:** an ordinary instant navigation, with nothing to write.
- **JS cost:** native 0. `ClientRouter` is 16.4 KB minified, 5.6 KB gzip (measured on the built chunk in `andreassonphoto.com/dist`).
- **Deciding fact:** `ClientRouter` is [not supported with `security.csp`](https://docs.astro.build/en/reference/configuration-reference/#securitycsp), and [Astro's guide](https://docs.astro.build/en/guides/view-transitions/) says it "will increasingly become unnecessary".
- **Verdict:** native. The owner's Zen will not show transitions, and that is acceptable.

## 2. Scroll-driven animations vs sticky stages

- **Support:** `animation-timeline` is 26 / 115 / **159, shipped [on 2026-10-27](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/159)**. `view()` animated when tested in Firefox 159. `web-features` does not yet count it as Baseline.
- **Still without it:** Zen on Gecko 157 (tested false) and Firefox ESR 153 (BCD).
- **Is the JS fallback still needed?** No. `andreassonphoto.com/src/pages/poems.astro` keeps a scroll listener for browsers without the feature. Current Firefox no longer needs it, and a static page is a fine fallback for a decorative fade.
- **Trap to carry over:** that project's `global.css` uses longhands because the minifier folded the shorthand into a form Chrome rejected.
- **JS cost of a sticky stage:** `qamar360/web/src/lib/play.ts` is 786 B minified, 433 B gzip (measured), for the maths only, not listeners or components. It earns its place when a section holds on stops and swaps content. `position: sticky` alone needs no JS.
- **Verdict:** CSS inside `@supports` for ornament, with the static state as the designed baseline. Script only for a stage that must hold stops.

## 3. Astro 7

- **From 6 to 7 ([guide](https://docs.astro.build/en/guides/upgrade-to/v7/)):** Vite 8. Rust compiler only: unclosed tags fail the build and invalid nesting is no longer corrected. Sätteri is the default Markdown processor; remark and rehype need `@astrojs/markdown-remark` and `markdown.processor: unified()`. `src/fetch.ts` is reserved. `@astrojs/db` and `astro:transitions` internals are removed. `logger`, `cache`, `routeRules` move to the top level. Node >=22.23.4 (npm `engines`). The adapter peers on `astro ^7.4.0`, `wrangler ^4.125.0`.
- **`compressHTML` now defaults to `'jsx'`, which strips whitespace between elements.** A word loop written across lines would lose the spaces between Arabic words. Write `{" "}` and test for it.
- **Fonts API:** [`fonts`](https://docs.astro.build/en/reference/configuration-reference/) dates from 6.0, with no experimental label. [`fontProviders.local()`](https://docs.astro.build/en/reference/font-provider-reference/) takes `options.variants` with `src`, `weight`, `style`, `display`, `unicodeRange`, `featureSettings`, `variationSettings`; files belong in `src/`. The docs describe no subsetting for local fonts, so we subset ourselves. [Generated fallback metrics](https://docs.astro.build/en/guides/fonts/) are documented without any mention of Arabic. Not run here.
- **CSP:** [`security.csp`](https://docs.astro.build/en/reference/configuration-reference/#securitycsp) emits a `<meta>` with hashes and does not work in `dev`. External scripts and styles need hand-provided hashes. Netlify, Node and Vercel have `staticHeaders`; **`@astrojs/cloudflare` 14.4.3 does not** (grep of its `dist`), so the meta stays. `frame-ancestors` is [not supported in meta](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors), so send it through [`public/_headers`](https://docs.astro.build/en/guides/integrations-guide/cloudflare/), which does not reach Worker responses. `style=""` needs a `kind: "attribute"` resource (since 7.1). Verify the built output in Zen with production headers, per `browser.md`.
- **Responsive images:** [`image.layout`](https://docs.astro.build/en/guides/images/) generates `srcset` and `sizes`. `image.responsiveStyles` defaults to off, and images are not responsive without it.
- **Image service:** the [adapter default](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) `cloudflare-binding` provisions an Images binding on deploy. `compile` transforms at build for prerendered routes (Sharp on the Node side, per adapter source) and passes through on demand, which fits a build-time pipeline. Not run here.
- **Collections:** [Astro recommends](https://docs.astro.build/en/guides/content-collections/) build-time wherever possible. Live collections have no built-in loaders, need an adapter, cannot use MDX or process images, and fetch per request unless cached.
- **Prerendering:** [static is the default](https://docs.astro.build/en/guides/on-demand-rendering/); opt out with `export const prerender = false`.
- **Sessions:** `session: false` [arrived in 7.2](https://docs.astro.build/en/reference/configuration-reference/). The adapter then [provisions no KV and drops the runtime](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).
- **Route caching:** `cache` and `routeRules` are stable in 7.0. The Cloudflare provider `cacheCloudflare()` is [experimental and enabled by hand](https://docs.astro.build/en/guides/caching/). It only matters for on-demand routes.

## 4. Arabic on the web

Sizes measured from `open-arabic/assets/fonts/`, in KB (1024 bytes). "Ink" is the tallest ink in em over seven vocalised test words (canvas metrics, same in Chromium and Gecko). "hhea" is ascent plus descent.

| Font | Source | Full woff2 | Subset, all features | Subset, core features | Ink | hhea |
|---|---|---|---|---|---|---|
| Noto Sans Arabic 2.012 | 189.6 | 64.8 | 20.7 | 20.3 | 1.63 | 2.11 |
| Scheherazade New 4.300 | 303.8 | 113.7 | 41.2 | 38.0 | 2.08 | 2.04 |
| Amiri 1.002 | 598.6 | 168.0 | 50.2 | 49.0 | 1.97 | 1.76 |
| Digital Khatt New Madina 0.1 | 2531.4 | 374.8 | 335.8 | 212.4 | 1.67 | 2.20 |

- **Subsetting:** `qamar360/web/scripts/subset-font.sh` is a good pattern, but its short `--layout-features` list would damage Arabic, so use `'*'`. Command: `pyftsubset F --unicodes='U+0020,U+00A0,U+0600-0605,U+060C,U+061B,U+061C,U+061E,U+061F,U+0621-063A,U+0640-0671,U+06D4,U+06D6-06ED,U+0898-089F,U+08D3-08FF,U+200C-200F,U+2010-2014,U+2018-201D,U+2026,U+25CC,U+FD3E-FD3F,U+FDF2,U+FDFA,U+FE70-FE7F' --layout-features='*' --notdef-outline --name-IDs='*' --flavor=woff2`
- **Subset check:** Amiri and Digital Khatt all-features subsets gave 0% pixel difference from the full font on a vocalised sample in Chromium 156 and Zen. My first range omitted **U+0671 (ٱ)** and shifted widths, so classical text must check it. Other subsets are measured for size only.
- **`unicode-range`:** BCD 3 / 18 / 36. Keep one Arabic file per face and include U+0020: Amiri kerns across spaces (a word-wrapped sentence measured 243.4 px against 247.1 px in Gecko). A second file for marks would be a font change inside a word, which breaks joining (section 5).
- **Digital Khatt:** CFF2 with `fvar` axes LTAT and RTAT (±20), HVAR and a GDEF variation store; no named instances. 90 codepoints, with no ، ؛ ؟, no Latin, no U+25CC. `font-variation-settings` is 11 / 62 / 62; BCD has no entry for CFF2, so I cannot state CFF2 support. LTAT 20 widened a phrase from 287 to 930 px at 60px, identically in all four engines. Per-letter stretching would need per-span axis changes (not tested).
- **Digital Khatt danger: WebKitGTK painted it with no dots and no harakat, even as plain text.** Cause undetermined; Safari unverified.
- **Shaping across engines:** Chromium and Gecko look the same by eye. WebKitGTK sets Amiri's لله marks differently. Pixel comparisons were within one engine only.
- **`lang` / `dir` / `unicode-bidi`:** `<span lang="ar" dir="rtl">` and `<bdi lang="ar">` (6 / 18 / 10) both kept a following "." in place inside English when tested, with no CSS `unicode-bidi`.
- **`text-wrap: pretty`:** 26 / 130 / none (false in Firefox 159 when tested). Falls back to normal wrapping. Not tested on Arabic.
- **Line height:** Amiri's ink (1.97) exceeds its hhea box (1.76), so `line-height: normal` risks colliding marks. The app measured the same overflow in `VERTICAL_INK_EM`. Inline Arabic line growth inside English was not tested.
- **`letter-spacing`:** [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/letter-spacing) warns it can break connected letters. The app sets it to 0 for coloured words.
- **`text-box-trim`:** 18.2 / 133 / 154. Tested on 40px Amiri: `trim-both cap alphabetic` gives a 26 px box around about 79 px of ink. Never on Arabic.
- **Kashida:** I found no CSS kashida control. [ALReq](https://w3c.github.io/alreq/) warns overuse gives uneven colour. `text-justify` is none / 145 / 55. U+0640 changes the text, which affects search and copying.
- **LCP:** [font loading can delay LCP and swapping can cause CLS](https://web.dev/articles/font-best-practices) (2022 article). `size-adjust` is 17 / 92 / 92, but `ascent-override` and `descent-override` are **none on iOS** (none / 87 / 89), so a fallback cannot be fully matched there. Fixed `line-height` should hold lines still vertically on swap. Amiri at 50 KB can be preloaded; Digital Khatt at 336 KB cannot lead first paint. LCP itself was not measured.
- **Licences, all OFL 1.1, text must ship:** [Amiri](https://github.com/aliftype/amiri/blob/main/OFL.txt) and [Noto Sans Arabic](https://github.com/notofonts/arabic) show no Reserved Font Name (RFN). [Digital Khatt](https://github.com/DigitalKhatt/madinafont) is OFL per its repo (Amine Anane, Tarteel Inc.), with no RFN in the lines read; our file's licence field is empty. **[Scheherazade New](https://github.com/silnrsi/font-scheherazade) reserves "Scheherazade" and "SIL"**, and the [OFL FAQ](https://openfontlicense.org/ofl-faq/) treats subsetting as modification, so a subset needs another name or SIL's agreement.

## 5. Word-level colour on connected text (critical)

- **How the app does it:** `SkiaSentenceWords.tsx` and `utils/skiaParagraphBuilder.ts` shape the whole word first, then colour the runs. Commit `d3f8d254`: nested `<Text>` on Android shaped each span alone, so يَقُولُ fell apart. Without a GPU the word falls back to one colour. `colorSegments.ts` also emits **segments holding only a mark** for case endings.
- **Spec and history:** [ALReq issue 222](https://github.com/w3c/alreq/issues/222), marked fixed 2026-09-08, says colour no longer breaks joins, font-weight, font-style and font-size still do in Gecko and WebKit, and only Gecko colours combining marks. [Safari 26.2](https://webkit.org/blog/17640/webkit-features-for-safari-26-2/) added shaping across inline boxes; before it, split letters did not join.
- **Test:** 4 fonts, 6 words, 9 techniques, plus sentence rows; each rendered in black and pixel-compared with plain text, then viewed in colour. Firefox 159 matched Zen where both ran. Files (temporary): `/tmp/claude-1000/-home-yunus-Work-openarabic-web/f5ea5c67-0d1e-4b2b-9435-2f78166ad912/scratchpad/shape-test/`.

| Technique | Chromium 156 | Zen (Gecko 157) | WebKitGTK 2.54.1 |
|---|---|---|---|
| Colour-only adjacent spans, word alone | Joined, 0% | Joined, 0% | Joined, 0.7% or less |
| Span holding only a mark | Mark keeps base colour | **Mark coloured** | Mark keeps base colour |
| Span holding a base letter + its mark | Both coloured | Both coloured | Both coloured |
| ل + ا ligature across a boundary (Noto) | Whole ligature takes first colour | Same | Split near the join |
| Padding or `inline-block` on a segment | **Broken** | **Broken** | **Broken** |
| Weight or font-family change on one segment | Joined | **Broken** | **Broken** |
| Underline, opacity, background on one segment | Joined | Joined | Joined |
| Spans, then "." in the same parent | Joined | Joined | **Last word falls apart** |
| Spans, then ؟, a space, or "." outside the parent | Joined | Joined | Joined |
| Same sentence, `inline-block` around each word | Joined | Joined | **Joined, the fix** |
| `::highlight` ranges in one text node | Mark range colours base too | Mark range ignored | **Whole word or displaced glyphs** |
| ZWJ at boundaries | **Ligatures lost** | **Ligatures lost** | **Ligatures lost** |
| `background-clip: text` hard stops | 0 to 2% | 0 to 2% | 0 to 3% |

**Threats to the idea, in order:**
1. **iOS below 26.2 cannot join across spans.** In `caniuse-lite` 1.0.30001820 that is 3.65 of 14.81 global points, about a quarter of iOS Safari use.
2. **The "." break.** WebKit's fix [319209@main](https://github.com/WebKit/WebKit/commit/553a9a78402334c54130e294c5d5638b8bfb3971) is in [Technology Preview 251](https://webkit.org/blog/18194/release-notes-for-safari-technology-preview-251/) (2026-08-26). The [27.0](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/), [27.1](https://webkit.org/blog/18486/webkit-features-for-safari-27-1/) and 27.2 posts do not name it, so **iOS 26.2 to 27.2 may have this bug**. [Bug 6148](https://bugs.webkit.org/show_bug.cgi?id=6148) stays open for non-complex text.
3. **A mark cannot be coloured alone across engines.** A case-ending segment would differ in Gecko.
4. **In WebKitGTK one Noto word (يقول) sat above the baseline** in every sentence row with spans, wrapped words included. Cause undetermined.

- **Safe by construction:** ا و د ذ ر ز never join the following letter, so a boundary after و or ا has nothing to break, even on old iOS. The lam of ال does join the next letter. Whole-word colour never crosses a join.
- **Rejected:** ZWJ loses لا and لله and pollutes copied text. `::highlight` is unreliable in WebKit. Skia on the web means a WASM runtime against a tiny JS budget (size not measured). `background-clip` alone avoids spans, so it stays in reserve, but needs measured stops and `color: transparent`.

## 6. Interaction features

| Feature | iOS / Android / Firefox | Probed | Fallback | JS | Verdict |
|---|---|---|---|---|---|
| Invoker `commandfor` | 26.2 / 135 / 144 | True in all 4 | Tiny click handler | 0 | Safe with fallback |
| `popover` | 17 (light dismiss 18.3) / 114 / 125 | True in all 4 | Inline gloss | 0 | Safe. `hint` false in WebKitGTK, so use `auto` |
| `@starting-style` | 17.5 / 117 / 129 | True in all 4 | No entry animation | 0 | Safe |
| `content-visibility` | 18 / 85 / 125 | True in all 4 | Normal rendering | 0 | Safe with `contain-intrinsic-size` |
| Speculation rules | Flag at 26.2 / 109 / none | False in Gecko | Normal navigation | 0 | Safe. Header form (26.2 / 121 / none) avoids a CSP hash |
| `interpolate-size` | None / 129 / none | Chromium only | Snap open | 0 | Ornament only |
| `field-sizing` | 26.2 / 123 / 152 | True in all 4 | Fixed size | 0 | Safe, only for a search box |
| Anchor positioning | 26 / 125 / 147 | True in all 4 | Bottom sheet | 0 | Inside `@supports` |

Probes confirm the feature exists, not that it behaves. BCD records the `position-anchor` initial value changing across versions (`normal` only from 27 / 151 / 151) and `web-features` does not call anchor positioning Baseline, so set `position-anchor` explicitly. No word popover has been built or tested yet.

## 7. Core Web Vitals and budget

- **Thresholds, no change found:** LCP 2.5 s, INP 200 ms, CLS 0.1 at the 75th percentile, per [Google Search Central](https://developers.google.com/search/docs/appearance/core-web-vitals) (updated 2025-12-10), [web.dev](https://web.dev/articles/vitals) and [INP](https://web.dev/articles/inp). Vendor blogs claiming a 2.0 s LCP cite no Google source.
- **Measuring (BCD):** LCP API 26.2 / 77 / 122; `interactionId` 26.2 / 96 / 144; `LayoutShift` Chrome Android only.
- **Budget (my judgement, not measured):** JS 0 on pages with no interactive words, 3 KB gzip on the reader, hard cap 5 KB. CSS 12 KB gzip or less. First-view fonts: one Arabic face up to about 50 KB plus one Latin subset up to about 40 KB. Targets at p75 on mid-range Android: LCP 1.8 s, INP 100 ms, CLS 0.02. Span-per-segment HTML is the real weight risk, so measure a long article.

## So we will...

1. **View transitions:** use native `@view-transition`, and never `ClientRouter`.
2. **Scroll:** use `animation-timeline` inside `@supports` over a designed static baseline, with no JS fallback. Use a `play.ts`-style script only for a stage that must hold on stops. Review motion in Firefox 159 and the static state in Zen until Zen moves past 159.
3. **Astro 7:** build-time collections, throttled against Supabase; static by default with per-route opt-out; `session: false`; `imageService: 'compile'` with `image.layout` and `responsiveStyles`; Fonts API with our own subsets through the local provider; `security.csp` as meta and `frame-ancestors` in `_headers`; no route caching until an on-demand route needs it; explicit `{" "}` between words.
4. **Arabic:** Amiri, all-features subset, as the preloaded hero with `font-display: swap`. Noto Sans Arabic as the light face. Scheherazade only once renamed or agreed with SIL. Digital Khatt not on first paint, and not at all until seen on an iPhone. `line-height` of 2.0 to 2.2 for Amiri and Scheherazade, at least 1.7 for Noto. No `letter-spacing`, `text-box-trim` or justification on Arabic. Ship the OFL texts.
5. **Word colour:** keep the idea, but **treat it as unproven until tested on real iPhones on iOS 18, 26.x and 27.2**.
   - Use colour-only adjacent spans, with every word in its own `inline-block` wrapper, and no padding, weight or font change on a segment.
   - Merge mark-only segments into their base letter, so a case ending colours letter plus mark. The owner should confirm this teaching trade-off.
   - A small script unwraps spans to one colour where `CSS.supports('field-sizing: content')` is false, since that property arrived with Safari 26.2. This gate is untested on old iOS.
   - If the iPhone test fails, fall back to whole-word colour. The spike must also check selection and copying inside word wrappers.
6. **Interaction:** `popover=auto` with `commandfor` and a small click-handler fallback; anchor positioning inside `@supports` over a bottom sheet; `@starting-style`; `content-visibility`; speculation rules through the header; `interpolate-size` for ornament only.
7. **Budget:** hold the numbers in section 7 and check them in CI once there are pages.
