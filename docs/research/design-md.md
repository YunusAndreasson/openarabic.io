# DESIGN.md format for openarabic-web

Research, 2026-10-31. `@google/design.md@0.4.0` was run from an empty scratch directory; nothing was installed in this repo.
Read in full: Google's spec and README, and the in-house docs named below. Read in part: `islam.se/docs/design-history.md` (first 40 of 274 lines) and impeccable (see §3).

**Short answer:** use Google's format with front-matter tokens, but don't rely on its exit code or its export. It checks the tokens; our own script has to generate the CSS and act as the gate.

## 1. What the tool really does (all run, not taken from the docs)

| Question | Real behaviour |
|---|---|
| **OKLCH** | Accepted, and converted to sRGB for contrast; results match `colors.ts` hex comments (`#1A2B23`, `#5E7268`, `#F2F7F4`). All export formats flatten to hex (`--color-primary: #507a60`), though the spec says the format is preserved. Out-of-gamut values clip silently: `oklch(0.7 0.4 150)` becomes `#00d600`. Errors: `var(--x)`, `color-mix(in oklch, …)`, `oklch(from …)`, `color(display-p3 …)`. |
| **Dark and light** | No concept of themes. Top-level `themes:` warns and is ignored. Nested `colors.dark.x` lints, but `export css-tailwind` exits 1 (`INVALID_TOKEN_NAME`). Flat `surface-dark` works, exported as one more `:root` variable with no theme switch. A colour no component uses warns, except standard families (`surface`, `primary`…); `surface-dark` isn't exempt, which usefully forces a dark component and so a dark contrast check. |
| **Custom sections** | Allowed anywhere: `## Lineage`, `## Story` and others between or after the eight gave 0 warnings. `section-order` compares only the canonical eight. The library's `fixSectionOrder` (not in the CLI) moves unknown sections to the end. |
| **Custom token groups** | `motion:`, `arabic:`, `x-motion:` and `extensions:` each warn (`token-like-ignored`) if a value is a hex or a unit-bearing string (`400ms`, `8px`) or a typography key. Export drops them. Numbers and strings like `cubic-bezier(…)` or `clamp(…)` are silent. Fenced ` ```yaml ` and ` ```yml ` blocks are read as tokens; ` ```json ` and ` ```tokens ` are not. |
| **Arabic type** | `typography.arabic-*` passes, with `fontFeature` and `fontVariation`. `direction`, `lang` and `wordSpacing` warn. |
| **Line height trap** | `lineHeight: 2`, the spec's recommended form, lints clean and is **dropped** from the parsed model and from css-tailwind and dtcg. `lineHeight: "2"` survives. This is the token vocalised Arabic depends on. |
| **Type and units** | `css-vars` emits no typography. `css-tailwind` drops `fontFeature` and quotes a whole stack as one family. In typography, `clamp()`, `vw`, `lh` and `fontWeight: "400 700"` are errors. Spacing accepts `66ch`, `100%` and `clamp()` silently. Rounded rejects `%`. |
| **Contrast** | Only components with both `backgroundColor` and `textColor`. WCAG 2 ratio from sRGB luminance. Fixed 4.5:1, with no 3:1 for large text or non-text. **Warning only.** Text on images isn't covered. Alpha is ignored: 50% alpha text was reported at 4.03:1; my calculation for the composite is 1.85:1. |
| **What fails** | Exit 1: invalid colour, bad typography dimension or unit, non-numeric weight, a colour as `fontFamily`, broken reference. Exit 0: invalid YAML, duplicate top-level key and no front matter (one warning each, and in the first two no other rule ran); duplicate `## Colors` and missing `name` (no finding at all). The spec calls both duplicates errors. |
| **`diff`** | Reports added, removed and modified tokens in the five schema groups plus the change in findings. A colour change also marks components using it. Exit 1 only if errors or warnings grew. Prose edits, new sections and `motion` changes all report nothing, exit 0; the README's "prose regressions" did not appear. |
| **Docs vs tool** | `--format text` still prints JSON. `css-vars` is in `--help` but not the README. The spec on `main` describes interleaved YAML; the spec bundled in 0.4.0 says front matter only, yet 0.4.0 reads the blocks. |

