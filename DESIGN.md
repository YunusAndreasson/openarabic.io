---
version: alpha
name: OpenArabic
description: One dark story page around one classical line, and reference pages that prove it.
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
  title: {fontFamily: "Alegreya Sans", fontSize: 1.3125rem, fontWeight: 500, lineHeight: "1.25"}
  beat: {fontFamily: "Alegreya Sans", fontSize: 1.5rem, fontWeight: 400, lineHeight: "1.25"}
  beat-laptop: {fontFamily: "Alegreya Sans", fontSize: 1.75rem, fontWeight: 400, lineHeight: "1.25"}
  body: {fontFamily: "Alegreya Sans", fontSize: 1.125rem, fontWeight: 400, lineHeight: "1.45"}
  small: {fontFamily: "Alegreya Sans", fontSize: 1rem, fontWeight: 400, lineHeight: "1.4"}
  gloss: {fontFamily: "Alegreya Sans", fontSize: 1.3125rem, fontWeight: 500, lineHeight: "1.3"}
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

Everything here is a current rule. Dated decisions live in `docs/decisions/`, how a rule came about
in `docs/design-history.md`, and what may be said in `PRODUCT.md`. A rule says what to do and how
it is judged. This site only promotes the app: no admin, no accounts, no sign-up, no founder story.
A string that is in neither the ledger nor this file is draft copy: list it and mark it.

## Overview

- **The one metric:** store taps per page view, by page type. A static page can't tell a visit from a view. It is counted first-party and without
  cookies, so store links go through `/download-app` and need no script.
- **The feeling:** "I can read this." The visitor reads a classical line without the English, by
  their own hand, on this page. That moment is the page's, never an app feature.
- **The concept:** A, One sentence. One line from Ibn al-Jawzi about finding a book opens the page
  unread, gets learned by tapping, loses its English at the visitor's command, and returns
  unchanged.
- **The remembered image:** the same line, twice, looking identical. Only the reader has changed.
- **The opposing idea:** that a translation is enough and the original is out of reach. Argue for
  reaching the original, never against translations.
- **Character:** a dark page with two margins. The script is the only ornament.

Who decides what, and how disputes end, is in `Lineage`.

## Colors

The page is dark at every size: no light theme, no toggle, no `prefers-color-scheme` branch. Set
`color-scheme: dark`, and give `html` and `body` the surface. The front matter is copied from
`constants/colors.ts` in the app; use it, and never take a colour from
`open-arabic/brand/DESIGN.md`.

| Role | Token | Use |
|---|---|---|
| Ground | `surface` | Every page |
| Raised | `surface-raised` | Word card only |
| Ink | `on-surface` | Arabic, beat lines, body, the hint |
| Quiet ink | `on-surface-quiet` | Attribution, captions, notes, disclosures, credits |
| Action | `primary` | Store buttons, links, lift control, focus ring |
| Action hover | `primary-hover` | Store button hover and press |
| Signifier | `primary-deep` | Word underline, `::selection` under `on-surface` text. Otherwise non-text only: 4.0:1 on the surface |
| Hairline | `outline` | Card, store bar and capture edges |

- **The Grammar Rule.** Grammar hues appear only on Arabic word parts and the English they match.
  Never on a heading, button, chart, icon or background. Judged by searching the CSS.
- **The One Accent Rule.** `primary` is the only colour on chrome. Screens 1 and 9 and the word card
  show no grammar hue.
- **Parts come from the classifier:** the app's `computeColoredSegments`, never marked by hand.
  `arabicText` means no colour.
- Role to token: `conjunction`, `preposition`, `particle`, `negation`, `plural`, `possessive`,
  `interrogative`, `demonstrative`, `accent` keep their names after `grammar-`; `verbConjugation` is
  `grammar-verb`, `subjectPrefix` `grammar-subject-prefix`, `futureTense` `grammar-future`,
  `definiteArticle` `grammar-article`.
- Contrast, composited on the real background: text at least 4.5:1, a signifier at least 3:1.
  Hairlines are decoration, never the only sign of anything, and are exempt.

## Typography

**Amiri and Alegreya Sans, chosen together.** Amiri is a book face in the Bulaq press tradition, so
the line looks like a printed classical page. Alegreya Sans has a pen's modulation that echoes
Amiri's stroke, and its small x-height stays quiet beside the Arabic. No third family, no italics,
no other weights.

Tokens give font, weight and line height. Where a size below names `fluid.*`, that wins over the
token's `fontSize`.

