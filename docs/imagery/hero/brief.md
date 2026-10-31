# Hero scene: brief

**Purpose:** the full-bleed first screen of the home page, behind the logo, headline and real app capture. At first sight it must say: the old books of the scholars, and someone reading them tonight.

**Size:** one wide master, about 2560 × 1440, and one tall master, about 1170 × 2532. In both, keep the left or lower third dark and calm for text.

**Prompt prefix, shared by the set:**

> Cinematic still, 35 mm anamorphic, night. An old stone-and-timber study or manuscript library lined with leather-bound classical Arabic books, their spines dark and worn. One man, late twenties, beard, dark clothes, seen from behind or in silhouette, face never visible, seated at a low wooden reading desk with one large open book, absorbed in it. Light only from visible sources: a single warm brass lamp on the desk, and cold blue moonlight through one tall arched window. Deep green-black shadows holding detail, warm amber pools of light, restrained muted colour, fine film grain, photographic and real, no lens flare, no fantasy glow.

**Rejection list, on sight:**

- Any lettering, script, calligraphy or fake Arabic that can be read as characters, on pages, spines, walls or anywhere. Book pages must be out of focus or angled away so no marks read as text.
- A visible face, women, children, or any real person's likeness.
- Mosque silhouettes, domes, crescents, lanterns as decoration, or orientalist costume such as turbans or robes.
- Logos, watermarks, floating particles, glowing dust or magic light.
- Anything that looks like an illustration, a game or generic AI art.

**Rule:** Claude directs and critiques each candidate at full size and at 390 px. At least two rounds. The real Arabic line, logo and app capture are composited on the page afterwards, never generated.

## Round 2 critique

Round 1 worked as a mood. To fix: the moon is too bright and stock-like, so remove the visible moon and keep cold blue light on the window. The gothic arch and European library read generic: use a plain arched stone window with simple dark wooden lattice, thick plaster walls, and low shelves of old leather-bound books, without any costume or decoration. Keep the man on the right third with the left half very dark and calm for text. Add a modern phone lying face up on the desk beside the open book, its screen softly lit but showing no readable content, so it says old books and an app, tonight. Reject the cross-like shape in tall-2: no crosses or cross-shaped window bars or handles anywhere.

## Round 2, replaced: make it look real

The owner: "the environment doesnt look realistic though, typically ai gneerated". The stone library is a fantasy set, and that is the root problem, not just the finish. Drop it and the Round 2 critique above.

**New scene:** an ordinary real apartment at night, in the same world as qamar360's images. A man, seen from behind, at a plain kitchen or small wooden table by a window, reading one old hardcover book, with a phone lying on the table. A plain painted wall, an ordinary radiator, a mug, a few mismatched books on a simple shelf, a real table lamp. Through the window, a dim northern European street with a lit window across the way.

**How it must look:** a real photograph taken handheld on a 35 mm camera at high ISO, available light only. Visible grain and some noise in the shadows, shadows that go properly black, slightly soft focus away from the subject, imperfect framing, muted natural colour, ordinary mess and wear.

**Reject on sight:** HDR look, even sharpness everywhere, glossy or waxy surfaces, glowing lamps with halos, teal-and-orange grading, perfectly arranged objects, rows of identical books, symmetrical composition, anything grand or cinematic-fantasy. Everything in the earlier rejection list still applies.

## Round 4: leave room for the phone

The rebuilt first screen puts a real phone on the right and the headline at the lower left, so the Round 3 man, who fills the right third, ends up behind the phone. Same world and same rejection list. He becomes small in a large room, placed between the words and the phone, and the room does the work, as in qamar360's street.

**Wide (16:9):** he sits near the centre of the frame, a little left of it, seen from behind, small: no more than a quarter of the frame's height. Tall window beside him showing a dim blue street. The left third is a dark plain wall, quiet enough for text. The right third is a dark room corner, quiet enough for a phone over it.

**Tall (9:19.5):** he sits in the upper half. The lower half falls away into dark floor for the words.

## Round 4 critique

Picked `r4-wide-2` and `r4-tall-1`. The ordinary room finally works: one lamp, one cold window on a wet street, and a small figure, in the same world as qamar360's street. `r4-wide-1` has a flatter view through the window. `r4-wide-3` loses the man at 390 px. All three are a little staged, with a very bare room and a floor reflection brighter than it would be, and that is the first thing to fix in a further round. Only 1672 px wide came back, so large screens upscale it.
