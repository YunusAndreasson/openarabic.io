# OpenArabic: what is true and who it is for

Read this before writing any public copy. Decisions come from `docs/decisions/2026-10-31-owner-review.md`, and evidence from `docs/research/claims-audit.md`, checked at `open-arabic` commit `68bc2fcd` (the audit's file:line sources are the `AS`, `APP`, `STR` and similar codes used there). A claim that isn't listed here doesn't go on the site.

## Names

| Thing | Use |
|---|---|
| Product | OpenArabic: Read the Classics |
| Person, where one is named | Yunus Andréasson |

The live store titles and `app.json` differ from the product name, and both stores show "Jonas Andreasson". Those are owner tasks, so don't describe the store listings as matching.

## Audience

Someone who finished an Arabic course but can't read books. They can sound out the script, which is a requirement: nothing in the app teaches it. Say so in these words: "If you can sound out Arabic script, you can start reading classical texts."

Most texts are hard: 48 of 239 are easier, and 80% are Advanced or Expert. The site offers a curated starting path from those 48 and is honest that the rest are harder.

## Promise and feeling

- **The moment:** reading a classical line without the English.
- **Whose moment:** the visitor's. The founder has had it, but their story stays off the site, so no founder narrative, quotes or "I built this because".
- **On the page, not in the app:** a line resolving with the English gone is a moment the page creates. The app has no Arabic-only reader, so never present it as an app feature.
- **Never against translation:** the app shows English beside the Arabic. Argue for reaching the original, not against translations.

## Why it is free

The reason is sadaqah jariyah, and the site may say so. The owner approves the exact sentence. State "Free. No ads. No subscription." as a fact of today, never with "forever" or "always".

## Religious content

- **Sign-off:** the owner's decision is "all input is valid so no need for sign off". There is no reviewer step, and a featured text doesn't wait for one.
- **Attribution:** name the scholar and the work for every featured text, and show the Arabic exactly as stored. Never normalise or alter vocalised text.
- **Limits of what we checked:** Arabic fidelity to source editions wasn't checked, so never claim it. Say "excerpts", not "complete works".
- **Disclosure:** where audio and translation are described, say the audio uses AI voices and the English is machine-translated. Don't say translations are reviewed unless that has been verified.

## Claims ledger

Counts are as of 2026-10-31. Generate them from data at build time and show their date. Don't imply the library is growing: the newest text is from 2026-03-10.

### Allowed

| Topic | Wording | Source |
|---|---|---|
| Authors | Name only those with published texts, from published articles: Ibn al-Jawzī, Ibn al-Qayyim, an-Nawawī, Ibn Taymiyyah, al-Bukhārī, adh-Dhahabī. Long vowels and emphatic letters are marked, as in the stored work titles | Audit §2 |
| Library | "Excerpts from 22 classical works by six scholars"; 239 texts; 13,600+ dictionary entries | Audit §2, §4 |
| Topics | Creed, fiqh, sīrah, ḥadīth, tafsīr | Audit §4 |
| Difficulty | "Sorted by difficulty. Most texts are advanced; 48 are easier." | Audit §4 |
| Reader, app | "English above every Arabic line." | Audit §3 row 5 |
| Reader, web | "English under every Arabic line." | Audit §3 row 5 |
| PDF | "side by side"; "411 pages · 18 MB"; free to share | Audit §3 row 5, §4; owner review |
| Word tap | "One tap gives you the meaning, a grammar note and audio." | Audit §4 |
| Saving | "Tap for the meaning. Long-press to save it." | Audit §4 |
| Roots | "For most words, see the root and other words built on it." | Audit §4 |
| Colour | "Colour shows how multi-part words are built." | Audit §4 |
| Audio | "Arabic audio on every word and every line." | Audit §3 row 3 |
| Audio order | "Every text plays English first, then Arabic, or Arabic only." | Audit §3 row 4 |
| Voice review | "Hear the Arabic, then say what it means in English. The app grades your answer." | Audit §3 row 2a |
| Voice privacy | "Your voice is transcribed on your device and the audio is never uploaded. The text of your answer is saved." | Audit §3 row 2c |
| Voice model | "On your device, after a 100 MB download." | Audit §4 |
| Recall | "You answer out loud before the app shows the meaning." | Audit §4 |
| Scheduling | "Words return when your predicted recall falls to 90%." FSRS may be named; don't say it is trained on you | Audit §4 |
| Daily load | "You choose 10, 20 or 30 new words a day." | Audit §4 |
| Offline | "Audio you have played stays on your phone, and reviews made offline sync when you reconnect." | Audit §3 row 6 |
| Price | "Free. No ads. No subscription." plus "An account is needed in the app." | Audit §3 rows 8c, 8d |
| Tracking | "We never ask to track you across other apps." | Audit §3 row 8e |
| Software | "Built with open-source libraries." | Audit §4 |

The true claims nobody makes yet are the strongest material, so start with them: memory horizon, five Arabic typefaces, new words that pause when recall drops, a wrong voice result you can overrule, and explanations grounded in Lane's Lexicon (see audit §6).

### Conditional

| Claim | Condition |
|---|---|
| App Store rating | Show without a count, fetched from the store, and render nothing if the lookup fails. Never hard-coded, and no `aggregateRating` in JSON-LD. The owner chose this against the recommendation |
| "Forgot · Barely · Knew it" | Only once 1448.5.x is live in both stores. Until then, leave grade names out |
| Consent and measurement wording | Only once consent is live |

### Banned

| Never say | Why |
|---|---|
| "native audio" | All audio is generated |
| "practise pronunciation", "say it back" | Arabic speech is never assessed; the expected answer is English |
| "even as a beginner" | The script is required |
| "side by side", outside the PDF | The app and web stack the lines |
| "Arabic then English" | The order is English first |
| "Everything works offline", "works offline once downloaded" | There is no download feature |
| "Switch to Arabic-only" for reading | Arabic-only exists for audio only |
| "tap adds to your deck" | A tap only opens the card |
| "no tracking" | Meta, Mixpanel and GA4 are present |
| "open source", "open-source app" | The repo is private with no licence |
| 90-95% comprehension, 5-10% new vocabulary, i+1 | Nothing measures them |
| "A few minutes a day is enough", "progress in weeks" | No evidence |
| "Learn to read Arabic" | It is not a course |
| "free forever", "always free" | Stated as a fact of today only |
| "You read the actual text, not a translation" | Both are shown. Use "Read the Arabic itself, with English line by line." |
| Invented ratings, testimonials or user counts | Nothing supports them |

## Open

- **Word colour on a real iPhone:** the owner offered no test devices, so this is unproven. The one-colour fallback below iOS 26.2 stays.
- **Emotion test:** skipped by the owner, so no learner has seen the page. Concept A is unproven until store taps per page view come in after launch.
- **Terms exception for the PDF:** the owner allowed it on 2026-11-01 and the site's `/terms` has it. The app's own Terms screen still forbids redistribution until its next release.
- **AI disclosure and sadaqah jariyah sentences:** approved with the draft list on 2026-11-01, as they stand.