| Role | Token | Size, phone / laptop |
|---|---|---|
| The line, screens 1 and 9 | `arabic-line` | `fluid.arabic-line-phone` / `fluid.arabic-line-laptop` |
| Big word, screen 3 | `arabic-word` | `fluid.arabic-word` |
| Pairs, screen 8 | `arabic-pair` | `fluid.arabic-line-phone` / 44px |
| Reading text | `arabic-reading` | 1.75rem |
| Arabic beside other content | `arabic-inline` | 1.5rem, the floor: Amiri's hairlines thin out below it |
| Product name, h1 | `title` | Same |
| Beat line, h2 | `beat` / `beat-laptop` | 1.5rem / 1.75rem, at most 22ch |
| Body, store labels, Close, lift label | `body` | Same, text at most `measure` |
| Attribution, caption, disclosure, hint, pair gloss, footer | `small` | Same |
| Card meaning / card note | `gloss` / `small` | Same |

**Arabic**

- Every Arabic run has `lang="ar" dir="rtl"` and uses the Amiri subset.
- Show it exactly as stored. Never normalise, re-vocalise or add kashida.
- `line-height` is never `normal`: Amiri's ink is taller than its metrics box.
- Zero `letter-spacing`. No `text-box-trim`, justification or `text-wrap`. `font-synthesis: none`.
- Write a real space between words (`{" "}` in Astro), because compression strips whitespace.
- Arabic inside English: `<bdi lang="ar">` at `arabic-inline`.

**Latin**

- Sentence case everywhere. No all-caps label, tracking, eyebrow or kicker.
- Transliteration is real (Ṣayd al-Khāṭir, ʿUddat al-Ṣābirīn) and never falls back to another font.
- Published English (glosses, notes) stays as stored, straight quotes included. Curly quotes are
  for our copy.
- `h1` is the product name. Each beat's `h2` is its one line, ending as the ledger sentence does.

**Files**

| Face | In `docs/specimens/shared/fonts/` until the site has `src/fonts/` | KB | Load |
|---|---|---|---|
| Amiri 400 | `amiri-regular.subset.woff2` | 51 | Preload, `font-display: swap` |
| Alegreya Sans 400, 500 | `alegreya-sans-400.subset.woff2`, `alegreya-sans-500.subset.woff2` | 29 each | `swap`, no preload |

- Stacks: `"Amiri Subset", "Noto Naskh Arabic", serif` and `"Alegreya Sans", system-ui, sans-serif`.
- Arabic subset, `--layout-features='*'`, one file per face, because a separate marks file breaks
  joins:
  `U+0020,U+00A0,U+0600-0605,U+060C,U+061B,U+061C,U+061E,U+061F,U+0621-063A,U+0640-0671,U+06D4`,
  `U+06D6-06ED,U+0898-089F,U+08D3-08FF,U+200C-200F,U+2010-2014,U+2018-201D,U+2026,U+25CC`,
  `U+FD3E-FD3F,U+FDF2,U+FDFA,U+FE70-FE7F`.
- Latin subset, `--layout-features='*'`: Basic Latin, Latin-1, `āīūĀĪŪḍḌḥḤṣṢṭṬẓẒšŠğĞʾʿ`, curly
  quotes,
  dashes, ellipsis.
- Ship both OFL texts. Digital Khatt, Scheherazade and Noto Nastaliq stay out of the site.

## Layout

**Two margins.** Arabic, captures, images, audio and attribution hold the right margin at every
width. English holds the left. Exception: English that glosses Arabic sits with its Arabic. Nothing
is centred, except text inside a button, a word inside its button and a pair's gloss under its word.

**Spacing is by relationship.**

| Token | Between |
|---|---|
| `word` | One thought: line and attribution, h1 and requirement, h2 and what follows, capture and caption, audio and attribution, a line and its disclosure or date, big word and its English, stage and attribution, card parts |
| `thought` | Thoughts in a beat: successive sentences, price, account note, store buttons; sentence and pairs; hint and attribution; footer parts and links. Card padding |
| `block` | Groups: attribution and h1, a beat's English and its object on phones, attribution and control on phones |
| `fluid.beat-gap` | One beat and the next, above the store bar, above the footer |

| Width | Grid |
|---|---|
| Below `laptop` (900px) | One column, `gutter`, no top padding: Amiri's line height is the air. Screen 2 follows screen 1 at `block` |
| `laptop` and up | `minmax(18rem, 2fr) 5fr`, `column-gap`, `gutter-laptop`, centred at `page-max`. English left, object right, both starting at the top |

