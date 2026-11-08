# App captures

Real screens of the running app, for the site specimens. Nothing is mocked up, edited or retouched.

| | |
|---|---|
| Date | 2026-10-31 |
| Device | Android emulator, AVD `pixel`, Android 15 (API 35), 1080x2400 |
| App | Dev client 1448.5.5 (278), JS from `open-arabic` commit `cd05fc45` (`feat/skia-3`) |
| Account | The app's QA test account, already signed in on this AVD; no password was entered |
| Capture | `adb exec-out screencap -p`, driven with Argent. Full resolution, unprocessed |

## Files

| File | Screen | Text shown | Notes |
|---|---|---|---|
| `01-reader-classical-line.png` | Reader | Ibn al-Qayyim, *Ighāthat al-Lahfān*, "The Meaning of Fasting": إِنَّمَا مَثَّلَ ﷺ ذَٰلِكَ بِصَاحِبِ الصُّرَّةِ الَّتِي فِيهَا الْمِسْكُ and the next lines | The title is scrolled off, so name the work in any caption |
| `02-word-card.png` | Card after tapping a word | الْمِسْكُ, "the musk", root م س ك | "In practice" is this account's state |
| `03-audio-playing.png` | Reader with the mini player, playing | Same article, with title and source. Player at 0:58 / 2:51, track 1 of 4 | The time advanced while capturing. Header image is a house, with no people. Its licence is unchecked |
| `04-memory-horizon-dashboard.png` | Practice dashboard, memory horizon | 784 of 1,200 practised | Crop to the horizon card, about 27% to 64% of the height. The rest shows "Day streak 0" and "Nothing reviewed yet today" |
| `05-memory-horizon-breakdown.png` | Horizon breakdown sheet | 585 days, 386 weeks, 229 months, 0 a year+ | "A year+" is empty on this account |
| `06-practice-reviews-breakdown.png` | Reviews done sheet, the practice chart | 7,594 reviews, about 42 per study day | Bars, not a time series |
| `07-voice-review-listening.png` | Voice review, mic open | دَرَجَةٌ, "Listening…" | Real mic session with no speech |
| `08-voice-review-answer.png` | Review answer face | دَرَجَةٌ, "Degree", وَيَسْتَنْزِلَهُ عَنْ دَرَجَتِهِ, "And it brings him down from his position." | Shows "Forgot · Barely · Knew it". PRODUCT.md allows those names only once 1448.5.x is live in both stores, and the example sentence reads a little bleak alone |
| `09-voice-review-speak-prompt.png` | Voice review after the mic window closed | دَرَجَةٌ, "Show answer", "Speak to answer" | |

## Before using these

- **Not a store build.** `cd05fc45` is 120 commits behind `main` (`68bc2fcd`, 1448.5.9), and those commits include a review merge. The installed native build only matches this older JS, so screens may differ from the current app, the review screens most of all. Check against 1448.5.9 before publishing.
- **The volume is test-account data, not a learner's history.** The account shows "Member since August 2026" with 180 practice days, which doesn't fit, so treat the history as seeded or backdated. I didn't find where it came from. Never present these numbers as a real user's progress.
- **Arabic and English are shown as stored,** with no check against source editions. The English is machine-translated.
- **Status bars are unedited,** with the emulator clock and icons. Crop them if needed. Clocks differ because 01 and 03 came from an earlier emulator boot (Intel GPU) than the rest (software rendering).

## Not captured

- **A graded voice answer.** The emulator had no speech input, so there is no transcript or verdict. `07` and `09` show the voice flow only up to that point.
- **A practice chart over time.** Day streak has only a few bars in its 40-day window, and the weekly forecast is a flat line near 2,000 due a day. Neither looks real, so neither is kept. `06` and the horizon dots in `04` are the volume charts.

## Keeping production read only

- The app ran from a scratch export of `cd05fc45`, using the `feat/skia-3` worktree's `node_modules` through a symlink. `open-arabic`, `open-arabic-db-fix`, `open-arabic-site-fix` and `feat/skia-3` were not modified.
- The scratch copy added one guard to `fetchWithTimeout` in `services/supabase.ts`: non-GET Supabase requests were logged and answered locally, except auth token refresh. It changes no UI code. It blocked 3 `update_reading_progress_monotonic` calls, and no token refresh or other write was logged.
- Two launches before the guard reached only the Explore screen and could not be logged. The guarded launch made no writes at that point. No review was graded.
- No env file was loaded, so Mixpanel and Sentry were off. Native Meta SDK traffic was not checked.
- The Expo Tools bubble was hidden with the dev menu's `showFab` preference on the AVD, and that was restored afterwards.
