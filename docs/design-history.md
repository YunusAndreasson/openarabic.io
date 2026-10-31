# How DESIGN.md's rules came about

`DESIGN.md` holds rules only. This file holds the why and the when. Evidence is in `docs/research/`, the owner's answers in `docs/decisions/2026-10-31-owner-review.md`, the concept pick in `docs/decisions/2026-10-31-concept.md`.

Status of all of it: **agent judgement and browser checks.** No learner has seen any of this. The owner skipped the emotion test in plan step 7, so nothing counts as evidence for feeling until after launch.

## Owner decisions that overrode research or the plan (2026-10-31)

| Rule in DESIGN.md | What it replaced | Note |
|---|---|---|
| Generated scenes through the Codex route | `lineage.md` C3 and "So we will" 9: "no stock, no generated images" | **The owner's override.** App UI stays a real capture and generated images hold no lettering, so what C3 protected, the real text and the real app, survives |
| Dark everywhere, no toggle | The recommendation to let long reading follow the device, and `design-md.md`'s `-dark` token pairs | Against the recommendation. Daylight reading on Arabic is a review item, and is untested. Tokens are therefore flat, with no `-dark` suffix. The plan's `#507A60` stays as non-text only, since it reaches only 4.02:1 on the surface |
| Native scroll, at most one laptop pin, none on phones | Pinned stages in qamar360 | Follows `lineage.md` N3 and N4. The specimen spent no pin, so the rule leaves it unspent by default |
| Word colour within words, one colour on iOS below 26.2 | Whole-word colour as the safe option | Unproven on a real iPhone. The owner offered no test devices |
| Founder's story off the site | The plan's founder narrative in step 3 | The owner keeps it off. The moment is given to the visitor |
| Store taps per visit as the one metric | An open question in `design-md.md` | Counted cookieless at `/download-app`, so declining consent can't bias it |
| GA4 behind a footer link only | A consent step or banner | Against the recommendation. Few will opt in, so GA4 data will be thin and can't judge the site |
| The site only promotes the app, no admin | The old site's dual role | Where the admin goes is deferred, and must be settled before cutover |
| No religious reviewer step | The named reviewer in plan step 3 | "all input is valid so no need for sign off". Attribution and disclosure rules stay |

## Colours

- Read from `constants/colors.ts` at `open-arabic` commit `68bc2fcd`, dark theme. Conversions recomputed: `#040D07` is `sage.darkest`, `#80B88E` is `tint.primaryDark`, `#F2F7F4` is `sage.lighter`, `#507A60` is `tint.primary`. These match the file's own figures (8.62:1 for the action on the surface; `brand/DESIGN.md` rounds this to 8.60).
- Not used: `#568066`, the stale tint, which failed AA and survives in `brand/DESIGN.md`, `brand/build.py` and `app.json`. Not used: `#111614`, an old social-card background.
- `on-surface` is `sage.lighter`, as the plan named, rather than the app's `pure.white`. It's slightly softer on a very dark ground and still 18.2:1. A judgement.
- Concept A's specimen used sampled hues and hand-marked segments. They were wrong in places. **Running the classifier changed the colouring of the line:** `إذا` is a particle, the `كَ` in فَكَأَنِّي is a preposition, `أَنِّي` is unpainted, and `لَمْ` is unpainted because a single-component word doesn't colour. The classifier was bundled in the scratchpad with esbuild and not modified, using `computeColoredSegments` with a stub for Sentry.
- The classifier returns a mark-only segment on أَرَهُ: the damma, in `accent`, glossed "it". That looks like a classifier quirk, since the pronoun is `هُ`. The rule merges it into its base letter, so هُ takes `accent`, which also solves the case where Gecko alone colours a lone mark. The owner should know this is a teaching trade-off: a case ending colours letter and mark together. `grammar-accent` is a thirteenth token for this reason.

## Type

Rendered in Chromium 154 and Zen 1.23.2b (Gecko 157) on the real text: sentences 7106 and 6774, the capture 01 line with ﷺ, the superscript alef and shadda on lam, plus coloured فَكَأَنِّي, أَرَهُ and رَأَيْتُ, at 20, 24, 28, 34, 84 and 150 px, on the dark surface. Seven Arabic faces (Amiri, Noto Naskh Arabic, Scheherazade New, Markazi Text, Lateef, Mirza, IBM Plex Sans Arabic) and nine Latin faces (Alegreya Sans, Source Sans 3, Inter, Literata, Gelasio, Crimson Pro, Fira Sans, IBM Plex Sans, Vollkorn), the latter in all pairings with the three Arabic finalists.