**First screen, phone:** the line, its attribution row, then h1, requirement, price, account note,
store buttons. **Laptop:** the same DOM order. The grid puts the line and attribution on the right
and the rest on the left, both columns aligned to the end, `min-height: calc(100svh - peek)`, with
`block` padding below. The next beat follows with no `beat-gap`, so its top is the peek. Screen 9
uses this same grid, alignment, padding and `min-height`, with no `beat-gap` above it. On every
width
the line takes its column's full width: `measure-arabic` is for reading text and the stage sentence.

**Captures** show at `height: fluid.capture-height`, `width: auto`, holding the right margin.

**Tested layouts.** These are what browsers really leave. Every page passes at all three.

| Viewport | Must hold |
|---|---|
| 390×664 | Whole offer visible with no scroll, at least 48px of the next beat showing, no sideways scroll |
| 375×553 | The same. Arabic has a floor of 30px |
| 1280×640 | The same, line on the right and offer on the left, on one screen |

- **The offer** is what it is, who it's for, price, account note and working store links.
- **The peek** is measured to the top of the next beat's first text, not its gap.
- **Empty band:** no vertical span across the full page width holds no text, image, audio or control
  for over 40% of the viewport, leaving the store bar out. A sparse screen reads as the end of the
  page. A column left empty beside content is not a band.
- Story length: at most 12 screens at 390×844.

## Elevation & Depth

Depth is tonal. `surface-raised` with an `outline` edge lifts the word card. No shadows, glows,
gradients, blurs or glass. The store bar is flat `surface` with a top `outline`.

## Shapes

| Radius | Use |
|---|---|
| `control` | Store buttons, lift control |
| `card` | Word card (top corners only as a bottom sheet) |
| `capture` | Captures and composited images |
| 0 | Word underline, hairlines |

No pills, circles, icon tiles or decorative shapes. Official store badges keep their own shape.

## Components

**Word.** A `<button>` wrapping one Arabic word, `inline-block`, inheriting font, size and line
height, `min-width` and `min-height` 44px, padding `0 0.1em`. Its signifier is a 1px
`primary-deep` bottom border. Its popover follows it in the DOM, so no script is needed and focus
order holds. The line is a `<div>`, because a `<p>` can't hold a popover. Screens 1 and 9 each
hold their own 9 cards: ids `w0`–`w8` and `r0`–`r8`, anchors to match.

```html
<div class="line" lang="ar" dir="rtl" role="group"
     aria-label="A line from Ibn al-Jawzi. Each word opens its meaning.">
  <button class="w" type="button" popovertarget="w0" style="anchor-name:--w0">وَإِذَا</button>
  <div class="card" id="w0" popover lang="en" dir="ltr" style="position-anchor:--w0">…</div>
</div>
```

| Control | Hover (`@media (hover: hover)`) | Pressed | Focus visible |
|---|---|---|---|
| Word | Underline `on-surface-quiet` | Also while its card is open (`.w:has(+ :popover-open)`): background `color-mix(in oklch, on-surface 10%, surface)`, underline `primary` | 2px `primary` outline, offset 0 |
| Store button | `primary-hover` | `primary-hover` | 2px `primary` outline, offset 2px |
| Lift control | Background as a pressed word | Same | The same |
| Link, Close | Underline 2px (links rest at 1px, Close at none) | None | The same; Close uses offset -2px, because its card clips it |

Pressed paints with no transition, within 100ms. Hover uses `state`. Set `touch-action:
manipulation`.

**Word card.** `popover` (auto), so light dismiss and Escape close it. Holds, in order: the English
meaning (`gloss`, one ink), the grammar note (`small`, quiet), an audio control only if that word
has a stored track, and "Close". It doesn't repeat the Arabic. Padding `thought`, except 0 at the
bottom; gaps `word`. It sits inside the `.line`, so reset its font, size, line height and alignment
(`small`, left). It touches its word's underline, with no gap. It appears with `touch` and closes
at once. Close is a left-aligned `primary` text button, full card width, 44px tall, no radius,
`popovertargetaction="hide"`, sticky at the card's bottom on `surface-raised`, so it's reachable.

- Base form, a bottom sheet: `position: fixed`, full width, `max-height: 70svh`, scrolling inside.
- Inside `@supports (anchor-name: --a)`, anchored and scrolling inside:
  `inset: auto; top: anchor(bottom); position-try-fallbacks: flip-block;
  max-height: calc(50svh - 1.5rem)`. Phones: `right: gutter`, width
  `min(card-phone, 100vw - 2 * gutter)`. Laptop: `right: anchor(right)`, width `card-laptop`.
- **Never `position-area` here:** inside `dir="rtl"` Gecko puts the card off-screen.
- Anchored, the word stays visible and all 18 cards stay in the viewport at all three sizes. The
  sheet is a fallback for old browsers and may cover a word on a laptop.

