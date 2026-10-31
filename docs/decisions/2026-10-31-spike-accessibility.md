# Spike: accessibility of the reader and the reveal (plan task 2.0)

**Status:** decided by measurement on 2026-10-31, on throwaway pages in `docs/specimens/a11y/`. VoiceOver stays for task 5.7. Nobody listened to any of this: every speech result below is what the screen reader sent to its speech engine, read from logs.

Generator: `docs/specimens/a11y/build.mjs`, from the existing snapshot, with no new Supabase request. Harness and raw keyboard output: `docs/specimens/a11y/harness/`.

## Decision

**A sentence is one stop. Its words become stops only when you ask for them.** This is variant C below. It fits the budget at 937 B gzip, and it is the only variant where a screen reader can hear a sentence as a sentence.

It has one cost that needs the owner's eye: the script has to remove the `href`s on load, which reverses plan task 2.4 (see [What this changes](#what-this-changes)).

## The contract

### Reader, with script

| Action | Keyboard | Touch or pointer, no screen reader | Screen reader |
|---|---|---|---|
| Move through the text | Tab goes sentence to sentence, skipping sentences that can't be tapped | Scroll | Normal reading. Each sentence is one item, spoken whole, in Arabic |
| Open a sentence | Enter or Space. Focus lands on its first word | Not needed | Press the sentence (Enter in Orca, double tap in TalkBack) |
| Move through its words | Tab and Shift+Tab. Tab off the last word goes to the next sentence, and the words become plain text again | Not needed | Tab in Orca, swipe in TalkBack |
| Leave a sentence | Escape, back to the sentence | Not needed | The same in Orca. In TalkBack, swipe on and press another sentence |
| Open a word | Enter or Space on the word | Tap or click the word directly, no sentence step | Press the word |
| On opening | The card shows at once. Focus moves to it once the meaning is filled, so the meaning is spoken | The same | The meaning, then "dialog" in TalkBack |
| Close the card | Escape, Close, Tab off Close, or Shift+Tab off the card | Close, or tap outside | Close, or Escape in Orca |
| After closing | Focus is back on that word, and the page doesn't scroll | The same | That word is spoken again |
| Skip past the text | First Tab on the page reaches "Skip past the text". Enter moves focus to the next section's `h2` | Not shown until focused | A link. The `h2` is spoken after it |
| Glossary fails to load | Goes to the word's page. Seen once, by accident, from a tap on an early build | The same | Not tested |

The 352 sentences whose letters differ (D6) are plain text with no stop, and they read normally.

**Android Back does not close the card.** In Chrome 124 it left the page. Close is the way out on a phone, so it has to stay reachable.

### Language

- `html lang="en"`. Every Arabic sentence has `lang="ar" dir="rtl"`, and the card has `lang="en" dir="ltr"`.
- Results: Orca switched to its Arabic voice and back on every run, in both browsers. TalkBack asked the engine for `ara` and the engine dispatched `ar-xa-x-arz-lstm-embedded`.
- **English text on an Arabic element is read by the Arabic voice.** `aria-description="Enter chooses a word"` on a `lang="ar"` sentence went out with `lang: ar` in Orca, so it was removed. The instruction now lives once, in a visually hidden English line above the text.

### Without script

Every word is a link to its word page, so article 377 has 341 word stops plus the skip link. The skip link is plain CSS and HTML, and it's the only relief here. Enter or a double tap on a word lands on the word page in Chromium, Zen and Chrome on Android. The hidden instruction stays hidden, because it would be wrong.

### Story page, no script

| Action | Result |
|---|---|
| Word | Native `popovertarget`. Add `tabindex="-1" autofocus` to the card's gloss. Without it, opening a word says only "expanded" and the next Tab lands on Close, so the meaning is never spoken |
| Close | Escape or Close. Native focus return to the word, in both browsers and TalkBack |
| Coloured word | Keep the plain copy for assistive tech and hide the coloured copy from it. Without this TalkBack reads فَكَأَنِّي as three items: فَ, كَ, أَنِّي |
| Reveal | The checkbox as `DESIGN.md` has it. Space or a double tap toggles it, "checked" is spoken, and the English leaves the accessibility tree with `visibility: hidden` |