Control: raising the tint in the skeleton below to the old L 0.5624 gives warnings at 4.15:1 and 4.46:1, the figures in `colors.ts` lines 59-63.

## 2. In-house docs

| Doc | Size | Keep | Avoid |
|---|---|---|---|
| `islam.se/DESIGN.md` | 565 lines, 13,100 words, 135 lines over 200 chars, longest 1,348 | Single metric with its test question. Lineage tie-break. Counted budgets (≤16 hairlines). History moved out: 0 dates left. One-name-per-destination table. | **Too much**, and the line count hides it. Principle 1 alone is 4,435 words, mostly one page's layout down to x-coordinates and component files. Rules have also come apart: "No sidebar" against the contents rail; "4 colours maximum" against four text ranks, washes, surfaces and brass. |
| `zuhd.news/mobile/DESIGN.md` | 413 lines, 3,581 words, longest 166 | Tokens as role tables pointing at code. Anti-patterns that name their test (`motion-literals.test.ts`). A counted list of exceptions ("Five"). | Patterns is 1,663 words, much of it implementation (sheets, Android quirks). |
| `qamar360/docs/website-plan.md` | 693 lines, 17 dated | Pace rules with numbers. Fit and scale tested at what browsers really leave (390×664, 375×553, 1280×640). Two judges with a concrete check each. Copy bans. One motion vocabulary. | Drift between layers. The "as built" top rewrites the page while §3-§5 still describe Exchanges and the one-night table. Line 76 lists Bukhari 6464 as cut; lines 29 and 82 use it. Line 313 promises a grading that line 258 forbids. |
| `bismillah/DESIGN.md` | 579 lines, 11,811 words, 17 dated | Principles with a "Judged by" column ("a principle that cannot be judged is decoration"). Stated contrast exceptions. Five review questions plus test widths. Arabic rules: no letter-spacing, taller boxes for vocalised runs. | A product spec in a design doc: the full shortcut table, settings behaviour. |
| `bismillah/web/GUIDELINES.md` | 218 lines, 19 dated | Two-worlds table. Each colour has a place in the story and a use budget ("once or twice"). Fixed lines. Picture rules. | "Still to decide" and dated calls mixed with rules. Line 11 says "cut v22" and links `cut-v35`. |
| `open-arabic/docs/DESIGN_SYSTEM.md` | 185 lines, 1,672 words | Sources-of-truth table. Maintenance rule (token, type and doc in one change). Text hierarchy by ink, held by `themeContrast.test.ts`. | The "predecessor" paragraph is history. |
| `open-arabic/brand/DESIGN.md` | 336 lines | §6 logo rules: clear space 0.309 D, minimum 24 px, ≥3:1 background, solid plate on photographs, no re-stroke or gradient. | **Stale:** §3 gives `#568066` as `tint.primary` (4.15:1). `colors.ts` now pins L 0.54, `#507a60` (4.51:1), because the old value failed AA. It survives in `brand/build.py:27` and `app.json:12,280`, so the build still uses it for the light mark (PNGs not sampled). |
| `open-arabic/constants/colors.ts` | 832 lines | OKLCH source of truth. Light, dark, sepia. Lightnesses are pinned by contrast, so copy them, don't retune them. | Don't copy sepia or the 36 grammar values unless the site paints them. |

## 3. Impeccable

Read: README lines mentioning DESIGN.md, `reference/document.md` (lines 1-62, plus a search of the rest), the head and headings of its `DESIGN.md`, the start of `.impeccable/design.json`. Not run.

- It builds on Google's format: `document.md` links the raw spec and uses the same eight sections and eight component props. It adds `PRODUCT.md` and a sidecar, `.impeccable/design.json`, for ramps, shadows, motion, breakpoints and snippets, and rejects a motion token group (line 396).
- Its sync runs the other way: its front matter calls `kinpaku-tokens.css` the source of truth and itself "the portable export". That file fails Google's linter 0.4.0 (I ran the linter on a downloaded copy): exit 1, 4 errors (`clamp()` sizes, bare `0`), 95 warnings, 68 of them orphans.
- Take the Named Rule form (`**The X Rule.**`). Skip the sidecar: it is a second file to drift.

## 4. Format and section order

Google's format, tokens in front matter only, then Google's eight in spec order, then ours in the order you listed. Interleaving ours also lints clean, but a tail keeps the spec block recognisable and the fixer leaves it unchanged (run: output identical). The cost is that Lineage comes late, so Overview's last line points to it.