**Coloured word and English.** Each word sits in its own `inline-block`. Inside, adjacent spans
change only `color`, by class. The same gate covers a word's matching English, which has no
meaning without the colour; a real space separates its parts, outside the colour. A word with no
coloured part is plain text, with no `w-plain` or `w-seg`.

```html
<span class="seg-word"><span class="w-plain">فَكَأَنِّي</span><span class="w-seg"><span
  class="part-conjunction">فَ</span><span class="part-preposition">كَ</span><span>أَنِّي</span></span></span>
```

```css
.w-seg { display: none; }
@supports (field-sizing: content) { .w-plain { display: none; } .w-seg { display: inline; } }
```

- That gate gives iOS below 26.2 one colour, with no script.
- On a segment: no padding, margin, weight, font, `inline-block` or opacity.
- A mark-only segment merges into its base letter, so letter and mark take the colour together.
- Punctuation stays inside the word's `inline-block`, outside the coloured spans.
- Inline `style` is for anchor names only, and the site's CSP must allow it.

**Store links.** The one action: a left-aligned row with `store-gap`, wrapping if it must, sized to
content. Apple's official black badge first, then Google's, unmodified and not animated, 48px tall,
with clear space of a quarter of their height. No device sniffing: both always show, because the
pages are static. Until official artwork is in the repo, specimens use `store-button` stand-ins
labelled "App Store" and "Google Play", with `store-inset` at the sides. Site destinations are
`/download-app?to=ios&from=<surface>` and `…to=android…`, where `from` is `home`, `word`, `read`,
`book` or `qr`, never a word or slug; the story page's are all `home`. Links open in the same
tab. Specimens link
`https://apps.apple.com/app/openarabic/id1594031029` and
`https://play.google.com/store/apps/details?id=com.edenmind.OpenArabic`.

**Store bar.** A `<div>` of buttons only, not wrapping, left-aligned on the page grid, with a
full-width background, `z-index: 1`. `position:
sticky; bottom: 0`, the last child of a wrapper around screens 3 to 7, at all widths. So it appears
after the first buttons have left, stops being stuck before screen 8, and never covers the stage.
Buttons 44px, `store-bar-inset` above and below, 67px in all. Never a modal, interstitial or timer.

**QR.** Laptop only, on screen 9, after the store buttons: a static inline SVG of the
`/download-app` URL with `from=qr`, 120px, on a light plate with its quiet zone. A specimen omits it
and says so in an HTML comment.

**Lift control.** A `<section>` with `position: relative`, in DOM order: the h2, a visually hidden
checkbox with `aria-label="Take the English away"`, the stage, the attribution, the `<label>`, so
CSS
alone does it. 48px tall, `thought` at the sides, a 1px
`primary` border, `primary` text. Its focus ring draws on the label. Both label texts sit in one
grid cell and toggle by `visibility`, so its width never changes. Checked: every English in the
stage goes `opacity: 0; visibility: hidden`, keeping its space so nothing moves; part classes fall
back to `on-surface` over the same `lift` duration, both ways. The label text swaps at once and the
control looks the same checked. The state isn't kept across reloads.

**Audio.** A native `<audio controls preload="none">` with `color-scheme: dark`, an `aria-label`,
full width on phones, `measure` on a laptop, 48px tall. It differs per browser, and that's
accepted. No autoplay, no skin.

**Capture.** A `<figure>` with a flat, whole `<img>`: `width`, `height`, `decoding="async"`,
`loading="lazy"`, radius `capture`, 1px `outline` edge. Status bars stay. The caption sits below in
`small` quiet, aligned to the capture's left edge, no wider than it. Alt text says in one sentence
what the screen shows. No device frame. "Capture 02" is the file starting `02-` in
`docs/specimens/app-captures/`.

**Attribution.** `small`, `on-surface-quiet`, right-aligned, exactly "Ibn al-Jawzi, Ṣayd al-Khāṭir"
with no closing period, as an underlined quiet link to the article, the one link not in `primary`.
On
every beat holding the line or its sound: 1, 4, 8 and 9. Not on 3: one word isn't a featured text.
On
8 it sits outside the stage, so it survives the lift.