| Candidate | What the rendering showed |
|---|---|
| **Amiri (chosen)** | The one that looks like a printed classical book, and the only one where the line is beautiful before it's legible. كتابا's ligature and the fine strokes carry the visceral job. Weakness: hairlines thin out on dark at 20 px, so the floor is 24 px |
| Noto Naskh Arabic | Sturdiest at small sizes and half the file size. Neutral: correct and forgettable, which is the failure the first screen can't afford. Named as the fallback |
| Scheherazade New | Handsome, but tall, and it needs a rename or SIL's agreement for a subset (Reserved Font Name) |
| Markazi Text | Small on the body, cramped marks at phone size |
| Lateef, Mirza | Smaller and more delicate than the line can spare at 30 px |
| IBM Plex Sans Arabic | Clear and modern; marks crowd at the shadda, and it reads as interface, not book |

| Latin | Against Amiri |
|---|---|
| **Alegreya Sans (chosen)** | Pen-like modulation that rhymes with Amiri's stroke; compact, so English recedes and fits the 375×553 screen. Weakness: small x-height, so body stays at 18 px and small at 16 px |
| Source Sans 3 | Reads well, neutral. Runner-up. Takes more lines at the same size |
| Inter | The app's face, and it reads as interface. The site needn't copy the app's UI font |
| Literata, Gelasio, Crimson Pro, Vollkorn | Serif beside a serif Arabic competes with it, and a large high-contrast serif on near-black is a current generated-page default |
| Fira Sans, IBM Plex Sans | Heavier than Amiri's strokes, so the English gets louder than the Arabic |

**A bug the rendering found:** the Latin-only Alegreya files used in concepts A to C lack ā, ī, ū, ṣ, ṭ, ḥ, ʿ. "Ṣayd al-Khāṭir" was falling back to another font for those letters. New subsets built from Google Fonts' TTFs with those characters are in `docs/specimens/shared/fonts/`, at 29 KB each. Neither Amiri's nor Alegreya Sans's OFL text declares a Reserved Font Name.

The app's own default is Noto Sans Arabic, so the site doesn't match the app's default text. Amiri is one of the five the app offers, so the site shows a real choice in the app, not an invented look.

## Other rules

| Rule | Why |
|---|---|
| Two margins | The specimen's own idea, promoted: two directions of reading become the layout, so no image is needed on the first screen |
| "Tap a word." beside the attribution | Concept A's biggest usability risk was D1, whether an underline alone signals a tap. Norman owns how things are found, and Rams accepts it since the story depends on it. Only the cold test can say whether it is enough or needless. Draft copy |
| Underline in `primary-deep` | Concept A's `#2B3B31` underline was faint at about 1.5:1. At 4.02:1 it passes the non-text bar |
| Colour falls back to ink on lift | Colour explains how the words map to English. Once English has gone it has nothing to match, and screen 9 must be a single ink |
| Screen 8's words aren't tappable | The English is already there, and the cards would interrupt the one reveal |
| Line in a `<div>`, popover after its button | A `<p>` can't hold a popover, and `.w:has(+ :popover-open)` gives an open-state style without script, which `:focus` can't do on iOS |
| Store bar around screens 3 to 7 | From `lineage.md` N7: appears after the first buttons leave, gone at the close, so the moment on 8 and 9 is clean |
| Sticky bar on the story page only | `app-marketing.md` 8: a sticky bar on reading pages reads as an interstitial |
| Both store buttons always | Pages are static and work with no JS. Linear's device-matched button is better, but needs script or an edge rewrite. Revisit when the JS budget is set |
| No top line on the story page | The first screen already can't spare the height at 375×553 |
| Budgets | LCP, INP, CLS from Google; CSS and fonts are judgement from `platform-2026.md`. The JS figure waits for the word-tap spike |
| Sections order | Google's eight in spec order, then ours, per `design-md.md` §4: the plan's table lists the same content, and this order keeps the spec's block recognisable |
| Tokens stay OKLCH | `design-md.md` §1: the linter accepts them, and the generator must read the YAML itself |
| Screen 9 uses screen 1's grid, with no gap above it | Round 2 measured a 286 px band at 1280×640 (limit 256) with the gap; 216 px without it |
| Screen 2 follows screen 1 at `block` on phones | Round 2's peek at 375×553 passed by only 4.9 px. Now 82 px |
| Account note on the first screen | The ledger's price row is the price "plus" the account line. The concept kept it for screen 9, so the first screen under-told it. PRODUCT.md wins |
| Close: inset focus ring, no hover fill, flush | A sticky Close flush with the card's bottom clips an outer ring (round 2) |
| `position-area` banned for the card | Round 1 found it puts the card off-screen in Zen inside `dir="rtl"` (x -752 at 1280 wide, 752 in Chromium). Green in Chromium alone would have hidden it. `top: anchor(bottom)` with `right` works in both |
| Card `max-height: calc(50svh - 1.5rem)` | Round 1: 3 of 18 cards overflowed by 16 px at 375×553 with nowhere to flip |
| Store bar 67 px, not 60 | Round 1: a quarter-height clear space round a 44 px badge can't fit in 60 px |
| Hairlines exempt from 3:1 | Round 1 flagged `outline` at 1.48:1. They are decoration, so the rule now says so |
| Capture height `min(100svh - 12rem, 34rem)` | Round 2: at `78svh` a capture and caption couldn't clear the store bar |
| Part classes, not inline colours | Round 1 needed `!important` to fall back on lift |

