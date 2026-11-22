# Daylight photographs, 2026-11-22

The owner asked for more natural-looking photographs that present the app better, judged as fine art, then: "very good please push to site", with the blend checked as a senior UI engineer would. The set is `docs/imagery/natural/brief.md`. This records how it is staged and what changed for it.

## What the old layout assumed

The page was tuned to the night set, so the new photographs could not simply replace the files:

- The first photo was pushed 24% right and its left 24% painted solid.
- The problem photo was pushed 22% right. On a wide screen, "You can sound it out." would have run white over white paper, and Remember's line over the phone and its button.
- On a phone the first photo was lifted so far that the new man lost his head.
- A screen held upright at 900px or wider got the landscape crop, which lost the phone and the chair. The old set had the same fault.

## What changed

| Where | Change |
|---|---|
| All stills, wide | Shorter top and bottom fades (13% and 20%). One shade from the words' side, `--shade`. `--shift` moves a photo clear of its words, and its left edge dissolves like its top and bottom |
| First screen | Wide: 8% right, 16% on squarer screens; the wall itself is the ground, under a lighter shade. Phone: the photo is 122% of the screen and lifted 8.4svh, so he sits above and right of the words. The headline stops at 8.5rem |
| Problem and turn | A cut, not a dissolve: they are two places. Words in three rows on a wide screen |
| Remember | 11% right, words in the green wall |
| Listen | More shade than the rest, because water is the lightest ground |
| Close | The heading stops at 7rem and the offer clears it, so the QR code no longer touches the "p" |
| Upright screens from 900px | The tall photos, with the phone's dissolve |
| Files | AVIF 62 and WebP 84 (were 53 and 70), so shadows no longer break into blocks. `turn`, `listen` and `close` tall are 54 and 74, and `hero` and `stuck` tall stay at 53 and 70, to keep a phone's load down. `turn` and `remember` are 2240 wide, and 1080 and 1260 tall exports, for the app's text |

Two questions were open when the owner said to push, and the go was taken as the answer: the set leaves the one apartment, and captures inside photographs are laid in perspective.

The same day the man in `bench` and `cable` was given a full beard: the audience is practising Muslims, modern and often in the West, who likely don't connect with a beardless man. One edit each, nothing else changed.

The photos are now all daylight. The order of the page is unchanged.

## Checked

- **Chromium**, every photo with its words at sizes from 375×553 to 2560×1440, with no sideways scroll. At 1440×900 and 390×664 also the cut, no script, reduced motion, layout shift (0) and photos unloaded while in view (none).
- **Contrast**, measured behind each line of text on and over the photos: all at 4.5:1 or better.
- **Gecko:** Zen is no longer installed on this machine (removed 2026-11-15), so Playwright's Firefox stood in, at six sizes. Zen itself and WebKit are unproven; WebKit could not start here.
- **Load time:** the home page measured 2,048 ms in the lab on the first ship of the set. On the ship with the beards the check recorded 0 ms, a failed reading it accepts as a pass, on a machine where the night set failed it too. Measure again on a quiet machine.
- **Not looked at:** the live pages by eye after either ship.

## Not changed

- `public/og.jpg` and the README's screenshots still show the night set. The owner was asked about the social card and didn't say.
