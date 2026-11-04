---
version: alpha
name: OpenArabic
description: One dark promo page played by the scroll, and reference pages that prove it.
colors:                                        # source: open-arabic constants/colors.ts, dark theme
  surface: "oklch(0.145 0.02 160)"             # sage.darkest
  surface-raised: "oklch(0.185 0.022 158)"     # sage.dark, word card
  outline: "oklch(0.305 0.022 154)"            # sage.outline, hairlines only
  on-surface: "oklch(0.9715 0.0066 160.1)"     # sage.lighter
  on-surface-quiet: "oklch(0.75 0.014 157)"    # text.secondaryMetadata
  primary: "oklch(0.7323 0.085 151.5)"         # tint.primaryDark, the store action and links
  primary-hover: "oklch(0.7478 0.0382 157.7)"  # forest.lighter, hover only
  on-primary: "oklch(0.04 0.005 150.9)"        # pure.black
  primary-deep: "oklch(0.54 0.0622 156.2)"     # tint.primary, non-text only: word underline
  grammar-conjunction: "oklch(0.68 0.09 250)"  # the 13 below paint Arabic parts and their English
  grammar-preposition: "oklch(0.66 0.12 90)"
  grammar-particle: "oklch(0.7 0.13 110)"
  grammar-negation: "oklch(0.6 0.14 125)"
  grammar-plural: "oklch(0.7 0.08 140)"
  grammar-possessive: "oklch(0.6 0.14 155)"
  grammar-verb: "oklch(0.7 0.08 170)"
  grammar-interrogative: "oklch(0.6 0.14 185)"
  grammar-demonstrative: "oklch(0.7 0.08 200)"
  grammar-subject-prefix: "oklch(0.66 0.1 225)"
  grammar-future: "oklch(0.66 0.08 270)"
  grammar-article: "oklch(0.68 0.11 50)"
  grammar-accent: "oklch(0.68 0.13 265)"       # accent (indigo.dark), the classifier's mark colour
typography:
  title: {fontFamily: "Inter", fontSize: 1.3125rem, fontWeight: 500, lineHeight: "1.25"}
  beat: {fontFamily: "Inter", fontSize: 1.5rem, fontWeight: 400, lineHeight: "1.25"}
  beat-laptop: {fontFamily: "Inter", fontSize: 1.75rem, fontWeight: 400, lineHeight: "1.25"}
  body: {fontFamily: "Inter", fontSize: 1.125rem, fontWeight: 400, lineHeight: "1.45"}
  small: {fontFamily: "Inter", fontSize: 1rem, fontWeight: 400, lineHeight: "1.4"}
  gloss: {fontFamily: "Inter", fontSize: 1.3125rem, fontWeight: 500, lineHeight: "1.3"}
  arabic-line: {fontFamily: "Amiri", fontSize: 2.125rem, fontWeight: 400, lineHeight: "2.1"}
  arabic-word: {fontFamily: "Amiri", fontSize: 6rem, fontWeight: 400, lineHeight: "1.75"}
  arabic-pair: {fontFamily: "Amiri", fontSize: 2.125rem, fontWeight: 400, lineHeight: "1.75"}
  arabic-reading: {fontFamily: "Amiri", fontSize: 1.75rem, fontWeight: 400, lineHeight: "2.1"}
  arabic-inline: {fontFamily: "Amiri", fontSize: 1.5rem, fontWeight: 400, lineHeight: "2"}
spacing:
  word: 8px        # parts of one thought
  thought: 16px    # thoughts within a beat
  block: 32px      # groups within a surface
  gutter: 16px
  gutter-laptop: 48px
  column-gap: 56px
  peek: 64px       # laptop first screen leaves this much of the next beat
  measure: 34rem
  measure-arabic: 42rem
  page-max: 88rem    # includes the gutters
  store-gap: 12px
  store-inset: 20px
  store-bar-inset: 11px
  card-phone: 23rem
  card-laptop: 30rem
rounded:
  control: 6px
  card: 14px
  capture: 20px
fluid:
  arabic-line-phone: "clamp(30px, min(10.4vw, 6.2svh), 42px)"
  arabic-line-laptop: "clamp(44px, min(5.5vw, 11svh), 84px)"
  arabic-word: "clamp(76px, 24vw, 128px)"
  beat-gap: "clamp(56px, 11svh, 96px)"
  capture-height: "min(100svh - 12rem, 34rem)"
breakpoints-rem: {laptop: 56.25}
motion:
  ease: "cubic-bezier(0.2, 0, 0, 1)"
  duration-ms: {touch: 100, state: 300, lift: 500, navigate: 200}
