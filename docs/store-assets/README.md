# Store assets, for the owner to submit

Made by `scripts/store-assets.mjs` on 2026-11-02 (plan task 4.2). Text is `PRODUCT.md` wording, and the screens are real, unedited captures from `open-arabic/store-listing/captures/ios`, dated 2026-08-28.

| Folder | Where it goes | Size |
|---|---|---|
| `app-store/` | App Store Connect, 6.9" iPhone | 1320×2868 |
| `play/` | Play Console, phone screenshots | 1080×1920 |
| `feature-graphic.png` | Play Console, feature graphic | 1024×500 |

These replace slides saying "even as a beginner", "Real books by real scholars", "Words return before you forget them" and "Watch your vocabulary grow", and a feature graphic saying "Works offline".

**Check before submitting:**

- These captures predate app 1448.5.9, so they're due a recapture (plan task 4.3).
- `04-listen.png` lists "Remembrance That Reshapes the Heart", one of the texts the content scan flagged as modern. The site's Listen stage uses the same capture.
- `06-remember.png` shows test-account numbers. Apple and Google allow illustrative data, and the website captions it as an example account. These slides have no such caption.
- The feature graphic's headline, "Read the classics in Arabic.", is approved draft copy, not ledger wording.
- Sizes and alpha were checked with `magick identify`. `store-listing/verify.mjs` in the app repo wasn't run on these.
