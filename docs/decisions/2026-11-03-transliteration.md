# Transliteration: marked, and drawn in Inter

2026-11-03. The owner asked for proper transliteration marks on romanized Arabic.

## What we show

- **One system, the stored work titles'.** Long vowels with a macron (ā ī ū), emphatic letters with a dot below (ḥ ṣ ṭ ḍ ẓ), ʿayn as `ʿ` (U+02BF) and hamza as `ʾ` (U+02BE), never an apostrophe or a quote mark. The work titles in the database already use it: Ṣayd al-Khāṭir, Zād al-Maʿād.
- **Author names** are stored without marks ("Ibn al-Jawzi"). `shownName()` in `src/lib/words.mjs` maps each stored name to its marked form for display: Ibn al-Jawzī, an-Nawawī, al-Bukhārī, adh-Dhahabī. The article is kept assimilated (an-, adh-) as the site always had it. Ibn al-Qayyim, Ibn Taymiyyah and Muslim need no mark.
- **Kept as stored:** slugs and URLs, `<title>`, meta descriptions and JSON-LD, so search and the knowledge graph match the spelling people type. Stored English and stored transliterations in the word enrichment (which use ḏ, ṯ, ġ, š) are shown as stored.
- The al-Fawāʾid page, the footer, the home page and the data files in `src/data/` use the marked forms.

## The font

The Inter subset had ā ī ū ḥ ṣ ṭ ḍ ẓ ʿ ʾ, but not ḏ ṯ ġ š or á, which 100 word pages use in their stored transliterations. Those fell back to Arial or Liberation Sans mid-word. The subset was rebuilt from Inter 4.001, same axes, plus those letters, a few Latin-1 accents and ½: +3.7 KB, 91,052 bytes of fonts against the 109,208 budget.

```sh
fonttools varLib.instancer "Inter[opsz,wght].ttf" wght=250:600 opsz=14:32 -o inter-limited.ttf
pyftsubset inter-limited.ttf \
  --text='áàâäéèêëíîïóôöúùûüçñÁÀÂÄÉÈÍÓÖÚÜÇÑ½' \
  --unicodes='U+0020-007E,U+00A0,U+00A9,U+00B7,U+0100-0101,U+010C-010D,U+012A-012B,U+0120-0121,U+0160-0161,U+016A-016B,U+017D-017E,U+02BC,U+02BE-02BF,U+1E0C-1E0F,U+1E24-1E25,U+1E2A-1E2B,U+1E62-1E63,U+1E6C-1E6F,U+1E92-1E95,U+2010-2014,U+2018-201D,U+2026' \
  --layout-features='calt,locl,kern' --name-IDs='*' --notdef-outline --flavor=woff2 \
  --output-file=src/fonts/inter-variable.subset.woff2
```

Before adding a character to any public text, check it is in the subset; a character outside it is drawn in another face.