components:
  page: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.body}"}
  quiet-text: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface-quiet}", typography: "{typography.small}"}
  link: {backgroundColor: "{colors.surface}", textColor: "{colors.primary}"}
  store-button: {backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", rounded: "{rounded.control}", height: 48px}
  store-button-hover: {backgroundColor: "{colors.primary-hover}", textColor: "{colors.on-primary}", rounded: "{rounded.control}", height: 48px}
  store-bar-button: {backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", rounded: "{rounded.control}", height: 44px}
  lift-control: {backgroundColor: "{colors.surface}", textColor: "{colors.primary}", rounded: "{rounded.control}", height: 48px}
  word-card: {backgroundColor: "{colors.surface-raised}", textColor: "{colors.on-surface}", rounded: "{rounded.card}"}
  word-card-note: {backgroundColor: "{colors.surface-raised}", textColor: "{colors.on-surface-quiet}", typography: "{typography.small}"}
  hairline: {backgroundColor: "{colors.outline}", textColor: "{colors.on-surface}"}
  word-underline: {backgroundColor: "{colors.primary-deep}", textColor: "{colors.on-surface}"}
  line: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.arabic-line}"}
  big-word: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.arabic-word}"}
  pair: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.arabic-pair}"}
  reading-line: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.arabic-reading}"}
  inline-arabic: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.arabic-inline}"}
  beat-line: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.beat}"}
  beat-line-laptop: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.beat-laptop}"}
  product-name: {backgroundColor: "{colors.surface}", textColor: "{colors.on-surface}", typography: "{typography.title}"}
  card-gloss: {backgroundColor: "{colors.surface-raised}", textColor: "{colors.on-surface}", typography: "{typography.gloss}"}
  part-conjunction: {backgroundColor: "{colors.surface}", textColor: "{colors.grammar-conjunction}"}
  part-preposition: {backgroundColor: "{colors.surface}", textColor: "{colors.grammar-preposition}"}
  part-particle: {backgroundColor: "{colors.surface}", textColor: "{colors.grammar-particle}"}
  part-negation: {backgroundColor: "{colors.surface}", textColor: "{colors.grammar-negation}"}
  part-plural: {backgroundColor: "{colors.surface}", textColor: "{colors.grammar-plural}"}
  part-possessive: {backgroundColor: "{colors.surface}", textColor: "{colors.grammar-possessive}"}
  part-verb: {backgroundColor: "{colors.surface}", textColor: "{colors.grammar-verb}"}
  part-interrogative: {backgroundColor: "{colors.surface}", textColor: "{colors.grammar-interrogative}"}
  part-demonstrative: {backgroundColor: "{colors.surface}", textColor: "{colors.grammar-demonstrative}"}
  part-subject-prefix: {backgroundColor: "{colors.surface}", textColor: "{colors.grammar-subject-prefix}"}
  part-future: {backgroundColor: "{colors.surface}", textColor: "{colors.grammar-future}"}
  part-article: {backgroundColor: "{colors.surface}", textColor: "{colors.grammar-article}"}
  part-accent: {backgroundColor: "{colors.surface}", textColor: "{colors.grammar-accent}"}
---

# OpenArabic design system

Rules for what exists: the home page approved by the owner on 2026-11-01 and the content pages behind it. Dated decisions live in `docs/decisions/`, and what may be said in `PRODUCT.md`. This site only promotes the app: no admin, no accounts, no sign-up, no founder story. A string that is in neither the ledger nor this file goes on `docs/draft-copy.txt` for the owner.

## Overview

- **The bar:** the live home page, with qamar360.com for cinematic quality. It must read as a promo for the app at first sight.
- **The reader is in a rush.** Say the important thing big, show a real picture or screen, and cut the rest. One short claim per stop.
- **The argument, in order:** read the classics; who the scholars are; you finished the course and opened a real book; you can sound it out but can't read it; in the app the meaning is one tap away; Read, Listen, Remember; try it yourself; pick a text; get the app.
- **Never against translation.** The moment of reading without the English belongs to the page, never to the app, so "In the app, the English stays above the line." follows it directly.

## Colors

The page is dark at every size: no light theme and no toggle. Set `color-scheme: dark`, and give `html` and `body` the surface. The front matter is copied from `constants/colors.ts` in the app.

