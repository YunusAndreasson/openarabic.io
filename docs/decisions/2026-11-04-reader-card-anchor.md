# Reader card: under its word on a laptop

2026-11-04. Follows `2026-10-31-spike-word-tap.md`, whose limits said "the sheet has no anchor positioning … real CSS will change it".

## Decision

- **Laptop, 56.25rem and up, where `anchor-name` is supported:** the one shared `#sheet` popover is placed against the open word. The script already marks that word `data-on`, so CSS makes it the anchor (`#reader .w[data-on] { anchor-name: --word }`). No script changed, 0 bytes added to the reader budget.
- It hangs from the word's right edge (`position-area: bottom span-left`), because Arabic reads from the right, and tries `bottom span-right`, `top span-left` and `top span-right` when it would leave the screen.
- **Phones, and browsers without anchor positioning:** the sheet along the bottom, in reach of the thumb.
- **Amended the same day:** the bottom sheet did cover its own word when the word was in the lower part of the screen. At 390×664, 3 of 7 sampled taps were hidden, with the word's bottom at 661px and the sheet's top at 362–407px. At 375×553 the 70svh sheet covers everything below about 166px. Once the card is filled, the script now scrolls the page so the word sits 16px above the card. It is instant, because content pages have no motion, and the word keeps its `data-on` highlight. The anchored laptop card never meets the condition. The cost is 66 B gzip: reader.js went from 950 to 1,016 B, and with the inline check the page is under its 1,250 B limit. `scripts/check-reader.mjs` checks it: "The card leaves its word in view".

## Why

The card sat in the bottom-right corner of a 1280px screen while the word could be anywhere in the column, up to 600px away. Proximity: the meaning should appear where the eye already is.

## Checked

- Chromium 156 and Zen 1.24b, 1280×800: a word near the top, mid-column and the last word all open a card fully on screen, under the word or flipped above it.
- `scripts/check-reader.mjs`: Chromium 14/14, Zen 13/13. Focus, Escape, Close and focus return are untouched, because the markup and script are.
- The leftmost and rightmost words at 920×640 and 1280×640: the card takes `bottom span-right` for a word at the left edge and stays on screen in all four cases.
- Not checked: Safari, which has anchor positioning from 26.
