# Natural set: brief (2026-11-22)

**On the site since 2026-11-22.** `docs/decisions/2026-11-22-daylight-photographs.md` says how it is staged.

**Why:** the owner asked for more natural-looking images that present the app better, with the fine-art side of photography taken seriously.

## What is wrong with the set on the site

- Five of six frames are one recipe: amber light against blue dusk, three of them a lamp beside a blue window. It is a very common look in generated images, and it repeats.
- The light has no source logic. Walls are lit by soft airbrushed gradients, floors reflect more than they receive, and blacks fall off in an even vignette.
- The figures are small and far away, in empty surroundings, as scenery. There is little moment, gesture or touch.
- The phone, which is the product, is small or absent in most of them.
- The files finish the job: 1672 px wide at 17 to 37 KB for the interiors. The grain is gone and the shadows break into blocks.

## Direction

One photographer, one body of work. Colour negative film, medium format, a standard lens, a tripod, north light. Each picture is built on **one** formal idea and nothing else. Daylight carries the set; the dark that the words need comes from the real shadow side of a real room, or from a dark object near the lens.

**Palette:** limewashed grey, unbleached linen, oak, ink blue, one muted green. White balance left slightly cool in shade. No grade.

**The phone is used, not displayed.** It is a tool with fingerprints on it. Where its screen faces the lens, it is generated plain dark, and a real unedited capture is placed on it afterwards.

## Scenes

| Scene | Slot | The one idea |
|---|---|---|
| `bench` | Hero | A man reading from his phone in window light, an old closed book under his other hand |
| `slips` | Stuck | A dictionary seen from its fore-edge, bristling with paper slips |
| `thumb` | Turn | Hands and a phone, close, the thumb a centimetre from the glass |
| `sill` | Remember | A phone propped on a windowsill, a man out of focus behind it, getting on with his morning |
| `cable` | Listen | A white earphone cord falling from the ear over the front of a dark wool coat, the sea beyond |
| `chair` | Close | The reading place after he has left it: book, phone, a patch of sun |
| `table` | App, social card | Straight down on a worn table: phone, cloth-bound books, the morning's things |

## Reject on sight

- Any lettering, script or calligraphy, or marks that could be read as it, on pages, spines, walls, screens or clothing.
- A generated interface on any screen.
- A visible face, women, children, a real person's likeness. Mosque silhouettes, domes, crescents, lanterns, robes or turbans. Crosses, including window bars that read as one.
- Amber lamp against blue window. Teal and orange. Wet reflective streets. Glow, haze, visible beams of light, floating dust.
- Even vignettes, airbrushed walls, waxy skin, HDR, sharpness everywhere, props placed for the camera, rows of matching objects, steam as decoration.
- Phones with more than five fingers near them, wrong knuckles, an invented camera layout that draws the eye, a phone held over a book's page: the app doesn't read paper.

## Rounds and critique

Made with Codex (GPT-6.2-Astra, built-in image tool), 84 frames. Asked for its largest output, it returned at most 1672 × 941.

- **Round 1:** three frames per scene, Codex critiquing and reshooting its own. `bench`, `sill`, `cable` and `chair` found their picture. `slips` and `table` were prop styling, and `thumb` was a product demonstration.
- **Round 2:** light edits of the four, new photographs for the three. `bench`'s edit turned his head to the window, so round 1's frame stands.
- **Round 3:** portraits, and two rejections. The tumbler of tea on the sill read as whisky and became a cup. `slips` had pseudo-writing on a page and was made blank.
- **Round 4:** the `slips` portrait from the clean frame, and `bench`'s portrait without a scribble-like mark on the neck.
- **Owner, 2026-11-22:** "over all VERY good", with two faults: no one wears the cord down their back, and the phone and app in Remember don't look realistic.
- **Round 5 on:** `cable` from the side, the cord falling forward. `sill` with a slim phone that leans and reflects; one edit rejected because the glass reflected a barred window, and letter-like marks removed from the jar. The capture is now added as light over the glass, at the photograph's sharpness, with its status bar.
- **Beard, 2026-11-22:** the owner: the audience is orthodox Muslims, modern and often living in the West, who likely don't connect with a beardless man. `bench` edited in both shapes, one change only; `wide-1` and `tall-1` picked for a full, natural length and the least drift. `cable` then got the same beard, `wide-1` and `tall-3`.

Picks are the PNGs in this folder. `*-screen.webp` are the same frames with a real capture placed on the glass: `ios/02-tap-word` on `thumb`, `09-voice-review-speak-prompt` on `sill`, `ios/01-read` on `table`. No `table` portrait: the phone came back too long and would have cut the text.

**Taken as settled by the owner's "very good please push to site", 2026-11-22:** the set leaves the apartment, the captures on `thumb` and `sill` are laid on the glass in perspective, and `slips` cuts to `thumb`. The social card was not decided, so `public/og.jpg` still shows the first set's room.