## The tab-stop problem

Article 377 has 467 words, but only 341 can be tapped under D6, because 6 of its 28 sentences have different letters. Measured with real Tab presses in both browsers, from the top of the page to the store link after the text:

| | A: links, plus skip link | B: one stop, arrows rove | **C: sentence stops** |
|---|---|---|---|
| Tabs, article 377 | 343 | 3 | **24** |
| Tabs, worst article, computed from the snapshot and not pressed | 375 (562) | 3 | **78** (570) |
| Word from the top, keyboard | Up to 343 Tabs, or use the skip link | Arrows, but only with no screen reader | Sentences plus up to 28 words |
| Orca, Say All | "فَنَهَسَ", "link", "مِنْهَا", "link", alternating voices | The same, "visited link" too | The sentence in one Arabic utterance, "button", then the English |
| TalkBack, hearing a sentence | One swipe per word, each followed by "link" | The same: `tabindex` doesn't affect it | One swipe |
| Arrow keys under Orca | Not used | **Fail.** In browse mode Orca takes Left itself and moved back to the skip link | Not used |
| Works with no script | Yes | Falls back to A | Falls back to A |
| JS, gzip | 665 B | 849 B | **937 B** |
| Crawlers keep `href` when they run JS | Yes | Yes | **No** |

- **A** is the no-script fallback, not a design. It fails "hear a sentence" on both screen readers.
- **B** is the fewest stops, but only helps a keyboard user with no screen reader. It also hides words from a sighted keyboard user who doesn't guess arrow keys.
- **C** costs more stops than B and solves the part that matters. A word only becomes a control when someone asks for it. A first attempt at C used arrow keys inside a sentence, and failed under Orca the same way as B, so words use Tab.

Three details were found by testing, and each needs keeping:

- **`aria-label` holding the sentence's own text is required.** Without it, Orca with Zen read only the first word of each sentence during Say All. Chromium didn't need it.
- **A TalkBack double tap is not a keyboard click.** It arrives as `pointerdown` then `click` with `detail: 1` and `pointerType: mouse`, targeting the sentence. So the script tells it apart from a tap on a word by its target, not by `detail`.
- **Tab off the card must be caught, not left to `focusout`.** With `focusout` the browser had already scrolled to the next section, 5,238 px down, and stayed there.

## Measured results

"Pass" means the final build did it and the log or page state showed it. Speech was logged and not heard.

| Task | Orca, Chromium | Orca, Zen | TalkBack, Chrome | Keyboard, Chromium | Keyboard, Zen |
|---|---|---|---|---|---|
| Hear a sentence | Pass | Pass, after the `aria-label` | Pass | Tab reaches it | Tab reaches it |
| Open a word | Pass | Pass | Pass | Pass | Pass |
| Close, back on that word | Pass | Pass | Pass, by Close | Pass, 4 ways | Pass, 4 ways |
| Skip to the next section | Pass | Pass | Pass | Pass | Pass |
| Reveal control | Pass | Pass | Pass, on the unfixed page | Pass | Pass |
| Story word opens and closes | Pass | Pass | Pass | Pass | Pass |
| Arabic announced as Arabic | Pass, `SET LANGUAGE ar`, voice "Arabic" | Pass, `lang: ar` | Pass, engine `ar-xa` | n/a | n/a |
| No script: word goes to its page | Pass | Pass | Pass | Pass | Pass |

The no-script rows ran on a page with no script tag (`reader-nojs.html`), not with scripting switched off in the browser. The story page has no script at all.

Other checks: a mouse click on a word opens it, and Escape returns to it, in both browsers. Tapping outside closes the card and returns focus to the word (Chromium only). A mouse drag across 5 words selected 26 characters: Zen once, Chromium 8 of 8 with a 500 ms settle after load. Two earlier Chromium runs with a shorter settle gave 0, including on the no-script page, and I didn't find out why. Task 2.4 repeats this test.

