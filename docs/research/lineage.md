# Lineage: what they say, and what we can check

Research for the OpenArabic site, read 2026-10-31. The page's job: someone who can decode Arabic but can't yet read books understands the offer, feels something, and reaches a store.

- **Tags.** `[T]` a tool can check it; `[P]` a person must. Pass marks are ours unless a source is linked: Nielsen never said "4 of 5". **Test viewports** (browser bars up, from Qamar's measured list): phones 390×664 and 375×553, laptop 1280×640.
- **Quotes** come only from pages read in this pass. Not read directly: *The Design of Everyday Things* (quoted through [Brikman's excerpts](https://www.ybrikman.com/blog/2015/01/26/the-design-of-everyday-things/)) and *Emotional Design* (Norman's [TED talk](https://www.ted.com/talks/don_norman_3_ways_good_design_makes_you_happy/transcript) and [2002 essay](https://jnd.org/emotion-design-attractive-things-work-better/) instead). The TIME interview was read only through a page extract.

## 1. Jakob Nielsen and NN/g

**What they say**
- [Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/): keep users informed "through appropriate feedback within a reasonable amount of time"; "speak the users' language"; a "clearly marked 'emergency exit'"; "Every extra unit of information in an interface competes with the relevant units of information".
- [Response times](https://www.nngroup.com/articles/response-times-3-important-limits/): 0.1 s feels instantaneous, 1.0 s keeps the "flow of thought", 10 s is the limit for attention. These are system responses, not a licence for decorative animation.
- [Testing](https://www.nngroup.com/articles/how-many-test-users/): "test 5 users in a qualitative usability study"; [spend 15 as "3 studies with 5 users each"](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/). Limits: "only holds for comparable users"; statistics need "at least 20 users". [Faulkner](https://pubmed.ncbi.nlm.nih.gov/14587545/) found single sets of five ranged from 99% down to 55% of problems. Five people find usability problems. They do not measure conversion or feeling.
- [Attention](https://www.nngroup.com/articles/scrolling-and-attention/): 57% of viewing time above the fold, 74% in two screenfuls, and people "rarely go beyond the third screenful" (2018, 120 people, 1920×1080, so not phone data). "Keep major CTAs above the fold." [Fold](https://www.nngroup.com/articles/page-fold-manifesto/): "Users scroll when there is reason to"; sparse tops create "false floors"; "Designs shouldn't need an arrow to tell users to scroll".
- [Illusion of completeness](https://www.nngroup.com/articles/illusion-of-completeness/): "Avoid full-screen hero content"; "vast white spaces" read as the end. [Mobile](https://www.nngroup.com/articles/mobile-usability-update/): they scroll "only if they are enticed to".
- [First 10 seconds](https://www.nngroup.com/articles/how-long-do-users-stay-on-web-pages/): "communicate your value proposition within 10 seconds" (2011, desktop plug-in data). [Installing](https://www.nngroup.com/articles/mobile-native-apps/): "They need to be really motivated to justify the interaction cost."

**What NN/g has criticised that we might do**
- [Scrolljacking](https://www.nngroup.com/articles/scrolljacking-101/) (2023): "leads to more user pain than benefits". It concedes storytelling as a reason, then says: mix in normal scrolling, don't change direction, keep important content out, "Avoid Scrolljacking on Mobile", use it only below the fold. Asks: "What meaning is lost when the scrolljack is removed?"
- [Scroll fading](https://www.nngroup.com/articles/scroll-fading-101/) (2023): over 500 ms reads as too slow; try "rates between 100–400ms"; fade once; "Avoid Scroll Fading on Mobile". [Scroll-triggered text](https://www.nngroup.com/articles/scroll-animations/) (2017): use on "secondary, supporting content"; leisure browsers may enjoy it, task-focused users don't. [Duration](https://www.nngroup.com/articles/animation-duration/): 100–500 ms. Interstitials: ["almost always bad for usability"](https://www.nngroup.com/articles/disruptive-workflow-design/); app ones were [already fading by 2018](https://www.nngroup.com/articles/state-mobile-ux/state-of-mobile-ux-2018/).
- **Not found:** an NN/g study of pinned scroll stories by name, or of Smart App Banners. Treating a pin as a scrolljack is my inference: its speed is native, but it produces what a participant described, "a full swipe, and it moved nowhere". Qamar's stages pin for 440vh and 560vh (`site.css`) with words inside. That is what this warning describes, though it ships under a plan that forbids scroll-jacking.

**Rules**
- **N1** `[T]` With no scrolling, at all three viewports, the first screen shows what it is, who it's for, that it's free with no ads, and a working store link: assert their rects are inside the viewport at first paint. `[P]` After 10 seconds on that screen only, at least 4 of 5 recruits say what it is, who it's for and what it costs.
- **N2** `[T]` Offer words and store links have no entrance animation or delay and need no JavaScript. [LCP ≤ 2.5 s](https://web.dev/articles/lcp), [INP ≤ 200 ms](https://web.dev/articles/inp).
- **N3** `[T]` Native scroll: a 500 px wheel moves `scrollY` 500 px. No `preventDefault` on wheel or touch, no mandatory scroll-snap, no sideways scroll driven by vertical input. Scrollbars are never hidden, because they are [Norman's signifier](https://jnd.org/signifiers-not-affordances/) of what remains.
- **N4** `[T]` No pins on phones: sampling every 100 px, no content block holds its viewport position for more than one screen of scrolling. Laptop: at most one pin, below the fold, changing on every wheel step, holding nothing stated only there.
- **N5** `[T]` Body text never waits for scroll on phones. Any scroll fade elsewhere is ≤ 400 ms, once, on secondary content, one element type at a time. Motion stops under `prefers-reduced-motion`.
- **N6** `[T]` The next section shows at least 48 px above the first fold. At every 100 px step, no blank vertical gap exceeds 40% of the viewport.
- **N7** `[T]` A store link is one tap from any scroll position: a sticky bar on phones once the first badges leave, gone at the close. No modal, no interstitial, no timer. Apple's [Smart App Banner](https://developer.apple.com/documentation/webkit/promoting-apps-with-smart-app-banners) is allowed only if N1 still passes with it showing.
- **N8** `[T]` At most 12 screens at 390×844, a judgement from the third-screenful finding. `[P]` The first three screens stand alone as the pitch.
- **N9** `[P]` Three rounds of five, recruited only from people who decode but can't read books. Score what they do, because [looks mask problems](https://www.nngroup.com/articles/aesthetic-usability-effect/). Rates come from analytics, never from a round.

## 2. Don Norman

**What he says**
- [Signifiers](https://jnd.org/signifiers-not-affordances/): "People need some way of understanding the product or service, some sign of what it is for, what is happening, and what the alternative actions are." "Forget affordances". A bookmark "tells the reader how much of the story remains"; the browser's scrollbar does this too.
- [The book, as excerpted](https://www.ybrikman.com/blog/2015/01/26/the-design-of-everyday-things/): "Is it possible to even figure out what actions are possible"; "full and continuous information about the results of actions"; "A conceptual model is an explanation, usually highly simplified, of how something works."; controls and actions follow good mapping.
- [Affect, 2002](https://jnd.org/emotion-design-attractive-things-work-better/): negative affect narrows thought, positive affect widens it and raises tolerance of "minor difficulties". "when we feel good, we overlook design faults". "let us not be usability bigots". Stress demands stricter design. My inference: "I finished a course but can't read books" is a discouraged state, so the first screen gets the strict treatment, and relaxed tolerance is only earned later.
- [Three levels, his own words](https://www.ted.com/talks/don_norman_3_ways_good_design_makes_you_happy/transcript): visceral includes "the choice of type fonts"; behavioural is "where most of our stuff gets done"; reflective is "that little voice in your head", and of a Hummer, "It's about their image, not about the car." NN/g on reflective: [a person's "sense of self, their personal values, and their aspirations"](https://www.nngroup.com/articles/pillars-user-delight/); delight built on "UI embellishments" alone won't last.

**Rules**
- **D1** `[P]` The page holds one live Arabic line. Without instruction, at least 4 of 5 tap a word within 10 s of seeing it (signifier).
- **D2** `[T]` A tap starts a visible response within 100 ms, and the target is at least 44 px (feedback). Without JavaScript the gloss is readable as text.
- **D3** `[T]` The gloss opens beside its word. Arabic has `lang="ar" dir="rtl"`. Grammar colours match the app's tokens and mean the same; colour is used for grammar and nothing else on Arabic (mapping).
- **D4** `[P]` Afterwards, at least 4 of 5 say the loop unprompted: a real text, tap a word, hear it, review it later. And that it's a phone app (conceptual model).
- **D5** `[P]` Visceral: 5 of 5 read the Arabic comfortably on a phone at the size shown. `[T]` Arabic font preloaded, CLS ≤ 0.1, text contrast ≥ 4.5:1.
- **D6** `[P]` Reflective: asked who it's for, at least 4 of 5 answer in terms of someone like them. The page names the gap in their words and never shames them or calls them a beginner.

## 3. Dieter Rams ([Vitsœ](https://www.vitsoe.com/gb/about/good-design))

**What he says, as rules for this site.** One note first: principle 2 counts "functional" and also "psychological and aesthetic" needs as use, and principle 3 calls aesthetic quality "integral to its usefulness". Feeling is therefore a job an element may do, as long as it's named.
- **R1** (innovative, "can never be an end in itself") `[P]` A technique stays only if we can name what is lost without it. WebGL, video and scroll effects start out.
- **R2** (useful) `[P]` An element inventory gives every element one sentence on what it does for the visitor, feeling included. No sentence, no element.
- **R3** (aesthetic, "only well-executed objects can be beautiful") `[T]` Screenshots at all viewports show no clipped text, orphaned word or overlap.
- **R4** (understandable, "At best, it is self-explanatory") `[T]` With CSS off, the heading outline reads as the argument, in order.
- **R5** (unobtrusive, "neutral and restrained") `[P]` The Arabic and the app are the loudest things in any frame. One accent, no decorative loops.
- **R6** (honest, "promises that cannot be kept") `[P]` A claims ledger ties each claim to proof. No invented ratings, counters, testimonials, deadlines or promises of fluency by a date. Screens are captured from a shipped build, with the version recorded.
- **R7** (long-lasting, "avoids being fashionable") `[P]` No effect we could date to this year; review after six months.
- **R8** (thorough, "Nothing must be arbitrary") `[T]` Hover, focus, active, no-JS, reduced-motion and 200% zoom all pass. Automated accessibility scan: 0 serious issues.
- **R9** (environmentally friendly, "conserves resources") `[T]` Phone first load ≤ 1 MB. No autoplay video, no third-party trackers, no cookie banner because nothing needs one.
- **R10** (as little as possible, "Less, but better") `[T]` One action. No carousel, newsletter, pricing table, feature grid, blog or sign-up. `[P]` Deletion test: remove a section; if the next round still passes on D4, D6 and C8, it stays out.

## 4. Christopher Nolan and his collaborators

**What he said**
- **Simple front:** ["With every project, I've simplified the structure at the front-end so that the audience can connect"](https://johnaugust.com/2024/scriptnotes-episode-622-the-one-with-christopher-nolan-transcript); otherwise "they wait for the movie to start". "I can only start writing when I have the structure in place." On Dunkirk: ["It's not meant to be a puzzle. It's meant to be an experience."](https://time.com/4864049/dunkirk-christopher-nolan-interview/)
- **Tell once:** ["If you tell the audience something three times they won't understand it, but if you tell them only once, they will."](https://www.dga.org/craft/dgaq/issues/1202-spring-2012/dga-interview-christopher-nolan) "cutting for time is, for me, cutting for clarity". **Juxtaposition and rhyme:** ["we can take Image A, Image B, make Thought C"](https://johnaugust.com/2024/scriptnotes-episode-622-the-one-with-christopher-nolan-transcript); "poetic echoes", "rhyming relationships".
- **Real things:** with no physical elements ["it's going to feel like animation"](https://www.dga.org/craft/dgaq/issues/1202-spring-2012/dga-interview-christopher-nolan). He rejects trying "to impress the audience with the amount of money spent". A real plane is ["a lot more exciting than an animated representation"](https://historynet.com/nolan-dunkirk/).
- **Format:** IMAX "has so much power that you don't need to cut in the same way", but Inception went handheld: ["it's different depending on what film you want to do."](https://www.dga.org/craft/dgaq/issues/1202-spring-2012/dga-interview-christopher-nolan) Also "it's all about point of view". **Audience:** ["I am the audience."](https://www.timeout.com/film/christopher-nolan-interview-another-superhero-movie-unlikely-but-never-say-never) (the "faith in audiences" framing was the interviewer's). Audiences have ["a very sophisticated mechanism for constructing the reality of a film"](https://johnaugust.com/2024/scriptnotes-episode-622-the-one-with-christopher-nolan-transcript); invalidate something and "your brain discounts it".
- **Time:** ["I wanted to experiment with a new rhythm"](https://www.voanews.com/a/tick-tock-christopher-nolan-rhythm-dunkirk/3944598.html); time is a "tool". But Dunkirk's Shepard structure was for an ["incredibly tense experience"](https://johnaugust.com/2024/scriptnotes-episode-622-the-one-with-christopher-nolan-transcript) with "no relief", "which is why the film had to be short". And Interstellar: ["You actually needed to let things breathe."](https://collider.com/christopher-nolan-oppenheimer-interview/)
- **Cold viewing:** weekly, ["inviting one or two people in who don't know anything about the script"](https://collider.com/christopher-nolan-oppenheimer-interview/). This is the most directly transferable thing he says.

**What his collaborators said**
- **van Hoytema:** ["the answer is simplification. Find the good places to shoot. Play your scenes smartly and use the natural light."](https://britishcinematographer.co.uk/hoyte-van-hoytema-asc-nsc-fsf-oppenheimer/) The worst thing is [to panic and "tweak and doctor it to make it palatable"](https://www.screendaily.com/features/oppenheimer-cinematographer-breaks-down-four-key-scenes-limitations-become-advantages/5190470.article).
- **Lee Smith:** ["You drop into the action from the first frame, no backstory."](https://www.provideocoalition.com/art-cut-oscar-nominated-editor-lee-smith-ace-dunkirk/) "the first assembly was literally silent". On the film's release: "if you put it in the wrong place it felt forced".
- **Zimmer:** let the audience ["come to their own autonomous emotion"](https://deadline.com/2018/02/dunkirk-hans-zimmer-oscars-origina-score-interview-1202280792/); "nothing would distract you from the experience". And on the ticking: "We'll just put all our cards on the table, right away."

**What others interpret, not his words.** I did not find Nolan endorsing these in what I read: "a single great reveal", "ticking clock", "seductive philosophy" (`film-director.md`); crushed-blacks rules, people small in frame, silence as his method (Qamar). The evidence above cuts against silence and a held-back opening: Zimmer scored Dunkirk ["from start to end"](https://deadline.com/2018/02/dunkirk-hans-zimmer-oscars-origina-score-interview-1202280792/), and it opens with no backstory. These can remain our choices, but not as Nolan's.

**Rules**
- **C1** `[P]` A beat sheet written first-to-last in scroll order comes before any layout, and each beat changes what the visitor believes. Nothing on the first screen has to be learned; new devices come after the visitor has found their feet.
- **C2** `[T]` Each claim appears once. Only store links and the opening line's return (C4) may recur.
- **C3** `[T]` A provenance list covers every image, text and sound: captured from the app build, its corpus, or photographed. No stock, no generated images, no invented data in a phone frame. The tap demo runs on real app data: the page's "real plane".
- **C4** `[P]` One unexplained pair: the same line unreadable, then read. At least 3 of 5 say what changed with no caption. The opening line returns at the close.
- **C5** `[P]` Point of view: Arabic at reading size as the learner meets it. Copy says "you", never "our learners" or "users".
- **C6** `[P]` One release, placed on purpose after the demo. If cold viewers call it forced, it moves or goes. Looking and reading alternate.
- **C7** `[T]` The page works fully muted. No autoplay, sound starts only on a tap. Voices are male, with no instruments, per `film-director.md` ("Silence is better than a bad sound"). People are modestly dressed, women in hijab or niqab, or there are no people.
- **C8** `[P]` Cold viewing every week the page changes: one or two new people, in daylight on their own phone, unprompted. A day later, at least 3 of 5 across a round can describe one thing they saw, and say they want to try it.
- **C9** `[T]` No adjectives telling the feeling: a blocklist with "beautiful", "journey", "unlock" and the like. `[P]` Photographs in natural light with no added glow.
- **Excluded here:** moral outrage, injustice, antagonist, ticking clock, escalation, trailer-grade hook. A relentless page would misdescribe a calm app, which Rams would also reject as dishonest.

## 5. Improving the in-house translations

- **Qamar, keep:** one idea per screen and about 40 words; four spacing levels; testing at real browser sizes; sticky bar after the badges; `/get`; no parallax; one motion vocabulary; once-only reveals.
- **Qamar, change:** "Long pauses between sections" conflicts with false floors (N6). Paces of 1.2–2.4 s and scroll fades on phones conflict with N5. First app UI by the fifth phone screen is too late; here it's on the first (D1). The 20 screens become 12. "In a dark room" can't be a test condition. The light and darkness table is attributed to Nolan, but only natural light has support, and from van Hoytema. Its ban on scroll-jacking sits beside about 8 screens of pinned stages, so N4 tests behaviour rather than the word.
- **islam.se and open-arabic:** keep "a page correct everywhere and memorable nowhere" as the failure to avoid, "no movement taller than a screen", and "Grammar colour carries meaning and nothing else" (D3), with the 44 px target and 4.5:1 ink line. islam.se's metric (time reading) isn't ours: ours is store taps per visit. Neither tie-break has anyone speaking for feeling or evidence.
- **film-director:** keep sound and modesty, "Silence is better", "assume the audience is intelligent" and "first 5 seconds". Drop the blockbuster bar, per the brief.

## 6. Conflicts and how the tie-break resolves them

| Conflict | Evidence | Resolution |
|---|---|---|
| Withheld reveal vs quick understanding | NN/g wants the offer in 10 s. Nolan himself simplifies the front, Smith has "no backstory" | Dissolves. **Tell the offer at once; hold back how it feels.** The reveal is the visitor's own tap, not the facts (N1, D1, C4) |
| Cinematic full-screen opening vs false floor | "Avoid full-screen hero content" | Nielsen veto: picture may fill the frame less the 48 px peek (N6) |
| "Let things breathe" vs blank space reading as the end | Nolan vs illusion of completeness | Breath comes from change of scale and from a pause in content, never an empty viewport (N6, C6) |
| Slow light vs 100–400 ms | NN/g is about scroll-triggered content | Text: Nielsen. One first-load photo may develop behind already-legible words, ≤ 1.2 s: our judgement, testable, delays nothing (N2) |
| Pinned story vs scrolljack warning | "Avoid Scrolljacking on Mobile" | Nielsen on phones. Tap replaces pin: same disclosure, the visitor in control (N4, D2) |
| Rams's neutrality vs an emotional page or a wordless beat | Principle 5 vs principles 2 and 3 | Rams judges each element, but a named feeling counts as an answer (R2). Unobtrusive applies to chrome, not the Arabic. Disputes go to the deletion test on people (R10, C8) |
| Early badge vs "really motivated" | Both are NN/g | Both: badge at top for the ready, argument below for the rest, badge at close (N1, N7) |
| Sound as a main instrument vs user control | Zimmer vs heuristic 3 | Tap only, male voice, default silence (C7). We lose this tool (section 8) |

**A visitor who never scrolls** gets N1 and N2: what, who, free and no ads, a store link, a real Arabic line to tap. Tested by N1 at all three viewports, with no JavaScript.

## 7. Is the tie-break right?

Rams decides what stays, Norman and Nolan decide how it's found and felt, Nielsen can veto. Mostly yes, and the withheld-reveal conflict is smaller than it looks. The evidence asks for four amendments:
1. **A veto needs an observed failure or a crossed threshold,** not a heuristic opinion. Norman warns against "usability bigots", and NN/g itself separates browsers from task-focused users. Core tasks (understand the offer, reach a store) are absolute; minor friction on a calm page gets weighed.
2. **Rams's "what stays" includes feeling** (R2). Read narrowly, it would remove the reason for the page.
3. **Someone must certify feeling.** A page can pass all three and move no one: islam.se's "correct everywhere and memorable nowhere". And five-user tests can't see it. C8 is a required gate, and it can hold back a release but can't overrule a veto.
4. **Label defaults.** NN/g's data is often desktop, assigned tasks and old (1920×1080 in 2018, plug-in data in 2011). N1–N3 and N7 are hard. N4–N6 and N8 are defaults that a test on our own audience may overturn, with evidence written down.

## 8. Honest limits: what cinema can't transfer

- **Time belongs to the visitor.** A film sets the duration of a shot. A page can't hold a pause, time a cut or guarantee the order. Rhythm here is only a spatial suggestion. Cross-cutting has no honest page form, since a page is one continuous take.
- **Nobody is captive.** Cinema has a paid seat and a dark room; we have 10 seconds, daylight and notifications. A second visit has no surprise. "The big canvas" doesn't exist at 390 px: scale can only be relative, as with type against margin.
- **Sound, a main tool for tension in these films,** is mostly unavailable: phones are muted and we won't autoplay. The score that drives Dunkirk has no equivalent here.
- **The reveal can be bypassed.** Fast scrolling, anchors, screen readers and search snippets all skip it, so everything must make sense in any order.
- **This is analogy, not evidence.** Nolan speaks about films, often while promoting them. I found nothing showing that film technique raises installs. Only C8 and store taps can tell.
- **What a page can do that film can't:** the visitor acts. Tapping a word and reading it is the reveal, and it's the app's real behaviour.

## So we will...

1. Put the offer and a working store link on the first screen at 390×664, 375×553 and 1280×640, with no scroll, no JavaScript and no entrance delay.
2. Tell what the app is at once and hold back only how reading feels; that reveal comes from the visitor's own tap on a real Arabic word.
3. Respond to that tap within 100 ms, beside the word, using the app's real data and grammar colours, with colour meaning grammar and nothing else.
4. Leave scrolling native: no scrolljacking, no pins on phones, at most one pin on a laptop below the fold.
5. Never make body text wait for a scroll on phones; elsewhere fades are ≤ 400 ms, once, on secondary content, and stop under reduced motion.
6. Show 48 px of what comes next at the first fold, and never let blank space pass 40% of a viewport.
7. Keep a store link one tap away everywhere, with no modal or interstitial; stay within 12 phone screens, and make the first three stand alone as the pitch.
8. Write the beat sheet first, say each claim once, and leave the feeling unnamed.
9. Use real things only: captured screens from a shipped build, real corpus text, daylight photographs; no stock or generated images, and a provenance list for all of it.
10. Stay silent by default: sound only on a tap, male voices, no instruments. People modestly dressed, or none.
11. Keep one action, an element inventory where each element states what it does for the visitor (feeling included) or goes, and a claims ledger: free, no ads, nothing the build can't back up, no invented ratings, counters, testimonials or urgency.
12. Hold a page to its budgets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, ≤ 1 MB first load on phones, no trackers.
13. Test three rounds of five who decode but can't read books, scoring behaviour over compliments; use analytics for rates, measuring store taps per visit.
14. Cold-view every week the page changes, in daylight on the viewer's own phone: a day later they must recall one thing and want to try it.
15. Decide with this order: Rams on what stays (feeling counts as a use), Norman and Nolan on how it's found and felt, and Nielsen's veto on any observed failure or crossed threshold. Core tasks are never traded, and a page nobody feels isn't finished.