| Role | Token | Use |
|---|---|---|
| Ground | `surface` | Every page |
| Raised | `surface-raised` | Word card, the one offer |
| Ink | `on-surface` | Arabic, headings, body, footer browse links |
| Quiet ink | `on-surface-quiet` | Attribution, captions, notes, disclosures, credits, leads, meta rows, breadcrumbs, the English under a reader line, the footer's legal row |
| Action | `primary` | Links in running text, controls, focus ring. The one filled control in a content page's header is "Get the app" |
| Action hover | `primary-hover` | Button hover and press |
| Signifier | `primary-deep` | Word underline. Non-text only |
| Hairline | `outline` | Edges, never the only sign of anything |

- Green means "you can act here". Navigation lists (footer, meta rows, breadcrumbs) use ink or quiet ink with an underline on hover, so green isn't spent on every link.
- A text's level is a quiet outlined tag, never a hue: hue belongs to grammar and to action.
- Grammar hues appear only on Arabic word parts and the English they match. Parts come from the classifier in `vendor/classifier`, never by hand.
- Text contrast at least 4.5:1, a signifier at least 3:1, composited on the real background.

## Typography

**Amiri and Inter.** Amiri for Arabic, Inter because it is the app's face. No third family and no italics. Sentence case everywhere, with no all-caps label or eyebrow.

**Arabic**

- Every Arabic run has `lang="ar" dir="rtl"` and uses the Amiri subset.
- Show it exactly as stored. Never normalise, re-vocalise or add kashida.
- `line-height` is never `normal`: Amiri's ink is taller than its metrics box.
- Zero `letter-spacing`. No justification or `text-wrap`. `font-synthesis: none`.
- Write a real space between words, because compression strips whitespace.
- Arabic beside other content is at least `arabic-inline`: Amiri's hairlines thin out below it.

Published English stays as stored, straight quotes included. Curly quotes are for our copy.

**Scale.** One size per role, and no step smaller than the eye can tell. Content pages:

| Role | Size and weight | Ink |
|---|---|---|
| Page title, h1 | `clamp(2rem, 6.4vw, 2.75rem)`, 500 | Ink |
| Section, h2; the offer's heading | `beat`, 1.5rem, 500 | Ink |
| Body, lead, the English under an Arabic line | `body`, 1.125rem, 400 | Ink; quiet for a lead or a translation |
| Emphasis: price, a word's gloss in an example, h3 | `body`, 500 | Ink |
| Small: meta, notes, disclosures, nav, footer, card titles (500), list chips | `small`, 1rem | Quiet, or ink for nav |
| Caption: card meta, level tag | 0.8125rem | Quiet |

Arabic beside English is always larger than it: `arabic-reading` under a title, `arabic-inline` in a line of English, `arabic-word` for a headword. Amiri has one weight, so Arabic is always 400, even inside a bold line.

On the home page the first screen's h1 is the largest English, and section titles stop at its size. Small type there is 14px for notes and 13px for captions, and the sentence that says who the app is for is never smaller than body text on a phone, except on the shortest screens.

**Files**

- Stacks: `"Amiri Subset", "Noto Naskh Arabic", serif` and `"Inter Site", "Inter Fallback", system-ui, sans-serif`.
- Amiri 400 and Inter, variable 250 to 600, are subset into `src/fonts/` and preloaded with `font-display: swap`. Ship both OFL texts.

## Layout

The home page has its own wide measure in `src/styles/home.css`. Content pages hold one column of about 46rem, and their header and footer share its edges. Arabic and English keep their own edges: Arabic right, English left, also inside a list chip. Every Arabic block ends on the column's right edge.

**Proximity.** A label sits closer to what it names than to anything else: a headword and its meaning are one unit, an English line sits 2px under its Arabic and 40px above the next, a grammar note sits under its word. Article cards run two to a row on a phone and three on a laptop. Every page passes at 390×664, 375×553 and 1280×640, with no sideways scroll.

## Components

**Word on the home page.** A `<button popovertarget>` wrapping one Arabic word, with its popover after it, so no script is needed. Its 1px `primary-deep` underline means "this can be tapped", and it never changes for any other reason. The card holds the meaning, the grammar note, audio and Close.

**Reader text.** From `docs/decisions/2026-10-31-spike-accessibility.md`.

- Each sentence that can be tapped is a `<p lang="ar" dir="rtl">` of word links. With script, a sentence is one tab stop: `role="button"`, `tabindex="0"`, `aria-label` holding its own text. Enter, Space or a screen reader's press opens it, and its words become the stops. One sentence is open at a time. A sentence that can't be tapped is plain text with no stop.
- Words move by Tab, never by arrow keys: Orca keeps the arrow keys in browse mode.
- A direct tap or click on a word opens its card. Tell it from a press on the sentence by the event target, never by `detail` or `pointerType`.
- The reader card is one shared `popover`, `role="dialog"`. Escape, Close, Tab off Close and tapping outside all close it and put focus back on the same word with `preventScroll`.
- Close stays in every card: Android Back doesn't close a popover.
- `Skip past the text` comes before the first word, works with no script, and targets the next section's `h2`.
- One visually hidden English instruction above the text, shown by the script only. Never an `aria-description` per sentence, because the Arabic voice reads it.

