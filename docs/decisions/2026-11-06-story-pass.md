# Story pass, 2026-11-06

The owner asked for a principal UI/UX pass so the site tells the app's story better, with new images from ChatGPT where needed. The plan is `~/.claude/plans/greedy-floating-leaf.md`; this records what was decided and why.

## What was wrong

Before, from screenshots of the built page (Chromium, 390×844 and 1440×900) and an independent review by the page director:

- **The story broke in the middle.** The page told a story at both ends and listed features in between. Ibn al-Jawzī's line, the one the visitor can't read at the turn, vanished for about 13 screens, because the app was filmed on other texts.
- **The screens were old and partly wrong.**
  - Every capture predated 1448.5.9, and iPhone and Android status bars were mixed.
  - The playlist showed a text the content scan flagged as modern.
  - The playing screen showed article 318, whose attribution is in doubt.
  - The one review word was الزَّبَّالَةُ, which the app glosses "The filthy one".
- **The app was hard to see.** It was shown about 290 px wide on a phone. Opacity blends merged two screens for much of the scroll between stops, and the zoom cut English sentences mid-word.
- **The page repeated itself and hid its moment.**
  - The chapter word was the biggest text on all nine stops.
  - At the payoff, the press, the English leaving and the heading's change happened out of each other's sight.
  - The scholars took 1.7 phone screens of plain text.
  - Every home badge counted as `home`.

## The owner's calls