| # | Section | Holds | Lines |
|---|---|---|---|
| - | Front matter | Tokens | 90 |
| 1 | Overview | What it is, the single metric, pointer to Lineage | 12 |
| 2 | Colors | Roles, not values; one-line reasons; exceptions counted | 25 |
| 3 | Typography | Latin and Arabic roles, vocalisation clearance, no Arabic letter-spacing | 35 |
| 4 | Layout | Measure, grid, breakpoints with reasons | 25 |
| 5 | Elevation & Depth | Tonal, what may cast a shadow | 8 |
| 6 | Shapes | Radius roles | 6 |
| 7 | Components | Astro components and states | 40 |
| 8 | Do's and Don'ts | Copy bans, anti-patterns, each with its check | 20 |
| 9 | Lineage | Rams, Norman, Nolan for Story only; who decides what | 8 |
| 10 | Story | Pace numbers, fit and scale, two worlds | 30 |
| 11 | Motion | Named paces, patterns, reduced motion, a Never list | 20 |
| 12 | Imagery | Picture rules, logo rules linking `brand/DESIGN.md` for geometry | 25 |
| 13 | Content surfaces | Template rules for reference pages: no content motion, Arabic first, one name per destination | 30 |
| 14 | Review | Judges, gate questions, widths, specimens in `docs/specimens/` | 16 |

**Budget: 400 lines, 4,000 words, 100 chars per line outside the front matter.** The words and width are the real limit: islam.se's lines hold 13,100 words. A page-level layout belongs in that page's brief, not here.

## 5. Where non-spec tokens go

| Token | Place | Why |
|---|---|---|
| Arabic type | `typography.arabic-*`, `lineHeight` quoted | Valid spec; survives parsing |
| Direction, language | No token; prose plus `:lang(ar)` in CSS | `direction` and `lang` warn |
| Dark theme, Story | Flat `*-dark` in `colors`, one component per theme; `story-*` only where a value differs | Nested breaks Tailwind export; pairs get contrast-checked |
| Motion | Top-level `motion:`, numbers with the unit in the key (`duration-ms`, `rise-px`) | 0 warnings, read only by our generator |
| Breakpoints, fluid type | `breakpoints-rem: {md: 48}`, `fluid: {display: "clamp(…)"}` | Run: 0 warnings; `clamp()` is an error in `typography` |
| Shadows, borders, focus | Prose, plus plain colour tokens | Not component props; they warn |

## 6. Keeping tokens and CSS in sync

**Generate, and test the output for drift.** `export` can't do the job: it loses OKLCH, the theme switch, motion and (in `css-vars`) all type. The linter's parsed model also holds only hex, so the generator must read the YAML itself. An 18-line prototype, `/tmp/claude-1000/-home-yunus-Work-openarabic-web/f5ea5c67-0d1e-4b2b-9435-2f78166ad912/scratchpad/gen/gen.mjs`, kept `oklch()`, wrote `prefers-color-scheme` and `[data-theme]` overrides plus motion variables, and its `--check` mode exited 1 both after a hand edit to the CSS and after a token change in DESIGN.md.

One script, `scripts/check-design.mjs`, in CI (only check 2 is prototyped):

