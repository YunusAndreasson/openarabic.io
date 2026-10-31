# App marketing research

Written 2026-10-31 for the openarabic.io replacement. The aim is more OpenArabic installs from people who can decode Arabic script but can't yet read books.

## How to read this

Labels: **[O]** observation, what I saw on a page or in code. **[E]** evidence, meaning official documentation or research not sold by a vendor; a company's study of its own product is called out. **[V]** vendor claim, not evidence. **[J]** my judgement.

Limits:

- The Chrome extension was not connected after 2 tries, so I used WebFetch, curl and headless Chromium at 1440x900 with iPhone 14 and Pixel 7 emulation. No real device was used, so I confirmed the Smart App Banner tag but never saw the banner.
- I judged motion from stills and watched no video, so "cinematic pacing" is a partial reading. I clicked no install or purchase control.
- "Screens" means page height divided by viewport height, and sticky scenes inflate it. "First real UI" is a position on the page, not a time in seconds.
- Third-party copy is paraphrased, with one short quote. Search Console was not consulted.

## 1. Teardown of app sites

Arc is excluded because arc.net is now a sunset notice. [O] Qamar360 and the current site are baselines. Quran.com is covered in section 4 because it is a reader, not a marketing page.

| Site | First screen | First real UI | Screens (desktop / phone) | Download on phone vs desktop | What stays | Steal / avoid |
|---|---|---|---|---|---|---|
| [Qamar360](https://qamar360.com) (baseline) | Sunnah kept by sun and moon, over a dusk street under a crescent, plus a line saying it sets no reminders | First screen on desktop; about 0.9 of a screen on phone | 19.7 / 21.2 | Pre-launch: plain text and no links, so this is untested | The moon filling an orbit | Steal one metaphor, the caption under the real screen, and cited sources. Avoid assuming its length converts: it has never had to hand off to a store |
| [Flighty](https://flighty.com) | The truth about your trip, with a hand holding a phone among live alert cards | First screen on desktop; first screen on phone, behind a cookie card | 15.8 / 26.3 | Same App Store link everywhere, tagged `ct=Our Website` with `pt`. iOS only. No QR found in the page; a Download tab with a QR-like icon was not opened | The alert about a parent landing early | Steal the app's output as human moments, and `ct` on every link. Avoid the press wall and 26 phone screens |
| [Things](https://culturedcode.com/things/) | Icon, name, a generic description and a video link | About 1.1 screens on phone | 9 / 16.7 | Store badges at about 3.5 screens, on first-party paths such as `/things/iphone/appstore/` that resolve to the store. No QR | The icon and the calm | Steal first-party redirect paths, so links change in one place. Avoid generic hero copy and a platform matrix |
| [Kino](https://shotwithkino.com) | "Have an iPhone? You're a filmmaker." over a dark kit layout with the app's screen | First screen | 12.9 / 13.5 | Badge on first screen via `/download`, which goes to the App Store for every browser I tried, including Android. No QR | That one line | Steal the two-beat identity reframe followed by proof. Avoid any Android dead end; OpenArabic has both stores |
| [Halide](https://halide.cam) | Logo, tilted iPad and iPhone with real UI, an all-caps claim, and a no-AI stance | First screen | 10.6 / 9.5 | Button at about 1.2 screens via `/download`. No QR | The stance against AI processing | Steal a stated refusal as the differentiator. Avoid all caps and tilted Apple hardware (see section 3) |
| [Linear Mobile](https://linear.app/mobile) | Grainy black and white photo of a real inbox on a held phone, with a short headline | First screen | 10.8 / 14.9 | Best handoff seen. Desktop: QR card plus both store tiles. iPhone: one App Store button. Android: one Play button. Smart App Banner tag present. No campaign tokens | The photo and the QR card | Steal the device-matched CTA and QR. Add the `ct` and referrer it leaves out |
| [Tarteel](https://www.tarteel.ai) | Full-bleed video of a reciter's face, a two-word rotating headline, one CTA | None seen in stills | 4.4 / 5.2 | `download.tarteel.ai` tagged per placement (`utm_medium=header`). iPhone goes to the App Store with `pt`. Desktop gets an open/get page. No banner tag, no QR | A face in study | Steal a person at study, one CTA, placement tags, brevity. Avoid selling Premium straight after the hero and hiding the product |
| [Readwise Reader](https://readwise.io/read) | A rotating noun in a line aimed at power readers, with sign-up CTA | First screen, under the CTA | 13.5 / 17.7 | No store links at all. Web sign-up comes first | The power-reader identity | Steal showing the UI at once, and web use before install. Avoid 16+ sections and jargon |
| [Duolingo](https://www.duolingo.com) | Characters and a fun-first claim, with a web CTA | Illustration only on first screens | 8.8 / 12.9 | Banner tag present. Store badges at 4 screens on desktop and 5.5 on phone. Desktop links directly, with a Play `referrer`. Phone goes through labelled Adjust links | The owl | Steal labelling each placement. Avoid the tone: wrong for this audience |
| [OpenArabic now](https://openarabic.io) | "Learn to Read Arabic Through Authentic Texts", feature list, badge, rating | About 0.9 of a screen on phone | 5.5 / 17 | iPhone shows only the App Store badge (Android layout not checked). `/download-app` redirects to the right store on iPhone and Android, with no tokens. Desktop has both badges and no QR | Little: it is three jobs at once | Phone frames rendered black in my capture, possibly a lazy-load artefact. Check on a real phone |

**Pattern. [J]** The most memorable pages (Kino, Tarteel, Qamar360, Linear) keep one idea and one thing to look at on the first screen. Length doesn't separate them: Tarteel is about 5 screens and Qamar360 about 20. I have no conversion data for any of these sites, so "strong" here means craft, not proven results.

## 2. Arabic learning competitors

| Product | Promise | Emotion sold [J] | Notes [O] |
|---|---|---|---|
| [Arabic Unlocked](https://arabicunlocked.com) | The easiest route to speaking and reading, plus unlocking the Quran | Ease, then relief that recited words finally make sense | Closest app rival. Trial, then £9.99 a month. [V] Claims 1,000,000+ learners and that a few hundred words make roughly 70% of recitation familiar |
| [Bayyinah](https://bayyinah.com) | Reach Allah's words directly, beyond translation | Connection, transformation, belonging | Courses and video. No store link in the home page HTML. Testimonials use devotional language |
| Arabic with Husna | Grammar for children, taught by a father to his daughter | Warmth, family | A [BayyinahTV series from 2011](https://muslimmatters.org/2013/11/03/muslimkidsmatter-interview-husna-arabic-husna-series/), per a 2013 interview. I found no site of its own and could not confirm it is still offered |
| [Quranic](https://getquranic.com) ([store](https://apps.apple.com/us/app/quranic-quran-arabic-learning/id1381145375)) | A real connection with the Quran; on the store, an app for Muslims learning Quranic Arabic | Connection, plus reassurance that Arabic need not be dull | Paid tiers from $4.99. Store shows 4.9 from 4.2K ratings. [V] Claims 80% of Quran words via stories; the site lists 1M+ downloads beside 15k+ global users, which sit oddly together |
| [Madinah Arabic](https://madinaharabic.com) | Mastery with expert teachers | Trust, supervised progress, parental pride | Tutoring. [V] A 95% success rate with no definition given |
| [Lingualism](https://www.lingualism.com) | Level up with ebooks and Anki decks | Competence | Books, MSA and Egyptian. No religious framing |
| [Drops](https://languagedrops.com) | Easy, friendly learning | Ease | Arabic appears only in a language list |
| [Mango](https://mangolanguages.com) | Speak sincerely, in 70+ languages | Confidence | Also sells to libraries and schools. Arabic is not featured |
| [LingQ](https://www.lingq.com) | Learn from content you enjoy | Immersion, escape from drills | Nearest method to OpenArabic, but secular and general. CTAs lead to sign-up, and I saw no visible store links on the landing page |

**Gap. [J]** Rivals sell ease, speaking, or connection to the Quran. I found nobody selling the step this audience is stuck on: you can sound out the script, and you can't yet read a book. Nobody leads with the classical authors themselves, in real passages. Free with no ads is also rare here, since the closest apps charge. It is a reason to trust, not the emotion. The feeling to own is the closeness of reading a scholar directly, and the quiet ache of reciting without understanding. That is my reading of the gap, not a tested finding. Arabic Unlocked's line on recited words is the nearest anyone comes.

## 3. Evidence on web-to-store conversion

**Overall.** I found no independent study that measures web-to-store conversion for a site like this. Baymard and NN/g searches returned nothing on app banners or web-to-app handoff. [O] The evidence below is about harm from interruption, plus platform rules.

**Interstitials**

- [E, Google on its own product] [Google+ case study](https://developers.google.com/search/blog/2015/07/google-case-study-on-app-download-interstitials): 9% of visits to a full-page interstitial pressed Get App, and 69% abandoned the page. Replacing it with a Smart App Banner in July 2014 raised 1-day mobile web actives by 17%, while iOS installs moved -2%. This is one product, a decade old, reported by a company that also runs Search. It is still the best public number.
- [E] [Google's 2016 announcement](https://developers.google.com/search/blog/2016/08/helping-users-easily-access-content-on): from January 10, 2017, pages whose content isn't easily accessible when arriving from mobile results may not rank as highly. Examples include popups over content, standalone interstitials, and a first screen that looks like an interstitial with the content inlined below it. Banners using a reasonable amount of space are not affected. **This matters for a cinematic hero on any page people land on from search.** [J]
- [E] [Current guidance](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials) (updated 2025-12-10) says this covers app install prompts, recommends small banners with no dimensions given, and names Safari's Smart App Banner. Its body states no penalty size, so nobody should quote one.
- [E] [NN/g, 2022](https://www.nngroup.com/articles/accidental-overlay-dismissal/): avoid mobile overlays where possible. Give any overlay a visible close button and make system Back dismiss it. This is about overlays generally, not app prompts.

**Smart App Banners**

- [E] [Apple's doc](https://developer.apple.com/documentation/webkit/promoting-apps-with-smart-app-banners.md): a meta tag with `app-id` and optional `app-argument`. It opens the app if installed and goes to the store if not. After install the banner can open the app with the user's context kept. Once closed it doesn't reappear, it doesn't show in frames, and it hides itself where the app is unavailable.
- [E] [Apple's analytics help](https://developer.apple.com/help/app-store-connect-analytics/acquisition/campaign-links/) says campaign and provider tokens can be added in Safari, but gives no syntax.
- [O] Only a [developer forum thread](https://developer.apple.com/forums/thread/5296) offers `affiliate-data=pt=...&ct=...`. It is community-sourced, and a 2023 poster reports the data didn't arrive. Treat banner attribution as unverified until tested.
- [V] [Branch's 10 stats](https://www.branch.io/resources/blog/10-stats-on-the-effectiveness-of-smart-banners/): 5.65x purchase rate and similar. One unnamed ecommerce company, 10 days, 2016, no sample size, and purchases rather than installs. Not usable.
- [V] [Adjust](https://www.adjust.com/blog/web-to-app-best-practices/): I could not open this page (HTTP 429). A search excerpt reports lift across funnel metrics with no figures, so it can't be checked.
- [V] [Airbridge](https://www.airbridge.io/library/web-to-app-conversion-whitepaper): gives no figures on the open page, and the whitepaper is gated.
- [O] **Our own tags are generic.** Every openarabic.io page I checked sets `app-argument=https://openarabic.io/download-app`, including word and article pages, so all page context is lost. There are no tokens. [Reverso Context](https://context.reverso.net/translation/arabic-english/%D9%83%D8%AA%D8%A7%D8%A8) is the good counter-example: it passes the exact query as a deep link.

**Android: Chrome, intents, referrer**

- [E] [Chrome intent URLs](https://developer.chrome.com/docs/android/intents) need a user gesture, and `S.browser_fallback_url` handles the case where the app is missing. They are only useful for opening an installed app. A plain [Play URL](https://developer.android.com/distribute/marketing-tools/linking-to-google-play) is enough for installs.
- [O] Google's guidance links to a Chrome native install banner. I could not confirm current behaviour, so don't plan on it.
- [E] [Install Referrer](https://developer.android.com/google/play/installreferrer) returns the referrer URL and click and install timestamps. [Details stay available for 90 days](https://developer.android.com/google/play/installreferrer/library); read them once, on first launch.
- [E] The referrer must be URL encoded and at most 512 characters ([stated on the Play Games page](https://developer.android.com/games/playgames/user-acquisition)).
- [E] [Play Console](https://support.google.com/googleplay/android-developer/answer/9859173?hl=en) reports `utm_source` and `utm_campaign` under ads and referrals. Thin values are rolled into Other, and no numeric threshold is given.

**Apple campaign links**

- [E] [Apple's manage-campaigns help](https://developer.apple.com/help/app-store-connect/view-app-analytics/manage-campaigns/): format `apps.apple.com/app/apple-store/id1594031029?pt=...&ct=...&mt=8`. `ct` is up to 30 characters; `pt` identifies the account and comes from generating a first link. A first-time download counts within 24 hours of the link, and the most recent link gets the credit. Metrics need at least 5 in the range, a campaign needs 5 first-time downloaders and appears after 24 hours or more, and small rows may be withheld or merged. One link works worldwide, since the App Store redirects to the local storefront.
- [E] [Apple's source definitions](https://developer.apple.com/help/app-store-connect/reference/app-analytics-filters-and-dimensions/): a Safari tap counts as web referrer, and in a redirect chain the last URL gets the credit. On iOS, a tap from another browser such as Chrome counts as that app under app referrers, so web referrer undercounts.

**QR on desktop**

- [E] [US Census working paper, 2024](https://www.census.gov/library/working-papers/2024/adrm/rsm2024-05.html): 20 respondents all scanned without problems, averaging 12.4 seconds. This was a survey task, and no one without QR experience could be recruited. It says nothing about app installs.
- No conversion evidence exists either way for desktop-to-app QR. [O] Linear is the only site above with a visible QR.

**Attribution without SKAdNetwork**

- [J] A site's own links don't need SKAdNetwork or AdAttributionKit, which I understand to be ad frameworks. Apple's page body wouldn't load, so that is background knowledge.
- iOS gives aggregate `ct` reporting only. Android gives per-install referrer.
- [E] [Apple forbids fingerprinting](https://developer.apple.com/app-store/user-privacy-and-data-use/), including via attribution SDKs, and may reject such apps.
- [V] [Adjust's web-to-app help](https://help.adjust.com/en/article/web-to-app) describes probabilistic modelling when identifiers are missing, and says nothing specific to iOS. [J] Given Apple's rule and the promises below, don't use that kind of matching here.

**House rules** ([AGENTS.md](/home/yunus/Work/marketer/AGENTS.md), [open-arabic.yaml](/home/yunus/Work/marketer/products/open-arabic.yaml))

- [O] The first-party contract joins on `install_id` and sends `Install Attribution` once per install on Android, with the referrer split into 200-character parts. Only people who consented to both analytics and ad measurement can be joined.
- [O] The product is `sensitiveCategory: religion`, `consentRequired: true`, `att: never`, and promises never to send Meta a name, email or what the person studies.
- [O] Marketing's config points at `/download-app`. Ad copy must never imply the viewer's religion.
- [O] **The app doesn't have this yet in the checkout I read.** A grep of `/home/yunus/Work/open-arabic` finds no `install_id`, `Install Attribution` or install referrer in its `.ts`, `.tsx` and `.json` files, excluding `node_modules`. `app.json` has no `associatedDomains` or `intentFilters`, and the Android manifest has no `autoVerify`. It has the custom scheme `open-arabic://`. So an `https://openarabic.io/word/...` link should not open the app today, even though `app/word-detail.tsx` and `app/article/` exist.

**Badge and device rules**

- [E] [Apple](https://developer.apple.com/app-store/marketing/guidelines/), badge: use Apple's artwork, unmodified and not animated, one per layout, first in any lineup, subordinate to the main message. Minimum 40 px high on screen, with clear space of a quarter of its height (a tenth in very tight layouts). Use the black badge whenever another store's badge appears, don't translate "App Store", and include Apple's credit lines wherever legal information appears.
- [E] Apple, devices: show Apple hardware alone, with other platforms only in copy or badges. Minimum 200 px on screen. Don't tilt, crop, animate, flip, or add reflections or shadows, and don't make 3D renders or simulations; generic device drawings must omit details unique to Apple. Screens must show the app as it runs, with fictional account data, never blank. [J] Halide's tilted hardware and any cinematic 3D phone sit badly with these rules.
- [E] [Google Play badge](https://partnermarketinghub.withgoogle.com/brands/google-play/google-play/lockups-icons-badges/): minimum 28 px high, clear space of a quarter of its height, solid or simple backgrounds. Don't alter colour, scale or elements. Use the localized badge, and the badge rather than a lockup to drive downloads.
- [E] [Android brand page](https://developer.android.com/distribute/marketing-tools/brand-guidelines): any use of the Android name needs the attribution line that Android is a trademark of Google LLC, with a trademark symbol at first use. It also says creatives referencing Android or Google trademarks must be reviewed, typically taking a week or more. Check whether a plain badge needs this, since the same page offers the badge for marketing materials.

## 4. Turning reference and reader traffic into installs

**What others do**

- [O] [Quran.com](https://quran.com/2/255): the verse fills the phone screen. No install prompt, no banner tag. Store links appear only at about 5.7 screens on a verse page. The home page has an apps row at 2.2 screens on desktop and 3.7 on phone. Reading always comes first.
- [O] [Duolingo's Arabic page](https://www.duolingo.com/course/ar/en/Learn-Arabic): pitches a short daily habit, with a web CTA first and store links at about 7 screens, plus a Smart App Banner tag.
- [O] Readwise: the [Reader page](https://readwise.io/read) starts with web sign-up. Its [Wisereads newsletter](https://blog.readwise.io/p/afdceb89-bba9-4872-9f08-4c0eb34bb69e/) has an open-in-Reader link and recommends the extension and mobile app in its FAQ. Value first, install later.
- [O] [SpanishDict](https://www.spanishdict.com/translate/casa): a sticky 86 px take-it-with-you bar on a tagged OneLink, beneath a consent wall naming 1750 partners. It is an example of what to avoid in this category. [J]
- [O] [Reverso Context](https://context.reverso.net/translation/arabic-english/%D9%83%D8%AA%D8%A7%D8%A8): a deep-linked banner plus an inline block offering more in the app. Its consent wall names 1062 partners.
- [O] [Jisho](https://jisho.org/word/%E6%9C%AC): a pure reference page with no store links, a clean contrast and not an acquisition model.
- I found no install rates for any of these, so none of this proves what works. It shows what careful sites choose.

**Our pages now**

- [O] A [word page](https://openarabic.io/word/aad-12314) gives the Arabic, the meaning, an example sentence from a classical text with a source link, and related words. "Get the app" sits at 2 screens, generic, in the footer area.
- [O] An [article page](https://openarabic.io/read/public-preaching-577) is 20.5 screens on phone. Its only store path is a header icon and one link at 18.4 screens.

**What suits a dictionary visitor [J]**

This is inference, not evidence. They came from search for one word. They want the meaning and the sound, then they leave. They haven't said they want to learn, and most won't, so:

1. Answer first, in full, with no gate on meaning, audio or example.
2. Make the offer about this word, once, straight after the example sentence, which is the page's real asset. For instance: keep this word, and the app brings it back in the texts you read. The web can't do that, so the offer is honest.
3. Offer the next step that stays on the web as well: the passage this word comes from. A reader in an article is a better prospect than someone in a lookup, and article ends are where to ask more plainly.
4. Pass context only where it survives. Smart App Banner keeps it through install on iOS, per Apple. A store link on iOS loses it. On Android, the referrer could carry it on first launch, if the app reads it.

## 5. Emotion and motivation research

**Plainly: I found no solid research on emotion in language-learning landing pages, and none on religious motivation in app marketing.** What exists is adjacent.

- [E] [Al-Hoorie 2018](https://pressto.amu.edu.pl/index.php/ssllt/article/view/12295), meta-analysis of 32 reports and 32,078 learners. The ideal L2 self correlates with intended effort at r = .61 but with objective achievement only at .20, with substantial heterogeneity. Correlational, and about learners rather than pages. [J] A vision of your future self may move intention more than results, so the site can use it to start people, and the app has to do the rest.
- [E] [Hajar 2025](https://research.nu.edu.kz/ru/publications/the-spiritual-vision-for-learning-arabic-and-beyond-unpacking-und-2/), qualitative, 10 Muslim undergraduates in Kazakhstan. Religious motivation was a major driver of learning Arabic. Two participants withdrew over schooling gaps and Arabic-only teaching. Small, and not generalizable.
- [E, index snippet only] [Husseinali 2012](https://doaj.org/article/ee5b1f0ce2ce4f8d82271aec552bc393): non-Arab Muslim heritage learners leaned towards Islam and Islamic texts, Arab heritage learners towards communication. The page blocked my fetch, so I saw only an excerpt. [J] This fits your audience, but read the paper before relying on it.
- [E] [Piazza et al. 2018](https://cris.fau.de/publications/200912317/), online survey of 391 people on three ecommerce landing pages. Emotions from a page affected stated intentions. Intentions, not installs, and not language learning.
- [E, via press only] [Lindgaard et al. 2006, reported by Nature News](https://www.nature.com/news/2006/060109/full/news060109-13.html): visual appeal was judged within 50 ms, in line with longer viewing. That measures appeal, not conversion. I did not read the paper.

So the emotional direction here is a craft judgement, supported loosely by motivation research. It has to be tested on our own traffic.

## So we will...

1. **Say one thing.** The home page is about moving from decoding script to reading the scholars' own books. It says what the texts are, not who the reader is, which also keeps us clear of the ad-copy rule. Candidate lines to test, all unproven: "You can sound out the letters. Now read the books." and "Read the scholars in their own words."
2. **Keep the cinematic treatment to the home page and desktop `/download-app`.** Word, article and book pages open on their content immediately, because a hero there looks like the interstitial layout Google warns about.
3. **Show a real screen on the first screen at both widths.** Use a classical passage with one word tapped, captioned as Qamar360 does. Use a generic frame or none, with no tilt, no 3D and no iPhone beside an Android phone.
4. **Copy Linear's handoff and add measurement.** Phones get the one matching badge. Desktop gets a QR and both badges, black App Store badge first, with Apple's and Google's size, spacing and legal rules met. Check the Android brand-review question before launch.
5. **Keep `/download-app` as the single store route, because marketing depends on it, and add tokens to it.** iOS gets `ct` and `pt`; Android gets a URL-encoded `referrer` with `utm_source` and `utm_campaign`.
6. **Use surface-level tokens only:** `web-home`, `web-word`, `web-read`, `web-book`, `web-qr`. Never a word or article slug: Apple's threshold of 5 would hide them anyway, the referrer has to stay short, and what someone studies must not travel with it.
7. **Set the Smart App Banner on every page, with a page-specific `app-argument`.** Test `affiliate-data` on a real iPhone and in App Store Connect before trusting banner numbers. Inline links stay the measured route.
8. **Never show a popup, interstitial or sticky install bar on reading pages.** Each page gets one contextual offer: after the example sentence on a word page, at the end of the text on an article, and beside the download on a book.
9. **Make the word-page offer about that word,** and always give the web route to the source passage too.
10. **Ask the app for three things, and don't promise them on the site until they ship:** universal links and app links for `/word/` and `/read/`, Install Referrer reading plus the `install_id` contract, and handling of `app-argument`.
11. **Measure with what the platforms give:** App Store Connect campaigns and web referrer, knowing other iOS browsers land in app referrers, plus Play Console UTM and the Android referrer join for those who consented. No fingerprinting or probabilistic matching. Analytics on these religious-content pages waits for consent.
12. **Report results as directional.** No vendor benchmark goes into a target. Before building dictionary features, check Search Console for which words and queries actually bring people.