| Question | Call |
|---|---|
| How to make new app screens | On the Android emulator, by the agent |
| New photographs | All three: the hero more lived in, the stuck frame's twin with the phone lit, the next morning |
| Content pages | Their offers get a real screen too |
| Filming article 559 | Yes, the quote only: sentence 7106 sits in a clean first-person quote (7103 to 7119), though the article as a whole is flagged for its modern narration. Title and image stay off-screen, and 7103 (the biographer's "He says in…") too |
| One write to production | Allowed: adding كَنْز to the QA account's practice list, so its review can be filmed. Every other request stays blocked. If it doesn't come up for review, use a benign word that's already due |
| Chapter order | Read, Remember, Listen. The word added in Read comes back the next morning, and the street becomes the pause before "Try it." |
| Photo picks | "Use all three", and leave the hero's coat chair, bag and socks out of the night photographs |

## What changed

- **Order.** Hero, then scholars, the turn, the stuck still dissolving into its lit twin ("In the app, the meaning is one tap away." in ink), Read, the morning still, Remember, the street still, Listen, the payoff, the library and the close. The photos run night, night, morning, dusk, dawn.
- **Chapters.** `Stage.astro` takes its stops as data, and each stop's screen shows its claim.
  - A screen changes only as the app changes it: a sheet, a push or a cut, never a blend.
  - A zoom fades at its edges.
  - The chapter word is big only on its first stop; a sentence-case marker names the chapter after that.
  - On a phone the camera frames each stop's detail, and on a laptop the phone is larger and closer to the words.
  - The rules are generic CSS drawn from `--t`, and the per-screen CSS is gone.
- **Payoff.**
  - Heading, English, control, then the line, so the press, the English leaving and "Now read it." are seen together.
  - On a laptop the control sits on the English's row.
  - Each clause of the line holds one row at 390 and 375, in both engines, even beside a 12 px scrollbar. The longer clause measured 7.42 times the type size, so the line is `min(3rem, 12vw − 2.5px)` on phones.
- **Scholars and library.**
  - The scholars take about one phone screen, and each name links to its author page.
  - The library opens on the line's English (stored text, a draft placement for the owner), then the four easier texts as cards. The cards are text only because 347's stored image carries a Grok watermark and a close face. The wall follows.
- **Listen still.** It plays article 412's stored Arabic-only track (1:23), not the English-first one, with "The audio uses AI voices." under it.
- **Measurement.** The home badges count apart: `home`, `try` (the payoff) and `close`, in `SURFACES` in `src/worker.ts`.
- **Content pages.** Each offer shows one small real capture: the word sheet on word and dictionary pages, the reader on article, category and author pages. `/download-app` uses the small copies.
- **Captures.** One reproducible pipeline: `src/lib/captures.mjs` holds the sources, hashes, crops and regions, and `node scripts/captures.mjs` writes full and 480 px AVIF and WebP. Every capture is cropped below its status bar to one shape, so iPhone and Android screens no longer mix.

## Captures

The recapture on the Android emulator was built but couldn't be filmed.

- **The build worked.**
  - A scratch export of `open-arabic` at `7f4037fe` (1448.5.10+283), with its `node_modules` copied by reflink, so nothing in `open-arabic` was touched.
  - The write guard in its `services/supabase.ts`.
  - A debug dev client (`com.edenmind.OpenArabic` 1448.5.10, 283), built in a memory-capped systemd scope: the first try was killed at the 13 GB cap; the second, with one worker, passed in 12 minutes.
  - Installed over the AVD's 1448.5.5 dev client, which kept the QA account signed in.
- **Filming didn't.** The other sessions on this machine kept the load between 10 and 24, with an `expo export`, an Astro build and a `tsc` run.
  - With `-gpu host`, the emulator reported "Your GPU cannot be used for hardware rendering" and painted nothing.
  - With `swiftshader_indirect`, it went into the ANR cycle the app's own notes describe: System UI and the launcher not responding in turn, and `adb` itself timing out.
  - On the third try the app started, but died before showing its tabs.
- **Production saw no write.** The guard's log shows one sign-in token refresh, and nothing else went through. The approved كَنْز write was never made: the due query sorts by `fsrs_due`, so a new card would sit behind the QA account's 100+ due words, and no route reviews one chosen word. Making a write the session couldn't show would have been pointless.

**Interim set, in `src/lib/captures.mjs`:** the best of the existing captures, each cropped below its status bar (iPhone 162 px; Android 118 px, plus 79 px above the gesture bar) to one shape, 1080 / 2203.

| Screen | Capture | Why |
|---|---|---|
| Reader | iPhone `01-read` (Talbīs Iblīs) | The page's earlier Read capture. Its tapped word is كِتَاب, "book", a thread to the line's كِتَابًا |
| Word sheet | iPhone `02-tap-word` | Shows Add to practice, so the add stop's ring lands on the real button. The Android sheet shows "In practice" |
| Voice review | Android `09-voice-review-speak-prompt` | دَرَجَة, "degree": a benign word in place of الزَّبَّالَةُ |
| Memory horizon | Android `05-memory-horizon-breakdown` | The only horizon capture. Example-account numbers, captioned |
| Player | Android `03-audio-playing` | The only capture with the player open. It shows article 318, whose attribution is still unverified |

**Still owed by a recapture:**
- The line itself in 559 (the match cut).
- A sheet that shows its grammar note.
- The audio-language picker.
- A player on a clean text.

The scratch export, its guarded build and the steps are ready to rerun on a quiet machine. Then a recapture only changes `src/lib/captures.mjs` and the files it names.

## Checked

- **Chromium** at 390×664 and 1440×900, played: every hold and the moment between.
- **Zen**, played and reduced motion, at 390×664. Headless Gecko runs no frame clock (`requestAnimationFrame` about once a second, IntersectionObserver never, lazy images never), so the Zen script sets `--t` with `home.ts`'s own maths and loads images eagerly. That tests what differs between engines: masks, container units, transforms, sticky pins and Amiri's line widths.
- **Static form:** reads complete and in order, with no sideways scroll.

## Open

- **iPhone and WebKit:** unproven, as before (`mask-composite`, `cq` units, sticky with transforms).
- **Draft copy:** new alt text and the library's placement of the line's English are on `docs/draft-copy.txt`.
- **347's article image:** it carries a Grok watermark and a close face. It is the article's own image and `og:image`, so it's for the owner to replace in the app's content.