**Footer.** On every page, left-aligned, wrapped, no divider, `block` padding at the bottom,
credits within `measure`. A row of `primary` links in `small`, each at least 44px tall: Privacy
(`/privacy`), Terms (`/terms`), Contact (`/contact`), Account deletion
(`/account-deletion`), Analytics choice (`/analytics-choice`). That last page is the only consent
UI anywhere: GA4 is off until someone switches it on there, and there's no cookie banner. Then in
quiet `small`: "Amiri and Alegreya Sans are used under the SIL Open Font License. App Store is a
trademark of Apple Inc. Google Play is a trademark of Google LLC." The ring mark
(`docs/specimens/shared/mark-dark-64.png`, shown at 32px, clear space 0.309 of its diameter, empty
alt, flush with the margin) comes first, once. Never re-coloured, re-stroked, or on an image
without a solid plate.

**Page frame.** `html lang="en"`, `<main>` holding one `<section>` per beat, then `<footer>`.
Sections take ids `screen-1` to `screen-9`. `<title>` is the product name, the meta description is
the requirement sentence, theme colour is `surface` as hex. Scrollbars stay as the browser draws
them. Links are `primary`, underlined. No header on
the story page. Specimens add `noindex, nofollow`, may copy tokens by hand into `:root`, and may
use capture PNGs. The site generates `tokens.generated.css` from this file and serves resized
images.

## Do's and Don'ts

| Do | Don't, and do this instead |
|---|---|
| Let the Arabic be the loudest thing in every frame | Don't put a hero image behind the line. Use the line alone |
| Give each claim one screen, in ledger wording | Don't write a feature grid or pricing table. Use the beat sheet in `Story` |
| Use exact wording from `PRODUCT.md` | Don't paraphrase the ledger. Use it as written, or list the new line as draft copy |
| Use a real capture for any app UI | Don't draw or generate app UI. Composite a real capture, flat and whole |
| Use real data for the tappable line | Don't type glosses by hand. Use published glosses and classifier segments |
| Let the visitor do the reveal | Don't resolve the line on scroll. Use the lift control |
| Scroll natively | Don't pin, snap, hide the scrollbar or catch wheel events. Use plain sections. The one laptop pin stays unspent unless a test requires it: then below the first screen, nothing stated only there, never on phones |
| Show offer words at first paint | Don't fade in text. Use no entrance motion |
| Answer a tap at once | Don't wait for script to hydrate a word. Use native `popover` |
| Keep a store link one tap away | Don't open a modal or timed prompt. Use the store bar on the story page and one inline offer elsewhere |
| Disclose AI voices and machine translation where each is described | Don't say "native audio" or "reviewed translation". Use the disclosure lines |
| Name scholar and work for every featured text | Don't feature an anonymous or modern-sounding line. Use the attribution |
| State the requirement plainly | Don't say "even as a beginner". Use the requirement sentence |
| Say the ending is the page's | Don't imply an Arabic-only reader. Screen 9, the next thing after the stage, says the app keeps its English |
| Keep the feeling unnamed | Don't write "beautiful", "journey", "unlock", "transform", "master". State what happens |
| Write to "you" | Don't write "our learners", "users" or "we built". Say what you can do |
| Use numbers only for a real sequence or count | Don't number sections or add eyebrows. Let the h2 carry it |
| Join facts with sentences | Don't use middle dots, "word — fragment" labels, arrows on links or monospace labels. Only the ledger's PDF line keeps its dot |
| Keep headings in one ink | Don't accent a word in a heading. Colour only marks word parts |
| Say what is true today | Don't write "forever", "always", testimonials or user counts. Use "Free. No ads. No subscription." |
| Keep motion to `motion` tokens | Don't write literal durations or easings. Generate them from the tokens |
| Take tokens from this file | Don't hand-write colours in site CSS, or use `design.md export`. Generate them |

## Lineage

| Who | Decides | Test on this site |
|---|---|---|
| **Rams** | What is on the page | Remove it: does the visitor lose anything, feeling included? Each element has one sentence saying what it does for the visitor. No invented ratings or testimonials, no feature grid |
| **Norman** | How it is found, used and felt | Signifiers and feedback. Visceral: the beauty of the script in the first seconds. Behavioural: a tap answers at once. Reflective: "I can read this" |
| **Nielsen** | Whether it passes: a gate, not a style | The 10 heuristics and the 0.1, 1 and 10 second limits. Five-user tests find problems, not rates |
| **Nolan** | How time and feeling are structured | Structure carries meaning; plant and pay off; one reveal; real text and the real app. One remembered image |

**The tie-break.** Rams decides what stays. Norman and Nolan decide how it is found and felt.
Nielsen can veto anything that fails a user.

- A veto needs an observed failure or a crossed threshold, not an opinion.
- Understanding the offer and reaching a store are never traded. Minor friction gets weighed.
- A feeling counts as a use, so Rams can't delete the reason for the page.
- A page nobody feels isn't finished, but no learner test gates a release: the owner skipped it. Evidence comes after launch.

