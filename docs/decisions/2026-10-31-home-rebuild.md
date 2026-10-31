# Home page rebuild, 2026-10-31

The owner called the home page a catastrophe and set qamar360.com as the bar. This builds on `2026-10-31-design-reset.md`.

| Decision | Detail |
|---|---|
| Budgets | The owner: "this is a promo page so having a 1.5kb cap is rediciouslus". The home page gets 60 KB gzip of JS and 24 KB gzip of CSS, in `scripts/ship/budgets.mjs`. Every other page keeps its limits and the 1.5 KB cap. LCP, CLS, phone first load and font limits stay |
| Script | Plain TypeScript in `src/scripts/home.ts`, because nothing on the page needs a framework. Without script or with reduced motion the page is a complete stack |
| Motion | Pinned stages played by scrolling, things that arrive, and photos that develop, as on qamar360. This replaces the `DESIGN.md` ban on them for the home page. Content pages stay as they were |
| Type | Inter replaces Alegreya Sans, because Inter is the app's face (`open-arabic/constants/fonts.ts`) and qamar360's. Variable, 250 to 600 |
| App screens | The iPhone set from `open-arabic-marketing/store-listing/captures/ios`, dated 2026-08-28. Real, unedited screens, from before app 1448.5.9, so recapture before cutover |
| Concept | One real line goes from unreadable to read, with the app played in between |
| Adding words | The owner asked for this to be on the page: you add words you don't know to the practice list and practice them with spaced repetition. The Read stage ends on the sheet's "Add to practice" button and the Remember stage follows at once. A tap only opens the card, so the page never says a tap adds a word |
| Scholars | The owner: "it is very important that we mention the scholars so user understand what they will get". Their names are on the first screen and they get the section straight after it, with each one's texts and works |
| Speaking, spaced repetition, memorisation | The owner named these as missing, so the Remember stage follows Read at once. The owner called the first one reading the word out loud. The app grades the spoken English meaning and never assesses Arabic speech (`open-arabic/utils/voiceMatching.ts`, `PRODUCT.md` Banned), so the page says what it does |
| One emulator screen | The iPhone set's practice chart is empty on its test account, so the memory horizon stop uses `docs/specimens/app-captures/05-memory-horizon-breakdown.png` from the Android emulator, under the "example account" caption, in the same frame. Its status bar differs. Recapture before cutover |
| No phone in the hero | The owner: "maybe not show the mobile shoot on top since it cver the hero? we show them below regardless". The photo holds the first screen and the app starts in the stages |
| No library counts | The owner: "we dont have to mejiotn the specific nnumber like 22 etc". The ledger's two library sentences lose their numbers and go on the draft list, and the count date goes with them. "Six scholars" stays because they're named right below. Feature facts such as 90% and 10, 20 or 30 words a day stay |
| Three chapters | The owner: "we could actualt spearate into read/listen/remember". Adding a word now opens Remember. The second Listen stop uses the emulator's `03-audio-playing.png`, because the iPhone set has no text playing |