1. **Lint gate:** 0 errors, 0 warnings and a `token-summary` finding present. Its absence catches files where the rules never ran; the exit code alone can't.
2. **Regenerate and compare** `src/styles/tokens.generated.css`.
3. **Literal ban:** no hex, `oklch()` or `ms` literal in `.astro` or `.css` outside the generated file (zuhd's `motion-literals.test.ts` is the precedent).
4. **App parity:** shared tokens compared with `../open-arabic/constants/colors.ts` when that checkout exists, otherwise skipped with a notice. A copied value with only a comment naming its token, as in the skeleton, is how `#568066` went stale.
5. **Real contrast:** what the linter can't see: alpha composites, text over Story images, non-text 3:1.

Print `diff` output in pull requests for the token summary, but gate on the script: `diff` is blind to `motion` and prose.

## 7. Keeping DESIGN.md rules-only

- Open with islam.se's contract: everything here is a current rule. Dated decisions and open questions go in `docs/decisions/`, the record behind a rule in `docs/design-history.md`.
- A rule says what to do and how it's judged; a reason gets one clause. A rule nothing can judge is cut.
- `check-design.mjs` fails on: over budget; an ISO date; "as built", "superseded", "still to decide", "user review", "previously"; any hex or `oklch()` below the front matter. That last one would have caught `#568066` in prose. A similar date and phrase search found: islam.se 0 dated lines, 1 phrase hit; zuhd 0 and 0; qamar360 17 and 9; bismillah 17 and 8.
- A regex finds only stock phrases, so Review also asks: "Is anything here a story about how we got here?"

## 8. Skeleton, verified

**Verified with 0.4.0:** this block plus the 14 `##` headings gave exit 0, `{"errors":0,"warnings":0,"infos":1}`. Colours are from `colors.ts`; fonts and the 2.2 line height are the app's (`constants/fonts.ts`, `layout.ts`); sizes, motion values and the easing are placeholders.

```yaml
---
version: alpha
name: OpenArabic
description: Vocalised Arabic, one dark story page, thousands of reference pages.
colors:                                                # shared values: constants/colors.ts
  primary: "oklch(0.54 0.0622 156.2)"                  # tint.primary
  on-primary: "oklch(0.9965 0.004 157)"                # pure.white
  surface: "oklch(0.9715 0.0066 160.1)"                # sage.lighter
  on-surface: "oklch(0.2711 0.0272 163.6)"             # forest.darkest
  primary-dark: "oklch(0.7323 0.085 151.5)"            # tint.primaryDark
  on-primary-dark: "oklch(0.04 0.005 150.9)"           # pure.black
  surface-dark: "oklch(0.145 0.02 160)"                # sage.darkest
  on-surface-dark: "oklch(0.9965 0.004 157)"           # pure.white
typography:                                            # sizes are placeholders
  body: {fontFamily: "Inter, sans-serif", fontSize: 1.125rem, fontWeight: 400, lineHeight: "1.6"}
  arabic-reading: {fontFamily: "Noto Sans Arabic, sans-serif", fontSize: 1.75rem, fontWeight: 400, lineHeight: "2.2"}
spacing: {sm: 8px, md: 16px, lg: 32px, measure: 66ch}
rounded: {md: 16px, pill: 9999px}
motion:                                                # ours; numbers, unit in the key
  ease: "cubic-bezier(0.2, 0, 0, 1)"
  duration-ms: {touch: 400, state: 600, arrive: 1200}
  rise-px: 8
components:                                            # one per theme, so both are contrast-checked
  page: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.body}"}
  link: {backgroundColor: "{colors.surface}", textColor: "{colors.primary}"}
  button-primary: {backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", rounded: "{rounded.md}", height: 44px}
  page-dark: {backgroundColor: "{colors.surface-dark}", textColor: "{colors.on-surface-dark}", typography: "{typography.body}"}
  link-dark: {backgroundColor: "{colors.surface-dark}", textColor: "{colors.primary-dark}"}
  button-primary-dark: {backgroundColor: "{colors.primary-dark}", textColor: "{colors.on-primary-dark}", rounded: "{rounded.md}", height: 44px}
  verse: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.arabic-reading}"}
---
```

## So we will...

1. Write `DESIGN.md` in Google's format, tokens in front matter only, with Google's eight sections then Lineage, Story, Motion, Imagery, Content surfaces, Review, within 400 lines and 4,000 words.
2. Keep OKLCH as the written value, flat `-dark` colours, Arabic in `typography` with quoted `lineHeight`, and motion as our own numeric group.
3. Generate `tokens.generated.css` with our own script, never `design.md export`, and fail CI on drift.
4. Pin `@google/design.md` to exactly 0.4.0 when the site is set up, and gate on 0 errors, 0 warnings and a `token-summary`, not the exit code.
5. Check the app's values against `colors.ts` and never take colours from `brand/DESIGN.md`; the stale `#568066` needs fixing upstream in `brand/DESIGN.md`, `brand/build.py` and `app.json`.
6. Keep DESIGN.md rules-only by script, with dates in `docs/decisions/` and history in `docs/design-history.md`.
7. Ask the owner for the single metric, which the Overview needs and nothing I read settles, and whether the light mark moves to `#507a60`.