Excluded from Nolan: outrage, antagonists, ticking clocks, escalation. A relentless page would
misdescribe a calm app.

## Story

**Pace.** One idea per screen, where a screen is a `<section>`. At most 40 words of English, not
counting the stage, card contents, button labels, attribution or hidden text. The h1, hint,
captions and
dates count. Each claim
appears once; only store links and the line recur. First real app capture: screen 2. Pay-off: screen
9, or screen 8 when the visitor presses the control.

| # | Holds | Exact words, in order | Object |
|---|---|---|---|
| 1 | The offer | Attribution, then hint "Tap a word." in ink, in one right-aligned row under the line. h1 "OpenArabic: Read the Classics". "If you can sound out Arabic script, you can start reading classical texts." "Free. No ads. No subscription." In quiet `small`: "An account is needed in the app." | The tappable line, one colour. Store buttons belong to the offer, on the left |
| 2 | The tap | h2 "One tap gives you the meaning, a grammar note and audio." | Capture 02 |
| 3 | Colour | h2 "Colour shows how multi-part words are built." | فَكَأَنِّي, coloured, with "so as if I" under it, matched, at `beat-laptop` at all widths, right-aligned. Not tappable |
| 4 | Sound | h2 "Arabic audio on every word and every line." "Every text plays English first, then Arabic, or Arabic only." Disclosure "The audio uses AI voices." | The line's audio control, attribution. No Arabic text |
| 5 | The reader | h2 "English above every Arabic line." Disclosure "The English is machine-translated." | Capture 01, in a promo shot once one has passed critique |
| 6 | Review | h2 "You answer out loud before the app shows the meaning." "Words return when your predicted recall falls to 90%." | Capture 07 |
| 7 | The library | h2 "Excerpts from 22 classical works by six scholars". "Ibn al-Jawzi, Ibn al-Qayyim, an-Nawawi, Ibn Taymiyyah, al-Bukhari, adh-Dhahabi." "Sorted by difficulty. Most texts are advanced; 48 are easier." In quiet `small`: "Counted on 31 October 2026." | Scene: closed books, once one has passed critique. With none, the right column stays empty |
| 8 | The moment | Visually hidden h2 "Read the line". The whole English sentence above the pairs. Each word's English beneath it. Control "Take the English away" / "Bring the English back" | The stage: sentence and coloured pairs, not tappable, then attribution. On a laptop all on the right, the control on the left. The control starts its column at the top. On phones it comes last, left-aligned |
| 9 | The return | h2 "That was this page." "In the app, the English stays above the line." Store buttons. In quiet `small`: "Free as sadaqah jariyah." | The line exactly as on screen 1, tappable, with its attribution and no hint. Nothing explains it. QR on a laptop |

- **Sentence, screen 8:** `beat` / `beat-laptop`, right-aligned, within `measure-arabic`.
- **Pairs, screen 8:** a wrapping `dir="rtl"` flex row, `word` gaps. Each pair is a column: the word
  in `arabic-pair`, then its gloss in `small` ink, centred, at most 8ch on phones and 12ch on a
  laptop, `min-height` of 2 lines so rows align.
- **Identical means identical.** On screens 1 and 9 the line is the same component, size and right
  margin, with no colour and no English on or under it. Screen 9's DOM order starts with the line,
  as
  on screen 1. "Nothing explains it" means the line: the words beside it are the table's.
- **Disclosures** are `small` quiet, straight under their beat's words, once per page. The line's
  English elsewhere on the page doesn't repeat them.
- **A visitor who never scrolls** still gets the offer, a store link and a real line to tap.
- **Any order works.** Fast scrolling, anchors and screen readers skip the reveal, so each beat
  stands alone.
- **The app's own card** has audio, so screen 2's claim is about the app even when a word on this
  page has no track.
- **Capture captions** until a store build is captured: "Emulator capture of a development build,
  1448.5.5." Capture 01 first names its text: "Ibn al-Qayyim, Ighāthat al-Lahfān."
- **Library counts** come from data at build time, with their date.
- **Draft copy needing the owner:** "Tap a word.", "Take the English away", "Bring the English
  back",
  "Read the line", "That was this page.", "In the app, the English stays above the line.", the two
  disclosures, "Free as sadaqah jariyah.", the date line, captions, alt text, `aria-label`s.
  Specimens
  underline visible ones (the text itself, not its container): 1px dashed `on-surface-quiet`, offset
  0.15em. A shipped page has none left unapproved.

## Motion

Everything works with no script and with reduced motion. The static state is the designed state.