**Coloured word.** Adjacent spans inside one `inline-block` word, changing only `color`. No padding, margin, weight or opacity on a segment. A mark-only segment merges into its base letter. iOS below 26.2 gets one colour, by the reader script. This has never been seen on a real iPhone.

**Store links.** The official badges, unmodified, Apple first, both always, linking to `/download-app?to=<store>&from=<surface>`, where the surface is never a word or slug.

**The tap section.** Says what to do: "Try it. Tap a word you don’t know." The control is "Hide the English and read it", and it removes only the English. The heading turns to "Now read it."

**Audio.** A native `<audio controls>`. On the site's own files use `preload="metadata"`, so the length shows. The Worker answers Range for them, because iPhone Safari needs it and static assets don't give it. On the app's Supabase bucket use `preload="none"`, so nothing moves until a press.

**Attribution.** "Ibn al-Jawzī, Ṣayd al-Khāṭir", quiet, wherever the line appears.

**Footer.** On every page, after a hairline: the mark with the name, browse links, then after a second hairline Privacy, Terms, Contact, Account deletion, Analytics choice. That last page is the only consent UI anywhere: GA4 is off until someone switches it on there. Then "Amiri and Inter are used under the SIL Open Font License. App Store is a trademark of Apple Inc. Google Play is a trademark of Google LLC."

**Page frame.** `html lang="en"`, `<main>`, then `<footer>`. One `h1`, one canonical and one JSON-LD block in `<head>`.

## Motion

Everything works with no script and with reduced motion, and the static state is a complete page.

- The home page may pin stages to the scroll, bring things in as they arrive, and develop photos. Content pages have no entrance motion.
- `prefers-reduced-motion: reduce`: every duration is 0, and the stages stack.
- Sound only on a press.

## Content surfaces

Article, word, dictionary, category, author and book pages open on their content and take the visitor one step towards the app. No hero, sticky bar or popup. The one offer sits where `docs/site-plan.md`'s page map puts it.

- Reader words are links to their word page in the HTML and with no script.
- The reader shows `word_form` where its letters match the stored sentence, and the stored `arabic` with no tapping where they don't.
- An article's own image sits below its title, is served from the build, and doubles as its `og:image`. It never pushes the first Arabic line off the first screen.
- The App Store rating appears only on `/download-app`, with no count, and renders nothing if the lookup fails.
- Say "excerpts", not "complete works". Be honest that most texts are harder.
- Disclose once per page, near first use: machine-translated English and AI voices.
- The PDF page may say "side by side", "411 pages · 18 MB" and free to share. Nowhere else may.

## Imagery

Real-looking photographs from the Codex route: Claude writes `docs/imagery/<scene>/brief.md`, Codex generates, and Claude looks at every candidate at full size and critiques it. One apartment, one man seen from behind, available light, film grain. The owner rejected polished scenes as typically AI generated.

- No lettering in a generated image, and nothing readable on any page. Fake Arabic means rejection on sight. Real Arabic and text are placed afterwards.
- App UI is always a real, unedited capture, never generated or redrawn.
- Add a row to `docs/provenance.md`.

## Review

Run the rows a page type touches before it counts as done. `pnpm ship --production --dry-run` runs budgets, claims, parity and tokens. Browsers: Zen first, because it's the owner's, then Chromium. Green in Chromium alone is not a pass.

| Check | How judged | Pages |
|---|---|---|
| Native scroll, no sideways scroll | At all three sizes | All |
| No script | All content reads and links work. In the reader, words go to their word page | All |
| Reduced motion | The same content, durations 0 | All |
| Tab stops | Page top to the first control after the text takes at most sentences + 2 Tabs, past the page's own links: `scripts/check-reader.mjs` | Reader |
| Word response | At least 44px, the card shows at once, focus returns: `scripts/check-reader.mjs` | Reader, home |
| GA4 | Nothing to Google until opted in: `scripts/check-analytics.mjs` | All |
| Arabic by eye | Letters join across colours, marks on their letters, no fallback font | Anything with Arabic |
| Real iPhone | Word colour, audio. Unproven: the owner chose to assume it for launch | Reader, home |