## Tests of this file

**Lint.** `@google/design.md` 0.4.0, exact pin, run from the scratchpad after reading its README: 0 errors, 0 warnings, `token-summary` present (22 colours, 11 type scales, 3 radii, 15 spacing tokens, 33 components). `design-md.md` §1 explains why the exit code alone proves little.

**Specimen from DESIGN.md and PRODUCT.md only.** Two fresh agents, each given those files and real material.

| Round | Guesses | Biggest finds |
|---|---|---|
| 1 | 48, plus 4 rules it couldn't meet | The Gecko card bug, the laptop peek, the store bar's clear space, no spec for screen 8's or the footer's layout, Latin subset questions |
| 2 | 45, mostly small gaps and measurement definitions, plus 2 failures | The 286 px band, the clipped focus ring, "no hue" read literally, whether an attribution belongs on screen 3 |

Every guess from both rounds became a rule, or was accepted where the document already allowed the builder's choice (alt text wording, and the small markup in a specimen). The plan allows at most one repeat, so there was no third agent to confirm the round 2 rules. The owner should treat those rules as checked by the patched specimen, not by a fresh reading. `docs/specimens/design-test/` is the round 2 specimen with the round 2 fixes applied by hand.

**Budget.** `design-md.md` set 400 lines and 4,000 words. The body is now over 500 lines and about 5,800 words. Turning each guess into a rule was the stated success test, so it won, and the budget was missed. A `check-design.mjs` budget must be set to match, or the file trimmed once the site's components can hold some of this.

**Browsers.** Chromium 154 through Playwright, with touch emulation on phones. Zen 1.23.2b on Gecko 157, headless with a temporary profile, driven through Marionette. Both ran at 390×664, 375×553 and 1280×640; base, reduced motion, and JS off.

| Check | Result in both |
|---|---|
| Offer inside the first screen | Pass at all sizes |
| Peek to the next section | 166, 82 and 64 px |
| Widest empty band | 32%, 36% and 34% of the viewport |
| Sideways scroll, 500 px scroll moves 500 px | None, yes |
| Word target | At least 44×73 px |
| All 18 cards in the viewport, word uncovered, Close reachable | Pass (Zen sweep run; Chromium by round 2's agent) |
| Card, Close and lift with JS off | Work by real clicks. Zen's JS-off profile confirmed by a test page whose script didn't run |
| Reduced motion | Transitions 0s, layout the same |
| Screens 1 and 9, word boxes | Identical |
| Audio | Plays, muted, 0.76 s in, 6 s long. Nobody listened |
| Arabic by eye, at 3× | Joins hold across coloured spans; marks on their letters; shadda and kasra clear; kasra under إ clear of the underline. Colour boundaries sit slightly differently per engine |

**Not verified.** Any real iPhone or any Safari, so the iOS below 26.2 path has never been seen working. Zen with the owner's profile and extensions. Daylight reading. LCP, CLS and INP as field or lab numbers. A real touch tap's paint time (scripted clicks only). An automated accessibility scan, and 200% zoom beyond one agent's 640×320 check in Chromium. The official store badges, the QR and the generated images, none of which exist yet. No learner has seen anything. The JS budget awaits the spike.

**Open for the owner or the next step.** The first pass of `docs/imagery/` hasn't run, because this step only sets the route. Capture 01's work attribution is unverified (`concepts.md`). The classifier's `accent` on أَرَهُ looks like a quirk worth checking in the app repo.