| Token | Use |
|---|---|
| `touch` | Word card opening: opacity only, via `@starting-style`. Closing is instant |
| `state` | Hover colour. Pressed has no transition |
| `lift` | The English leaving and the colour falling back: the page's one orchestrated moment |
| `navigate` | Native cross-document `@view-transition` root crossfade, where supported |

- **Never:** entrance animation, scroll-triggered reveal, parallax, looping motion, autoplay,
  count-up, carousel, typewriter, `ClientRouter`, or any scroll-driven effect on phones.
- A laptop scroll-driven ornament goes inside `@supports (animation-timeline: view())`, on secondary
  content, at most 400ms, once, over a designed static state. The default is none.
- `prefers-reduced-motion: reduce`: every duration is 0. Nothing else changes.

**Budgets.** The story page's offer, tap, lift, colour gate and store bar use no JavaScript.
**JS budget, gzip, enforced in CI** (from `docs/decisions/2026-10-31-spike-word-tap.md`): 0 on word,
dictionary, category and legal pages; 1KB on the reader; at most 0.25KB on the story page, only if the
old-iOS colour gate can't be done without script; 1.5KB hard cap on any page, which includes about
0.5KB reserved for a store-tap counter, released if the no-script counter survives plan task 3.0. The
limits describe a visitor who hasn't opted in to GA4. Others: LCP at most 2.5s, INP at most 200ms, CLS at most 0.1,
CSS at most 12KB gzip, first-view fonts at most 110KB, phone first load at most 1MB.

**Sound.** Silent by default, sound only on a tap. Male voices, no instruments. Silence beats a bad
sound.

## Imagery

The Arabic is the picture. Screens 1, 3, 8 and 9 have no image, and neither does a content page's
first screen. At most two images on the story page: the promo shot on 5 and the scene on 7. A beat
with no approved image ships without one, using its capture or words. Never a placeholder.

**The world.** Lamplit closed books at night: one low warm light, quiet shelves, deep sage shadow,
in
keeping with `surface`. Same light, lens height and palette across images.

**Codex route.** Claude directs, Codex generates. This overrides the research rule against generated
images.

1. Claude writes `docs/imagery/<scene>/brief.md`: purpose in the beat, the world, prompt, size, and
   the rejection list. Prompt core: "Quiet still life, closed old books on a dark wooden shelf,
  single
   low lamp from the left, deep green-black shadow, film grain, no people, no text, no letters, no
   calligraphy, no symbols, plain blank spines and covers."
2. Codex generates at least 4 candidates, saved to `docs/imagery/<scene>/v<n>/`.
3. Claude looks at every candidate at full size and at 390px, writes the critique in `brief.md`, and
   iterates on the prompt. At least two rounds; the first pass is never taken.
4. Claude composites real captures and real Arabic afterwards, then exports AVIF with a WebP
   fallback, at most 120KB at 2× display width.
5. Add a row to `docs/provenance.md`: file, prompt, tool, date, captures used.

**Rejected on sight:** any lettering, or anything resembling script, including fake Arabic; a
mosque,
crescent, lantern cliché or a manuscript passed off as real; people who aren't modestly dressed
(women
in hijab or niqab), or any face no one needs; glow, lens flare, gold dust; a recognisable real book
or
building; a look we could date to this year.

**Compositing.** Generated images never hold lettering: Arabic text and app screens are real and
placed afterwards. App UI is always a real capture, never generated or redrawn. In a promo shot it's
frontal, flat, whole and sharp: no tilt, perspective, reflection or 3D device. Generic device edges
only, nothing Apple-specific, never two platforms' hardware together.

**Honesty.** Never caption a generated image as a photograph or a historical object. Alt text says
what it shows, and a scene makes no claim. Text over an image needs a measured 4.5:1; prefer none.

**Captures.** From `docs/specimens/app-captures/`, which has its own notes. Don't publish 04, 05 or
06
as a learner's progress: test-account data. 03 has an unchecked image. 08 shows grade names the
ledger
holds back. Re-capture from the store build before publishing. The site never serves the 1080×2400
PNG.

## Content surfaces

Article, word, dictionary, author and book pages are the proof. Each opens on its content and takes
the visitor one step towards the app. They share type, colour, the word component and the footer.

| Rule | Check |
|---|---|
| Content first: no hero, entrance motion or first-screen image | Arabic or headword above the fold at all three sizes |
| No sticky bar, popup or interstitial | None in the DOM |
| One offer per page, in `body` with store links, in that page's place | Exactly one |
| Arabic at `arabic-reading` within `measure-arabic`, right-aligned; "English under every Arabic line." at `body` within `measure`, left-aligned | By eye |
| Smart App Banner with a page-specific `app-argument`, if the offer still shows | A real iPhone |
| One name per destination: "Get the app" always means `/download-app` | Search the templates |

