# Owner review, 2026-10-31

The owner's answers from the review of open questions, in the order they were settled.

## Round 1: the live system

| Question | Decision | Status |
|---|---|---|
| Public write access to content tables | Fix now. The migration is shown to the owner before it is applied | Being prepared |
| Admin features on the new site | **None. The new site only promotes the app.** Admin stays out of this repo | Decided |
| Admin gate on the old Worker has no role check | Not answered directly; raised again with the database fix | Open |
| False claims on openarabic.io | Fix the live site now, using the allowed wording in `docs/research/claims-audit.md`. Deploy after review | Being prepared |
| GA4 without consent | Fix it so GA4 can run, which means a working consent step on the site. GA4 is not being turned off | Being prepared |
| Meta in the app, app privacy copy, App Store label | Not covered by the GA4 answer | Open |

## Round 2: what we can truthfully say

| Question | Decision | Notes |
|---|---|---|
| AI audio and machine translation | Disclose both plainly | Wording must match what the pipeline really does |
| App Store rating | Show it, without the count | Owner's call, against the recommendation. Fetched from the store, never hard-coded. No `aggregateRating` in JSON-LD, which requires a count |
| Who it is for | State the requirement: "If you can sound out Arabic script, you can start reading classical texts." | Replaces "even as a beginner" |
| False claims to make true in the app | None selected | The site claims none of them. Concept A's ending must read as a moment on the page, not an app feature |
| Open source | Never imply it | Only "built with open-source libraries" |
| Free, no ads, no subscription | State it as a fact of today | No "forever" or "always" |
| Authors and texts with no content | Show only what has texts | Lists come from published articles. Empty author pages are noindexed or redirected, and the 3 unpublished texts leave the sitemap |
| Thin first shelf (48 of 239 easier texts) | Curate a clear starting path from those 48 | Honest that the rest are harder |

## Round 3: the experience

| Question | Decision | Notes |
|---|---|---|
| Scrolling | Native scroll, at most one pin on a laptop, none on phones | Follows `docs/research/lineage.md` |
| Imagery | Generated with Codex as on qamar360: consistent scenes and app promo shots | **Overrides the "no generated images" rule in `docs/research/lineage.md`.** App UI in a promo shot must be a real capture, composited in |
| Theme | Dark everywhere | Owner's call, against the recommendation of letting long reading follow the device. Reading comfort for Arabic in daylight becomes a test item |
| Word colour | Colour within words where supported; one colour on iOS below 26.2 | Needs a real iPhone test |

Generated imagery contains no lettering. Arabic text and app screens are always real, composited in afterwards.

## Round 4: the founder's story

Asked before the 2026-10-31 crash and answered afterwards. Each answer was picked from a list unless quoted, so only what is written here is established.

| Question | Decision | Notes |
|---|---|---|
| Why it was built | The owner's own struggle | Background only: the owner keeps their story off the site |
| Who it is for | Someone who finished a course but can't read books | Matches the FAQ's starting point |
| The moment to feel | Reading a classical line without the English | The owner has had this moment and keeps it off the site. The page gives the moment to the visitor |
| iPhone testing | "i already kno the app works on all phones" | No test devices offered. That answers for the app, not for word colour on the web, which stays unproven on a real iPhone. The one-colour fallback below iOS 26.2 stays in the design |
| Why it is free | Sadaqah jariyah; the site may say so | Still stated as a fact of today, per Round 2: no "forever" or "always" |
| Motifs | The Hijri version number is deliberate; اقْرَأْ is not a motif | Removes اقْرَأْ from concept B |
| Religious content sign-off | "all input is valid so no need for sign off" | **Replaces the named reviewer in plan step 3 and success criterion 3.** The source, attribution and machine-translation disclosure rules still apply |
| Reaching 5 learners | "check with me" | Stop and ask the owner at step 7 |
| Public name | Yunus Andréasson | Both stores show "Jonas Andreasson"; changing them is the owner's task |
| Product name | OpenArabic: Read the Classics | Differs from the live App Store and Play titles and from `app.json` |
| Al-Fawaid PDF | Free to share | The Terms forbid redistribution, so they need an exception for the PDF, in the app repo |

## Later: the old site

The owner: "main focus is the new site, we will abandon the old".

- **Live-site fix:** not deployed and not worked on further. `~/Work/open-arabic-site-fix` stays as a reference for the consent, rating and catalogue logic and the corrected copy. Until cutover, openarabic.io keeps its false claims and runs GA4 without consent.
- **Old Worker:** `openarabic-web` keeps serving the site until cutover and stays available for rollback. The hard rules in `AGENTS.md` still apply.
- **Not abandoned:** the database. The app reads it too, so the content write migration still matters, and with no admin to keep, its main cost goes away.
- **Still needed from the old site:** URL parity and redirects, because search traffic follows those URLs. Publishing and reviews still need a route after cutover, as in Round 6.

## Later: the emotion test

The owner chose to skip the test entirely, after seeing the recommendation against it. No learner has seen concept A, so the pick and the design remain a judgement. Concept A's main risk, a pay-off too quiet to notice, stays **unproven**. Store taps per visit after launch is the first real evidence. This overrides the plan's fallback of making the test the first task of the build.

## Round 5: measurement and privacy

| Question | Decision | Notes |
|---|---|---|
| The one metric | Store taps per visit, by page type | First-party and cookieless, so it counts everyone. Store console installs are a directional check |
| GA4 consent on the new site | Footer link only; GA4 off until a visitor opts in | Against the recommendation. Few will opt in, so GA4 data will be thin and unrepresentative. Don't use it to judge the site |
| Meta, app privacy copy, App Store label | Finish the consent branch as its own task | Device test, app release, copy and labels together. The owner submits label changes |
| Light logo colour | Move `#568066` to `#507A60` in the app repo | Separate small task |

## Round 6: housekeeping

| Question | Decision | Notes |
|---|---|---|
| Where the old admin lives | Deferred: "for now only focus on the app promo, we fix the admin features later" | **Must be settled before cutover.** The new site takes the apex domain, so publishing and reviews need a working route to the old admin by then |
| Personal setup | Add `.astro` to the Zen rule (done); compare the Cloudflare skills with upstream; review bismillah's Astro skills | Comparison and review are read-only reports |
| Commits | One commit per finished plan step, nothing pushed | Work is on the `foundation` branch |