**Tested on:** Orca 51.1 with speech-dispatcher 0.12.1 and espeak-ng 1.52.0, Chromium 154.0.8037.97, Zen 1.23.2b, TalkBack 15.0.0 with Google TTS, Chrome 124 on an Android 15 emulator.

## JS cost

| Script | Minified | Gzip | Brotli |
|---|---:|---:|---:|
| Spike's `tap-final.js`, no contract | 1,256 B | 614 B | 498 B |
| A | 1,377 B | 665 B | 551 B |
| B | 1,942 B | 849 B | 718 B |
| **C, chosen** | **2,231 B** | **937 B** | **794 B** |

- That leaves 87 B of a 1,024 B budget, or 63 B of a 1,000 B one.
- Measured with the real audio URL in the source. The served specimens play a local file instead, so no Supabase request was made.
- **Not included:** anything that anchors the sheet to its word.
- **The hard cap is tight.** 937 B plus the 0.25 KB GA4 check is 1,187 B. Adding the 0.5 KB store-tap counter, if task 3.0 needs it, makes about 1,687 B, over the 1.5 KB cap. This was already over at 1 KB.

## `DESIGN.md` rules to add

To `Components`, after `Word`:

1. **Reader text.** Each sentence that can be tapped is a `<p lang="ar" dir="rtl">` of word links. With script, a sentence is one tab stop: `role="button"`, `tabindex="0"`, `aria-label` holding its own text, its words plain text with no `href`, role or tabindex. Enter, Space or a screen reader's press opens it: it loses those three, and each word gets `role="button"` and `tabindex="0"`, focus on the first. Escape, or focus leaving the sentence, undoes it. One sentence is open at a time. A sentence that can't be tapped is plain text with no stop.
2. **Words move by Tab, never by arrow keys.** Orca keeps the arrow keys in browse mode.
3. **A direct tap or click on a word opens its card.** No sentence step. A press on the sentence itself opens the sentence: tell them apart by the event target, never by `detail` or `pointerType`.
4. **Reader card.** The shared `popover` has `role="dialog"`, `aria-labelledby` its gloss, `tabindex="-1"`, `lang="en"`, `dir="ltr"`. It shows at once. Focus moves to it when the gloss is filled, with no outline. Escape, Close, Tab off Close, Shift+Tab off the card and tapping outside all close it and put focus back on the same word with `preventScroll`. Tab off the card is caught on `keydown`.
5. **Close stays in every card.** Android Back doesn't close a popover, and may leave the page.
6. **Skip link.** Before the first word of every reader page, in the HTML, working with no script: `<a href="#after">Skip past the text</a>`, off-screen until focused, then fixed at `gutter` with the focus ring. Its target is the next section's `h2`, with `tabindex="-1"`.
7. **One instruction.** A visually hidden English line above the text, shown by the script only. Never an `aria-description` per sentence: on `lang="ar"` it's read by the Arabic voice, 22 times over.

To `Word`, the story's markup:

8. The card's gloss is `<p class="card-gloss" tabindex="-1" autofocus>`, with no outline, so opening a word speaks its meaning with no script.

To `Coloured word and English`:

9. Replace the `.w-plain` and `.w-seg` gate with this, so one word is one announcement:

    ```html
    <span class="w-plain">فَكَأَنِّي</span><span class="w-seg" aria-hidden="true">…</span>
    ```

    ```css
    .w-seg { display: none; }
    @supports (field-sizing: content) {
      .w-plain { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
      .w-seg { display: inline; }
    }
    ```

    This applies where a word is read as loose text: the story's pairs and big word. Reader words don't need it, because a word's name comes from all its text.

To `Colors` or the state table in `Word`:

10. A focused sentence has a 2px `primary` outline, offset 2px.

To `Content surfaces`, replacing "Words in the reader are links to their word page with one shared popover":

11. Words in the reader are links to their word page in the HTML and with no script. With script they follow `Reader text`.

To `Review`:

12. `[T]` Tab stops: with script, page top to the first control after the text takes at most sentences + 2 Tabs.

## What this changes

- **Plan task 2.4 says to remove `href` on first pointer contact, so crawlers keep the links. C can't do that:** `<a href>` is always a link to a screen reader, so the words can't read as a sentence until it's gone. C removes them when the script runs, as the word-tap spike did. Crawlers reading the HTML still get every link. Crawlers that run the script don't. The effect on word-page discovery was not measured. Nothing about a word's own page changes, and directory pages still link to word pages.
- **Plan task 2.4's acceptance** needs its wording changed to match. The drag-as-first-gesture test stays.
- **`AGENTS.md`, Article reader row:** "plain external deferred script" still holds. Its "1 KB" now has 87 B left.
- **`AGENTS.md`, `DESIGN.md` and `docs/site-plan.md` were not edited,** as instructed.

## Limits

- **Orca wasn't installed, and there's no sudo.** I unpacked the signed Arch packages (orca, speech-dispatcher, espeak-ng and dependencies) into the session scratch directory, and installed nothing. It ran on a private X display with a private bus, not on the owner's desktop.
- **No human heard anything.** Speech went to a null audio sink on Orca, and the emulator ran with `-no-audio`. So whether espeak-ng or Google TTS pronounces vocalised classical Arabic well is unknown. "Announced as Arabic" means the right voice was asked for, and on TalkBack that the Arabic engine reported word-by-word progress.
- **VoiceOver was not run,** and no WebKit. All of this needs task 5.7. iOS may treat `role="button"` on a sentence differently.
- **TalkBack is on an emulator with Chrome 124,** far behind Chromium 154, and with no Play Store to update it. No real phone. Gestures were raw kernel touch events through `/dev/input`, because `adb input` bypassed TalkBack here and opened words directly. They count as real touch to Android, but no finger made them.
- **Orca's Say All was started over its D-Bus service,** because the numpad key I sent was echoed as "+" on Xvfb. Everything else in Orca was real X key events.
- **Zen's keyboard run predates the `aria-label`.** Orca on Zen ran the final build through the same keys. Chromium's ran on the final build, with the 343 and 343 from the earlier run.
- **Not tested:** swiping past Close while the card is open (the card isn't modal, so TalkBack may walk into the page behind it), the failed-glossary path with a screen reader, the word's audio button by any route, 200% zoom, an automated scan (none is installed), touch tap on a word with no screen reader on this final build, a tap in the gap between words (it opens the sentence, silently), and the old-iOS unwrap with `aria-label` in place. TalkBack's own continuous reading was not driven.
- **Known noise, left in:**
  - The reveal is exposed twice: the checkbox, and its label as text. Its name stays "Take the English away" while the label says "Bring the English back", so a voice-control user can't say what they see once it's checked.
  - The story's `Close` and the reader's `Close` announce "expanded" in TalkBack, from `popovertarget`.
  - Orca with Zen says the card's text twice on opening.
  - A gloss with two coloured parts, such as "and when", reads as two lines under Orca's Down arrow.
  - Tab from the skip link to the first sentence skips the hidden instruction, so a keyboard screen reader user hears only "button".
- **Draft copy to approve:** "Skip past the text", the hidden instruction ("Each Arabic line is a button. Press it to go through its words, then press a word for its meaning."), "Full entry", "Play".

## Harness warning

If this is rerun: pass a private `XDG_RUNTIME_DIR` (short, because socket paths cap at 108 bytes) and `DISPLAY` to `dbus-run-session` itself, as `env ... dbus-run-session -- session.sh`. Setting them inside the session is too late. A private `at-spi-bus-launcher` names its socket from those two, and the first attempt here replaced `/run/user/1000/at-spi/bus_0`, the owner's accessibility socket. Existing connections kept working, but new ones get "connection refused" until `systemctl --user restart at-spi-dbus-bus.service` or the next login. I left that for the owner, because it restarts a service I don't own. The scripts in `harness/` have this session's scratch paths in them, so change those first.