| Surface | Holds, in order | Offer |
|---|---|---|
| Article | Title, scholar and work, Arabic and English lines, disclosures | At the end of the text |
| Word | The word at `fluid.arabic-word`, meaning, audio, example sentence and source | Right after the example, about this word, with a link to the source passage |
| Dictionary | Search, then results | At the end of the results |
| Author, book | Name, works with published texts, excerpts by difficulty | Beside the download on a book, at the end on an author |

- **Top line, content pages only:** the product name linking home on the left, "Get the app" on the
  right, in `small`, not sticky.
- Words in the reader are links to their word page with one shared popover, not the story's per-word `Word`, per `docs/decisions/2026-10-31-spike-word-tap.md`.
- Say "excerpts", not "complete works". The easier 48 are the curated starting path, and the page is
  honest that the rest are harder.
- Disclose once per page, near first use: machine-translated English and AI voices.
- The PDF page may say "side by side", "411 pages · 18 MB" and free to share. Nowhere else may.
- The story page's reveal never runs here.

## Review

Run the rows the matrix marks for the page type before a page counts as done. `[T]` a tool checks it,
`[P]` a person must. A specimen passes the `[T]` rows it can run and lists the rest. Applicability
isn't a judgement call: a blank cell means the row doesn't apply.

| Check | How judged | Story | Article | Word | Directory | Legal |
|---|---|---|---|---|---|---|
| `[T]` Offer at first paint | At 390×664, 375×553 and 1280×640 the rects of what, who, price and store links are in the viewport, with no script | Yes | | | | |
| `[T]` Offer in its place | The page's one offer is where `docs/site-plan.md`'s page map puts it, and its store links work | Yes | Yes | Yes | Yes | |
| `[T]` Peek | At least 48px of the next beat above the fold | Yes | | | | |
| `[T]` Native scroll | A 500px wheel moves `scrollY` 500px; no sideways scroll, scroll-snap or phone pin | Yes | Yes | Yes | Yes | Yes |
| `[T]` Word target and response | At least 44px; card painted within 100ms; every card in the viewport | Yes | Yes | | | |
| `[T]` Reduced motion | The same layout, durations 0 | Yes | Yes | Yes | Yes | Yes |
| `[T]` No script: lift | Tap, Close, lift, audio and store links work | Yes | | | | |
| `[T]` No script: page | All content is readable and links work. In the reader, words go to their word page | | Yes | Yes | Yes | Yes |
| `[T]` Budgets | As in `Motion`, for that page type, in CI | Yes | Yes | Yes | Yes | Yes |
| `[T]` Claims | Every sentence traces to `PRODUCT.md` or the draft list; banned phrases absent | Yes | Yes | Yes | Yes | Yes |
| `[T]` Tokens | Lint: 0 errors, 0 warnings, a `token-summary` present; generated CSS has no drift; no colour literal below the front matter | Yes | Yes | Yes | Yes | Yes |
| `[T]` Accessibility | Automated scan 0 serious; 200% zoom works; heading outline reads as the argument | Yes | Yes | Yes | Yes | Yes |
| `[P]` Keyboard and screen reader | The interaction contract from plan task 2.0 | Yes | Yes | Yes | Yes | Yes |
| `[P]` Arabic by eye | In Zen and Chromium: letters join across coloured spans, marks on their letters, shadda and kasra clear, underline clear of marks, no fallback font | Yes | Yes | Yes | Yes | |
| `[P]` Real iPhone | Word colour on iOS 18, 26.x and 27.2, and the one-colour path below 26.2 | Yes | Yes | | | |
| `[P]` Daylight | Arabic read comfortably outdoors on a phone, on the dark page | Yes | Yes | | | |

Page types: Directory covers dictionary, letter, category, author and book pages. `/download-app` uses
the Story column for offer and budgets, without Peek or Word rows.

`[P]` Rules only, for this file: is anything here a story about how we got here? Move it to
`docs/design-history.md`.

Not run, by the owner's decision, and not a gate: the emotion test, tap signifier, remembered image
and cold view, which all need recruited people. The owner skipped them. Post-launch signals in
`docs/site-plan.md` stand in, and they are weaker. Cold viewing stays welcome if a chance arises.

Browsers: Zen is required, because it's the owner's; Chromium is the second. Green in Chromium alone
is not a pass. Specimens live in `docs/specimens/`, are noindexed, and aren't site code.
