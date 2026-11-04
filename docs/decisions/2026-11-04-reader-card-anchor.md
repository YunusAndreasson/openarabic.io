# Reader card: under its word on a laptop

2026-11-04. Follows `2026-10-31-spike-word-tap.md`, whose limits said "the sheet has no anchor positioning … real CSS will change it".

## Decision

- **Laptop, 56.25rem and up, where `anchor-name` is supported:** the one shared `#sheet` popover is placed against the open word. The script already marks that word `data-on`, so CSS makes it the anchor (`#reader .w[data-on] { anchor-name: --word }`). No script changed, 0 bytes added to the reader budget.
- It hangs from the word's right edge (`position-area: bottom span-left`), because Arabic reads from the right, and tries `bottom span-right`, `top span-left` and `top span-right` when it would leave the screen.
- **Phones, and browsers without anchor positioning:** unchanged, the sheet along the bottom. On a touch screen a bottom sheet is in reach of the thumb and never covers the line being read from above.

## Why

The card sat in the bottom-right corner of a 1280px screen while the word could be anywhere in the column, up to 600px away. Proximity: the meaning should appear where the eye already is.

## Checked

- Chromium 156 and Zen 1.24b, 1280×800: a word near the top, mid-column and the last word all open a card fully on screen, under the word or flipped above it.
- `scripts/check-reader.mjs`: Chromium 14/14, Zen 13/13. Focus, Escape, Close and focus return are untouched, because the markup and script are.
- The leftmost and rightmost words at 920×640 and 1280×640: the card takes `bottom span-right` for a word at the left edge and stays on screen in all four cases.
- Not checked: Safari, which has anchor positioning from 26.
