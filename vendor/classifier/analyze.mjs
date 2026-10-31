// ../open-arabic/constants/arabicWordComponents.ts
var ComponentType = {
  PREFIX: "prefix",
  INFIX: "infix",
  SUFFIX: "suffix",
  DIACRITIC: "diacritic"
};
var GrammaticalRole = {
  CONJUNCTION: "conjunction",
  // و, ف - connecting words/clauses
  DEFINITE_ARTICLE: "article",
  // ال - the
  PREPOSITION: "preposition",
  // ب, ل, ك, في, من, على, عن, إلى - with, to, like, in, from, on, about, to
  SUBJECT_PREFIX: "subject",
  // ت, ي, ن, أ - verb conjugation markers (you, he, we, I)
  FUTURE_TENSE: "future",
  // س, سوف - will/shall
  NEGATION: "negation",
  // لا, لم, لن, لئلا, إلا, بل - not, no, except
  PARTICLE: "particle",
  // قد, إن, فإن, إنما, أما, أن, إذا, ثم - various grammatical particles
  INTERROGATIVE: "interrogative",
  // ما, من, كم - what, who, how (question words)
  POSSESSIVE: "possessive",
  // ي, ك, ه, ها, نا, كم, هم, هن - my, your, his, her, our, their
  PLURAL: "plural",
  // ون, ين, ات - plural markers
  VERB_CONJUGATION: "verb",
  // ت, وا, تم, تن, كن - perfect tense verb endings (I, you, they)
  DEMONSTRATIVE: "demonstrative",
  // هذا, هذه, ذلك, تلك - this, that (pointing words)
  CASE_ENDING: "case",
  // ُ, َ, ِ - nominative, accusative, genitive diacritics
  GENERIC: "generic"
  // Fallback for unclassified components
};
var BASE_CONJUNCTIONS = [
  {
    arabic: "\u0648",
    english: ["and", "also", "plus", "along with", "while", "by", "nor", "or", "but", "rather"],
    role: GrammaticalRole.CONJUNCTION
  },
  // 'by' for oaths (e.g., "by Allah"); 'nor'/'or' for negated/disjunctive coordination; 'but'/'rather' for adversative paraphrases (وَلَكِنَّ, وَأَمَّا)
  {
    arabic: "\u0641",
    english: ["so", "then", "thus", "therefore", "consequently", "for", "about", "but", "and"],
    role: GrammaticalRole.CONJUNCTION
  }
  // Conjunction with consequential/sequential meaning (different color from simple conjunction و). 'and' is gated by VALIDATION 5b in prefixDetection (only when next char is a subject marker), preventing false positives on root-ف verbs like وَفَسَادُ.
  // Note: "and" removed from ف to prevent false positives when و already matches "and"
];
var BASE_PREPOSITIONS = [
  {
    arabic: "\u0628",
    english: [
      "with",
      "by",
      "in",
      "via",
      "through",
      "using",
      "according to",
      // NOTE: 'of' removed - it comes from genitive case (إضافة), not from ب prefix
      // This prevents false positives like بَيْت → "house of" where ب is a root letter
      "for",
      "at",
      "concerning",
      "based",
      "as"
    ],
    role: GrammaticalRole.PREPOSITION
  },
  {
    arabic: "\u0644",
    english: ["to", "for", "toward", "because of", "in order to", "of"],
    role: GrammaticalRole.PREPOSITION
  },
  {
    arabic: "\u0643",
    english: ["like", "as", "such as", "similar to"],
    role: GrammaticalRole.PREPOSITION
  },
  {
    arabic: "\u0641\u064A",
    english: ["in", "at", "inside", "within", "upon", "about"],
    // 'about' added for contexts like فيه = "about it"
    role: GrammaticalRole.PREPOSITION
  },
  { arabic: "\u0645\u0646", english: ["from", "of", "than", "out of"], role: GrammaticalRole.PREPOSITION },
  { arabic: "\u0645", english: ["from whom", "for what"], role: GrammaticalRole.PREPOSITION },
  // Shortened form in contractions (مما / ممن); narrowed triggers — 'of'/'from'/'for' alone over-trigger on maṣdars where م is a root letter.
  {
    arabic: "\u0639\u0644\u0649",
    english: ["on", "upon", "over", "above", "against", "to", "in"],
    role: GrammaticalRole.PREPOSITION
  },
  // 'to' for obligation/direction, 'in' for certain contexts
  { arabic: "\u0639\u0644\u064A", english: ["on", "upon", "in", "to"], role: GrammaticalRole.PREPOSITION },
  // Form with suffix (على + ه → عليه): alef maksura ى → yeh ي before pronoun suffixes. Inherits 'to' from على
  { arabic: "\u0639\u0644", english: ["on", "upon", "to"], role: GrammaticalRole.PREPOSITION },
  // Shortened form before possessive suffixes (على + ي → عليّ → normalized: عل + ي)
  {
    arabic: "\u0639\u0646",
    english: ["about", "from", "concerning", "regarding"],
    role: GrammaticalRole.PREPOSITION
  },
  {
    arabic: "\u0639\u0646\u062F",
    english: ["at", "with", "near", "within", "according to"],
    role: GrammaticalRole.PREPOSITION
  },
  // 'according to' added for interpretive translations like عِنْدَ → "according to"
  { arabic: "\u0625\u0644\u0649", english: ["to", "towards", "into", "until"], role: GrammaticalRole.PREPOSITION },
  { arabic: "\u0625\u0644\u064A", english: ["to", "towards"], role: GrammaticalRole.PREPOSITION },
  // Form before pronoun suffixes (إلى + ه → إليه)
  { arabic: "\u0625\u0644", english: ["to", "towards"], role: GrammaticalRole.PREPOSITION },
  // Shortened form before possessive suffixes (إلى + ي → إليّ → normalized: إل + ي)
  { arabic: "\u0644\u062F\u0649", english: ["with", "at", "by", "near"], role: GrammaticalRole.PREPOSITION },
  { arabic: "\u0644\u062F\u064A", english: ["with", "at"], role: GrammaticalRole.PREPOSITION },
  // Form before pronoun suffixes (لدى + ه → لديه)
  { arabic: "\u0644\u062F", english: ["with", "at"], role: GrammaticalRole.PREPOSITION },
  // Shortened form before possessive suffixes (لدى + ي → لديّ → normalized: لد + ي)
  {
    arabic: "\u0645\u0639",
    english: ["with", "together with", "alongside", "along with"],
    role: GrammaticalRole.PREPOSITION
  }
  // Note: ما moved to OTHER_PREFIXES to avoid compound generation (وما, فما)
];
var DEFINITE_ARTICLE = { arabic: "\u0627\u0644", english: ["the"], role: GrammaticalRole.DEFINITE_ARTICLE };
var OTHER_PREFIXES = [
  // Future tense markers
  { arabic: "\u0633", english: ["will", "shall"], role: GrammaticalRole.FUTURE_TENSE },
  { arabic: "\u0633\u0648\u0641", english: ["will", "shall"], role: GrammaticalRole.FUTURE_TENSE },
  // Negation particles
  {
    arabic: "\u0644\u0627",
    english: ["not", "no", "don't", "doesn't", "didn't", "do not"],
    role: GrammaticalRole.NEGATION
  },
  {
    arabic: "\u0644\u0645",
    english: ["did not", "didn't", "does not", "doesn't"],
    role: GrammaticalRole.NEGATION
  },
  {
    arabic: "\u0644\u0646",
    english: ["will not", "shall not", "never", "won't"],
    role: GrammaticalRole.NEGATION
  },
  {
    arabic: "\u0644\u0626\u0644\u0627",
    english: ["to not", "lest", "so that not", "in order not to"],
    role: GrammaticalRole.NEGATION
  },
  // Compound negation particle
  {
    arabic: "\u0644\u0648\u0644\u0627",
    english: ["if not for", "were it not for", "if it were not for"],
    role: GrammaticalRole.PARTICLE
  },
  // Compound conditional particle (historically لَوْ + لَا, but fossilized - cannot be decomposed)
  {
    arabic: "\u0625\u0644\u0627",
    english: ["except", "but", "only", "none", "nothing but"],
    role: GrammaticalRole.NEGATION
  },
  { arabic: "\u0628\u0644", english: ["but", "rather", "instead"], role: GrammaticalRole.CONJUNCTION },
  {
    arabic: "\u062B\u0645",
    english: ["then", "and then", "afterwards", "moreover"],
    role: GrammaticalRole.CONJUNCTION
  },
  // Actually a conjunction
  // Verbal subject markers (present tense)
  {
    arabic: "\u064A",
    english: ["he", "it", "was", "is", "does", "to", "will", "can"],
    role: GrammaticalRole.SUBJECT_PREFIX
  },
  // broader auxiliaries for gating, includes subjunctive 'to'; 'will'/'can' for modal/future verb forms (يَكُونُ, يَجُوزُ)
  {
    arabic: "\u062A",
    english: ["you", "she", "it", "does", "is", "to"],
    role: GrammaticalRole.SUBJECT_PREFIX
  },
  // 'it' for 3rd person feminine singular; 'to' for subjunctive (أن تفعل → "to do")
  { arabic: "\u0623", english: ["I", "do", "am"], role: GrammaticalRole.SUBJECT_PREFIX },
  { arabic: "\u0646", english: ["we", "are", "do"], role: GrammaticalRole.SUBJECT_PREFIX },
  // Aspect particles & common compounds
  {
    arabic: "\u0642\u062F",
    english: ["already", "indeed", "used to", "sometimes"],
    role: GrammaticalRole.PARTICLE
  },
  { arabic: "\u0625\u0646", english: ["indeed", "verily", "if"], role: GrammaticalRole.PARTICLE },
  // Note: "فإن" compound removed - should be detected as ف + إن (two prefixes) per database-examples test
  // Note: "إنما" compound removed - should be detected as إن + ما (two prefixes) per database-examples test
  {
    arabic: "\u0623\u0645\u0627",
    english: ["do you not", "do not you", "are you not", "have you not", "as for"],
    role: GrammaticalRole.INTERROGATIVE
  },
  // Interrogative + negation particle
  { arabic: "\u0645\u0627", english: ["what", "that which", "only"], role: GrammaticalRole.INTERROGATIVE },
  // Interrogative/relative - multi-word OK for standalone, 'only' in restrictive contexts (إنما)
  {
    arabic: "\u0645\u0646",
    english: ["who", "whoever", "whomever", "he who", "those who"],
    role: GrammaticalRole.INTERROGATIVE
  },
  // Relative pronoun - multi-word OK for standalone, removed from PARTICLES to prevent compounds
  { arabic: "\u0623\u0646", english: ["that", "to"], role: GrammaticalRole.PARTICLE },
  { arabic: "\u0625\u0630\u0627", english: ["if", "when"], role: GrammaticalRole.PARTICLE },
  { arabic: "\u0643\u0645", english: ["how much", "how many", "how"], role: GrammaticalRole.INTERROGATIVE },
  // Particles/prepositions ending in ى (alef maksura)
  { arabic: "\u062D\u062A\u0649", english: ["until", "even", "so that"], role: GrammaticalRole.PARTICLE },
  { arabic: "\u062D\u062A", english: ["until", "even"], role: GrammaticalRole.PARTICLE },
  // Shortened form before possessive suffixes (حتى + ي → حتيّ → normalized: حت + ي)
  // متى/مت removed from prefix list: متى is an interrogative pronoun (the stem,
  // not a productive prefix) and stacks as a spurious 2nd prefix in فَمَتَى etc.
  // Single-word "متى" → "when" is handled by the single-word rule.
  { arabic: "\u0623\u0646\u0649", english: ["where", "how", "wherever"], role: GrammaticalRole.INTERROGATIVE },
  { arabic: "\u0623\u0646", english: ["where", "how"], role: GrammaticalRole.INTERROGATIVE }
  // Shortened form before possessive suffixes (أنى + ي → أنيّ → normalized: أن + ي) - different from أن particle
];
function createFinalPrefixList() {
  const individualBasePrefixes = [
    ...BASE_CONJUNCTIONS,
    ...BASE_PREPOSITIONS,
    ...OTHER_PREFIXES
  ].map((p) => ({
    ...p,
    type: ComponentType.PREFIX
  }));
  const flexibleDefiniteArticle = {
    ...DEFINITE_ARTICLE,
    type: ComponentType.PREFIX
  };
  return [...individualBasePrefixes, flexibleDefiniteArticle].sort(
    (a, b) => b.arabic.length - a.arabic.length
  );
}
var ARABIC_PREFIXES = createFinalPrefixList();
var ARABIC_INFIXES = [
  // Form VIII reflexive/reciprocal infix ت
  {
    arabic: "\u062A",
    english: ["self", "each other", "mutually", "reciprocally", "together"],
    type: ComponentType.INFIX,
    role: GrammaticalRole.VERB_CONJUGATION
  },
  // Form VII passive/reflexive infix ن
  {
    arabic: "\u0646",
    english: ["self", "itself", "automatically", "spontaneously"],
    type: ComponentType.INFIX,
    role: GrammaticalRole.VERB_CONJUGATION
  },
  // Form X seeking/requesting infix ست
  {
    arabic: "\u0633\u062A",
    english: ["seek", "sought", "request", "ask for", "try to", "attempt to"],
    type: ComponentType.INFIX,
    role: GrammaticalRole.VERB_CONJUGATION
  },
  // Form IV causative infix أ (when internal)
  {
    arabic: "\u0623",
    english: ["make", "cause", "let", "allow", "enable"],
    type: ComponentType.INFIX,
    role: GrammaticalRole.VERB_CONJUGATION
  },
  // Intensive/repetitive infix patterns (Form II: doubled middle radical)
  {
    arabic: "\u0631\u0631",
    english: ["repeatedly", "again and again", "continuously"],
    type: ComponentType.INFIX,
    role: GrammaticalRole.VERB_CONJUGATION
  },
  {
    arabic: "\u0644\u0644",
    english: ["repeatedly", "continuously", "persistently"],
    type: ComponentType.INFIX,
    role: GrammaticalRole.VERB_CONJUGATION
  },
  {
    arabic: "\u0645\u0645",
    english: ["make", "cause to", "intensify", "thoroughly"],
    type: ComponentType.INFIX,
    role: GrammaticalRole.VERB_CONJUGATION
  },
  {
    arabic: "\u0643\u0643",
    english: ["intensely", "repeatedly", "thoroughly"],
    type: ComponentType.INFIX,
    role: GrammaticalRole.VERB_CONJUGATION
  },
  {
    arabic: "\u062F\u062F",
    english: ["repeatedly", "intensify", "multiply"],
    type: ComponentType.INFIX,
    role: GrammaticalRole.VERB_CONJUGATION
  },
  // Comparative/superlative infix أ (when internal, different from causative)
  // Note: Removed ا (alif) and ي (yaa') infix patterns due to root letter ambiguity
  // These single-letter patterns caused false positives when root letters coincided
  // with English translations containing trigger words ('with', 'little', etc.)
  {
    arabic: "\u0623\u0639",
    english: ["more", "most", "greater", "superior"],
    type: ComponentType.INFIX,
    role: GrammaticalRole.VERB_CONJUGATION
  }
];
var ARABIC_SUFFIXES = [
  // Pronouns - possessive (normalized, no diacritics)
  {
    arabic: "\u064A",
    role: GrammaticalRole.POSSESSIVE,
    english: ["my", "mine", "me", "of me", "i"],
    // 'i' (lowercased 'I') matches 1st-person subject reference
    type: ComponentType.SUFFIX
  },
  // Shadda-aware possessive suffixes (when attached to prepositions ending in ى)
  // e.g., على + ي → علىّ or عليّ (upon me), لدى + ي → لديّ (with me)
  {
    arabic: "\u0649\u0651",
    english: ["my", "me", "of me"],
    role: GrammaticalRole.POSSESSIVE,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u064A\u0651",
    english: ["my", "me", "of me"],
    role: GrammaticalRole.POSSESSIVE,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0643",
    english: ["your", "yours", "of you", "of your", "you"],
    role: GrammaticalRole.POSSESSIVE,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0647",
    english: [
      "his",
      "its",
      "it",
      "of him",
      "of his",
      "of it",
      "of its",
      "him",
      "himself",
      "he",
      "their",
      "whose"
    ],
    role: GrammaticalRole.POSSESSIVE,
    type: ComponentType.SUFFIX
  },
  // Object pronoun - me
  {
    arabic: "\u0646\u064A",
    english: ["me", "my", "of me"],
    role: GrammaticalRole.POSSESSIVE,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0647\u0627",
    english: ["her", "hers", "its", "it", "of her", "of it", "of its", "of their", "their", "them"],
    role: GrammaticalRole.POSSESSIVE,
    type: ComponentType.SUFFIX
  },
  // Common transliteration-equivalent: final "هِ" often maps to "it/its"; we already catch via 'ה' suffix
  // Keep 'it/its' present for 'ה' to handle cases like "...هِ"
  // Subjunctive suffix (ya + verb + tu = "to verb")
  {
    arabic: "\u062A\u064F",
    role: GrammaticalRole.PARTICLE,
    english: ["to"],
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0646\u0627",
    english: ["our", "ours", "of us", "us", "we"],
    // 'we' for first-person plural subject in verb conjugations
    role: GrammaticalRole.POSSESSIVE,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0643\u0645",
    english: ["your", "yours", "of your", "you all", "you"],
    role: GrammaticalRole.POSSESSIVE,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0647\u0645",
    english: ["their", "theirs", "of their", "them"],
    role: GrammaticalRole.POSSESSIVE,
    type: ComponentType.SUFFIX
  },
  // Dual possessive/object pronouns
  {
    arabic: "\u0643\u0645\u0627",
    english: ["you two", "both of you", "your (dual)"],
    role: GrammaticalRole.POSSESSIVE,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0647\u0645\u0627",
    english: ["both of them", "their (dual)", "them two", "them", "which", "those", "these"],
    role: GrammaticalRole.POSSESSIVE,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0647\u0646",
    english: ["their", "theirs", "them"],
    role: GrammaticalRole.POSSESSIVE,
    type: ComponentType.SUFFIX
  },
  // Standalone subject pronouns (when appearing after prefixes like و، ف)
  // These are treated as suffixes to enable coloring in combinations like وهو "and he"
  //
  // NOTE: These intentionally duplicate POSSESSIVE suffixes (هم, هن, هما) with different
  // English trigger words. The analysis engine matches based on which English words appear
  // in the translation, enabling context-dependent role assignment:
  //   - English has "they/he/she" (subject) → GENERIC wins → verbConjugation color
  //   - English has "their/his/her" (possessor) → POSSESSIVE wins → possessive color
  // Example: وهم "and they" → generic | كتابهم "their book" → possessive
  // Subject pronouns هو/هي register as GENERIC suffixes so combinations like وهو
  // "and he", فهي "then she", وهي "and she" can show composition. The UI-symmetry
  // filter in arabicWordAnalysis.ts (englishContainsAnyMatch) ensures these only
  // surface when the English actually contains the corresponding pronoun, so they
  // do not fire as false positives on root-final occurrences without that English token.
  {
    arabic: "\u0647\u0648",
    english: ["he", "it", "him"],
    role: GrammaticalRole.GENERIC,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0647\u064A",
    english: ["she", "it", "her"],
    role: GrammaticalRole.GENERIC,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0647\u0645",
    english: ["they", "them"],
    role: GrammaticalRole.GENERIC,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0647\u0646",
    english: ["they", "them"],
    role: GrammaticalRole.GENERIC,
    type: ComponentType.SUFFIX
  },
  // Feminine plural subject reference (e.g., إِنَّهَا "indeed they/she"). Mirrors
  // the GENERIC هم/هن variants above — separate from the POSSESSIVE ها which
  // uses 'her/its/their' triggers.
  {
    arabic: "\u0647\u0627",
    english: ["they"],
    role: GrammaticalRole.GENERIC,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0647\u0645\u0627",
    english: ["they two", "both of them", "them", "two"],
    role: GrammaticalRole.GENERIC,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0627\u0646\u062A",
    english: ["you"],
    role: GrammaticalRole.GENERIC,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0627\u0646\u062A\u0645",
    english: ["you all", "you"],
    role: GrammaticalRole.GENERIC,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0627\u0646\u062A\u0646",
    english: ["you all", "you"],
    role: GrammaticalRole.GENERIC,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0627\u0646\u062A\u0645\u0627",
    english: ["you two", "you both"],
    role: GrammaticalRole.GENERIC,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0646\u062D\u0646",
    english: ["we", "us"],
    role: GrammaticalRole.GENERIC,
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0627\u0646\u0627",
    english: ["I", "me"],
    role: GrammaticalRole.GENERIC,
    type: ComponentType.SUFFIX
  },
  // Perfect tense subject endings
  {
    arabic: "\u062A",
    role: GrammaticalRole.VERB_CONJUGATION,
    english: ["I", "you"],
    type: ComponentType.SUFFIX
  },
  // Common plural verbal/pronoun endings
  {
    arabic: "\u0648\u0627",
    role: GrammaticalRole.VERB_CONJUGATION,
    english: ["they", "them", "they did", "you"],
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u062A\u0645",
    role: GrammaticalRole.VERB_CONJUGATION,
    english: ["you", "you all", "you did"],
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0643\u0646",
    role: GrammaticalRole.VERB_CONJUGATION,
    english: ["you", "you all", "you were"],
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u062A\u0646",
    role: GrammaticalRole.VERB_CONJUGATION,
    english: ["you", "you all"],
    type: ComponentType.SUFFIX
  },
  // Conditional particle as suffix for compound words like فإن
  {
    arabic: "\u0625\u0646",
    role: GrammaticalRole.PARTICLE,
    english: ["if"],
    type: ComponentType.SUFFIX
  },
  // Dual & plural markers - only include plausible word equivalents
  {
    arabic: "\u0627\u0646",
    role: GrammaticalRole.PLURAL,
    english: ["two", "both"],
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u064A\u0646",
    role: GrammaticalRole.PLURAL,
    english: [
      "two",
      "both",
      "believers",
      "Muslims",
      "Christians",
      "kafirs",
      "hypocrites",
      "unbelievers",
      "wrongdoers",
      "righteous",
      "idolaters"
    ],
    type: ComponentType.SUFFIX
  },
  // Compound dual + possessive suffixes (dual marker ين + possessive pronoun)
  // These appear in words like يَدَيْهِ (his hands = يد + ين + ه).
  // English triggers are restricted to dual-indicating words ('hands', 'two')
  // — generic possessives ('his', 'its', 'their') are intentionally absent
  // because they over-match singular possessive ـه on words like أَبِيهِ ("his father").
  {
    arabic: "\u064A\u0647",
    role: GrammaticalRole.POSSESSIVE,
    english: ["hands", "two", "both"],
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u064A\u0647\u0627",
    role: GrammaticalRole.POSSESSIVE,
    english: ["hands", "two", "both"],
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u064A\u0643",
    role: GrammaticalRole.POSSESSIVE,
    english: ["your", "yours", "hands", "two"],
    // Dual possessive second person
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u064A\u0643\u0645",
    role: GrammaticalRole.POSSESSIVE,
    english: ["your", "yours", "hands", "two"],
    // Dual possessive plural
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u064A\u0647\u0645",
    role: GrammaticalRole.POSSESSIVE,
    english: ["their", "theirs", "hands", "two"],
    // Dual possessive plural masculine
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0648\u0646",
    role: GrammaticalRole.PLURAL,
    english: [
      "they",
      "those who",
      "believers",
      "Muslims",
      "Christians",
      "kafirs",
      "hypocrites",
      "unbelievers",
      "wrongdoers",
      "righteous",
      "idolaters"
    ],
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0627\u062A",
    role: GrammaticalRole.PLURAL,
    english: [
      "times",
      "instances",
      "darknesses",
      "gardens",
      "verses",
      "rooms",
      "mothers",
      "sisters",
      "daughters",
      "wives",
      "angels"
    ],
    type: ComponentType.SUFFIX
  },
  // Demonstrative pronouns registered as suffixes for combinations like بهذا, وهذا,
  // فذلك etc. The UI-symmetry filter in arabicWordAnalysis.ts ensures these only
  // surface when the corresponding English ('this'/'that') is in the displayed text,
  // so they do not over-trigger on root-final occurrences.
  {
    arabic: "\u0647\u0630\u0627",
    role: GrammaticalRole.DEMONSTRATIVE,
    english: ["this"],
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0647\u0630\u0647",
    role: GrammaticalRole.DEMONSTRATIVE,
    english: ["this"],
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u0630\u0644\u0643",
    role: GrammaticalRole.DEMONSTRATIVE,
    english: ["that"],
    type: ComponentType.SUFFIX
  },
  {
    arabic: "\u062A\u0644\u0643",
    role: GrammaticalRole.DEMONSTRATIVE,
    english: ["that"],
    type: ComponentType.SUFFIX
  }
].sort((a, b) => b.arabic.length - a.arabic.length);
var ARABIC_DIACRITICS = [
  // Fatha (ــَ) - short "a" vowel, marks accusative case / default past tense.
  // INTENTIONALLY NOT DETECTED: a bare final fatha is a case-ending vowel, not a
  // separable morpheme to color. Its old triggers ('he' for "he <verb>" past-tense,
  // 'a'/'an'/'as' for accusative nouns) only produced false positives — the ground-truth
  // corpus has zero diacritic-only components. A "he <verb>" word with a real affix still
  // paints via that affix. (Same rationale as the Kasra trim below.)
  // Kasra (ــِ) - short "i" vowel, often indicates genitive case
  // NOTE: standalone prepositions ('of', 'in', 'with') removed — they are English grammar
  // connecting the noun to its context, not translations of the kasra itself.
  // Kasra is detected via inheritance from the governing preposition/construct.
  {
    arabic: "\u0650",
    // Kasra at end of word
    english: ["of his", "of its", "of her", "of their"],
    type: ComponentType.DIACRITIC,
    role: GrammaticalRole.CASE_ENDING
  },
  // Damma (ــُ) - short "u" vowel, often indicates nominative case
  // NOTE: 'of' removed — damma doesn't mean "of"
  {
    arabic: "\u064F",
    // Damma at end of word
    english: ["he", "it", "they"],
    type: ComponentType.DIACRITIC,
    role: GrammaticalRole.CASE_ENDING
  },
  // NOTE: all four tanween entries (ــًا, ــً, ــٍ, ــٌ) were removed. Nunation marks
  // indefiniteness and case, but it is not a separable morpheme to color — and the
  // ground-truth corpus is unanimous: of 52 tanween-final cases, 43 expect no
  // components at all and the other 9 earn theirs solely from a prefix (وَعَدْلًا
  // "and justice" via و). Zero expect a paint from the nunation itself.
  //
  // The earlier cleanup pulled the indefinite-article triggers ('a','an','as','is')
  // from ًا/ً/ٌ for exactly this reason but left two leaks behind, worth 235 words
  // (276 occurrences) of spurious paint in the production corpus:
  //   - ٍ kept the whole set ('of','in','at','a','something'), so سِكَّةٍ "a track"
  //     painted its kasratan as "a" — the same shape as رَجُلٌ "A man", which that
  //     cleanup had already called a false positive.
  //   - 'one' survived on ًا/ً/ٌ and matched the English pronoun rather than any
  //     numeral: سَيِّئًا "bad one", وَمُحَرِّكٌ "and the one who stirs up",
  //     يَوْمًا "one day" (a numeral, but not what the nunation means).
  // Both painted symmetrically (Arabic mark ↔ English word), so the UI pairing
  // invariant could never flag them; they were invisible until the benchmark
  // learned to score diacritics.
  // Dual Nominative (ــانِ) - dual form in nominative case
  {
    arabic: "\u0627\u0646\u0650",
    english: ["two", "both", "dual"],
    type: ComponentType.DIACRITIC,
    role: GrammaticalRole.CASE_ENDING
  },
  // Dual Accusative/Genitive (ــينِ) - dual form in accusative or genitive case
  {
    arabic: "\u064A\u0646\u0650",
    english: ["two", "both", "dual"],
    type: ComponentType.DIACRITIC,
    role: GrammaticalRole.CASE_ENDING
  },
  // Taa sakina (ــتْ) - feminine past-tense subject marker (قَالَتْ "she said").
  // NOT taa marboota (ة). Matched as a DIACRITIC so the sukun is still present:
  // normalization would strip it and collide with the generic ت suffix, which is
  // exactly the ambiguity the sukun resolves. A noun-final ت carries a case vowel,
  // so تْ is reliably verbal — that is why 'she'/'they' are safe here even though
  // they over-fire on the bare ت suffix (feminine nouns referred to as "she").
  // 'they' covers the non-human plural, which Arabic treats as feminine singular
  // (كَثُرَتْ "they are numerous").
  // 'take'/'takes'/'becomes' were removed: تْ marks who did the verb, never which
  // verb, so pairing it with a lexical verb taught the wrong thing — عَلِقَتْ
  // "take hold" painted تْ and "take" the same colour while the word's own note
  // said the ending marks the feminine subject. The auxiliaries stay: English
  // carries agreement on them, so "was"/"is" is a fair counterpart to the marker.
  {
    arabic: "\u062A\u0652",
    english: ["was", "did", "has", "have been", "is", "it", "she", "they"],
    type: ComponentType.DIACRITIC,
    role: GrammaticalRole.CASE_ENDING
  },
  // First person plural past tense (ــنَا) - "we did"
  {
    arabic: "\u0646\u064E\u0627",
    english: ["we", "we were", "we did"],
    type: ComponentType.DIACRITIC,
    role: GrammaticalRole.CASE_ENDING
  },
  // Dual subject marker (ــَا) - "they two" / dual
  {
    arabic: "\u064E\u0627",
    english: ["they", "both", "they said", "they two"],
    type: ComponentType.DIACRITIC,
    role: GrammaticalRole.CASE_ENDING
  }
  // NOTE: the bare final-fatha "he did" (past-tense) entry was removed. A lone final
  // fatha marks default past tense but is NOT a separable morpheme to color — the
  // ground-truth corpus has zero diacritic-only components, so it only produced false
  // positives on plain verbs (قَالَ "he said", خَلَقَ "he created", كَانَ "he was").
  // A "he <verb>" word with a real affix still paints via that affix.
];
var COMPONENT_TYPE_CONFIG = {
  [ComponentType.PREFIX]: {
    label: "Prefix",
    colorName: "tint",
    // Primary tint color (sage green)
    icon: "\u2192"
  },
  [ComponentType.INFIX]: {
    label: "Infix",
    colorName: "violet",
    // Purple for transformation (verb forms VII, VIII, X)
    icon: "\u2194"
  },
  [ComponentType.SUFFIX]: {
    label: "Suffix",
    colorName: "warning",
    // Warning color for better contrast in both light and dark modes
    icon: "\u2190"
  },
  [ComponentType.DIACRITIC]: {
    label: "Diacritic",
    colorName: "accent",
    // Azure blue for visibility
    icon: "\u25CC"
  }
  // `satisfies` rather than a plain annotation: the literal types survive (the
  // renderer needs the exact colour name), while a missing ComponentType or a
  // colour outside `ValidColorName` becomes a compile error here, where the
  // wrong value is written. This replaced a runtime assertion that rebuilt the
  // valid-name list from these very objects and THREW partway through painting
  // an article.
};
var GRAMMATICAL_ROLE_COLORS = {
  [GrammaticalRole.PREPOSITION]: "grammar.preposition",
  // amber (90°)
  [GrammaticalRole.POSSESSIVE]: "grammar.possessive",
  // sage (155°)
  [GrammaticalRole.PARTICLE]: "grammar.particle",
  // lime (110°)
  [GrammaticalRole.INTERROGATIVE]: "grammar.interrogative",
  // seafoam (185°)
  [GrammaticalRole.VERB_CONJUGATION]: "grammar.verbConjugation",
  // mintGreen (170°)
  [GrammaticalRole.NEGATION]: "grammar.negation",
  // olive (125°)
  [GrammaticalRole.SUBJECT_PREFIX]: "grammar.subjectPrefix",
  // skyBlue (225°)
  [GrammaticalRole.PLURAL]: "grammar.plural",
  // yellowGreen (140°)
  [GrammaticalRole.DEMONSTRATIVE]: "grammar.demonstrative",
  // teal (200°)
  [GrammaticalRole.CONJUNCTION]: "grammar.conjunction",
  // periwinkle (250°)
  [GrammaticalRole.FUTURE_TENSE]: "grammar.futureTense",
  // violet (270°)
  [GrammaticalRole.DEFINITE_ARTICLE]: "grammar.definiteArticle",
  // golden (50°)
  [GrammaticalRole.CASE_ENDING]: "grammar.particle",
  // Aliases to particle — diacritics typically use inheritColorFrom instead
  [GrammaticalRole.GENERIC]: "grammar.verbConjugation"
  // Aliases to verbConjugation — standalone pronouns (هو, هي, etc.)
  // Exhaustive by construction: a new GrammaticalRole with no colour, or a
  // `grammar.*` key the theme does not define, fails to compile — see the note
  // on COMPONENT_TYPE_CONFIG above.
};

// ../open-arabic/utils/colorResolution.ts
function shouldApplyColorCoding(text) {
  const wordCount = text.trim().split(/\s+/).length;
  return wordCount > 1;
}

// ../open-arabic/utils/arabicAnalysis/constants.ts
var DIACRITIC_REGEX_GLOBAL = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
var DIACRITIC_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06ED]/;
var UNICODE_FORMAT_REGEX = /[\u200B-\u200F\u202A-\u202E\uFEFF]/g;
var NON_WORD_REGEX = /[^\w\s]/g;
var WHITESPACE_REGEX = /\s+/;
var CACHE_SIZE_LIMIT = 500;
var VALIDATION_CONFIG = {
  /** Arabic letters that are often vowels (weak letters), excluded from consonant count */
  WEAK_LETTERS: ["\u0627", "\u0648", "\u064A"],
  /** Single-letter prefixes that require structural validation to avoid false positives */
  // Note: 'ن' included - with HIDDEN_PREFIX_MIN_LENGTH=3, it prevents false positives (نزه)
  // while still allowing valid cases (نفسه where ن+ف+س = 3 chars)
  SUBJECT_MARKERS: ["\u064A", "\u062A", "\u0646", "\u0623"],
  /** High-risk single-letter prepositions that often appear in morphological patterns */
  // م appears in مَفْعَل nouns (مذهب، مسجد، مطبخ) and should rarely be split
  // Only valid in grammatical contractions like مِمَّن (من + من)
  HIGH_RISK_PREPOSITIONS: ["\u0645"],
  /** High-risk suffix patterns that require validation (common as root letters) */
  HIGH_RISK_SUFFIXES: ["\u0647", "\u0647\u0627", "\u064A", "\u0643"],
  /** Known prepositions that end in ي when taking pronoun suffixes (علي، لدي، إلي) */
  PREPOSITIONS_WITH_SUFFIXES: ["\u0639\u0644\u064A", "\u0644\u062F\u064A", "\u0625\u0644\u064A"],
  /** Minimum validation thresholds for prefix detection */
  PREFIX_VALIDATION: {
    MIN_REMAINING_LENGTH: 2,
    // Allow 2-char roots (جد، صل، قع) from assimilated verbs (يجد، يصل، يقع)
    MIN_CONSONANTS: 2
  },
  /** Minimum validation thresholds for suffix detection */
  SUFFIX_VALIDATION: {
    MIN_REMAINING_LENGTH: 2,
    // Allow 2-letter roots (رب, يد, دم, فم, etc.)
    MIN_CONSONANTS_3PLUS: 2,
    // For 3+ char roots, require 2 consonants
    MIN_CONSONANTS_2CHAR: 1,
    // For 2-char roots, require only 1 consonant (allows يد, فم)
    /** Extra length required if remaining starts with subject marker (accounts for prefix + 2-char root, including shadda cases) */
    HIDDEN_PREFIX_MIN_LENGTH: 3
  },
  /** Future tense prefixes that indicate verb conjugation */
  FUTURE_TENSE_PREFIXES: ["\u0633", "\u0633\u0648\u0641"],
  /** Negation prefixes */
  NEGATION_PREFIXES: ["\u0644\u0627", "\u0644\u0645", "\u0644\u0646"]
};

// ../open-arabic/utils/arabicAnalysis/cache.ts
var ARABIC_NORMALIZATION_CACHE = /* @__PURE__ */ new Map();
var ENGLISH_NORMALIZATION_CACHE = /* @__PURE__ */ new Map();
var ANALYSIS_CACHE = /* @__PURE__ */ new Map();
function cacheWithFifoEviction(cache, key, value, limit = CACHE_SIZE_LIMIT) {
  if (cache.size >= limit) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== void 0) {
      cache.delete(firstKey);
    }
  }
  cache.set(key, value);
}

// ../open-arabic/constants/contractions.ts
var CONTRACTION_MAP = {
  // Negation contractions
  "won't": "will not",
  "can't": "cannot",
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "hasn't": "has not",
  "haven't": "have not",
  "hadn't": "had not",
  "wouldn't": "would not",
  "shouldn't": "should not",
  "couldn't": "could not",
  "mustn't": "must not",
  "mightn't": "might not",
  "shan't": "shall not",
  // "Will" contractions
  "i'll": "i will",
  "you'll": "you will",
  "he'll": "he will",
  "she'll": "she will",
  "it'll": "it will",
  "we'll": "we will",
  "they'll": "they will",
  // "Be" verb contractions
  "i'm": "i am",
  "you're": "you are",
  "he's": "he is",
  "she's": "she is",
  "it's": "it is",
  "we're": "we are",
  "they're": "they are",
  // "Have" contractions
  "i've": "i have",
  "you've": "you have",
  "we've": "we have",
  "they've": "they have",
  // "Would/Had" contractions
  "i'd": "i would",
  "you'd": "you would",
  "he'd": "he would",
  "she'd": "she would",
  "we'd": "we would",
  "they'd": "they would",
  // "Let" contractions
  "let's": "let us",
  // "That/What/Where/etc" contractions
  "that's": "that is",
  "there's": "there is",
  "here's": "here is",
  "what's": "what is",
  "who's": "who is",
  "where's": "where is",
  "when's": "when is",
  "why's": "why is",
  "how's": "how is"
};
var CONTRACTION_EXPANSIONS = new Set(Object.values(CONTRACTION_MAP));
var EXPANSION_TO_CONTRACTION = new Map(
  Object.entries(CONTRACTION_MAP).map(([contraction, expansion]) => [expansion, contraction])
);

// ../open-arabic/utils/arabicAnalysis/normalization.ts
var ALEF_VARIANTS_REGEX = /[إآٱ]/g;
function foldAlefVariants(text) {
  return text.replace(ALEF_VARIANTS_REGEX, "\u0627");
}
function normalizeArabic(text) {
  const cached = ARABIC_NORMALIZATION_CACHE.get(text);
  if (cached !== void 0) {
    return cached;
  }
  const normalized = foldAlefVariants(text).replace(UNICODE_FORMAT_REGEX, "").replace(DIACRITIC_REGEX_GLOBAL, "").trim();
  cacheWithFifoEviction(ARABIC_NORMALIZATION_CACHE, text, normalized);
  return normalized;
}
var ALTERNATIVE_SEPARATOR_REGEX = /\//g;
function normalizeEnglish(text) {
  const cached = ENGLISH_NORMALIZATION_CACHE.get(text);
  if (cached !== void 0) {
    return cached;
  }
  const normalized = text.toLowerCase().replace(ALTERNATIVE_SEPARATOR_REGEX, " ").replace(NON_WORD_REGEX, "").trim();
  cacheWithFifoEviction(ENGLISH_NORMALIZATION_CACHE, text, normalized);
  return normalized;
}
var CONTRACTION_REGEXES = Object.entries(CONTRACTION_MAP).map(([contraction, expansion]) => ({
  regex: new RegExp(`\\b${contraction}\\b`, "g"),
  expansion
}));
function expandContractions(text) {
  const lower = text.toLowerCase();
  if (!lower.includes("'")) {
    return lower;
  }
  let expanded = lower;
  for (const { regex, expansion } of CONTRACTION_REGEXES) {
    regex.lastIndex = 0;
    expanded = expanded.replace(regex, expansion);
  }
  return expanded;
}

// ../open-arabic/utils/list.ts
function isOneOf(list, value) {
  return list.some((member) => member === value);
}

// ../open-arabic/utils/arabicAnalysis/validation.ts
var WEAK_LETTER_SET = new Set(VALIDATION_CONFIG.WEAK_LETTERS);
function countConsonants(text) {
  let count = 0;
  for (const char of text) {
    if (!WEAK_LETTER_SET.has(char)) {
      count++;
    }
  }
  return count;
}
function hasSubstantialStructure(text, minLength, minConsonants) {
  return text.length >= minLength && countConsonants(text) >= minConsonants;
}
function isSubjectMarker(pattern) {
  return isOneOf(VALIDATION_CONFIG.SUBJECT_MARKERS, pattern);
}
function isFutureOrNegationPrefix(pattern) {
  return isOneOf(VALIDATION_CONFIG.FUTURE_TENSE_PREFIXES, pattern) || isOneOf(VALIDATION_CONFIG.NEGATION_PREFIXES, pattern);
}
function isHighRiskSuffix(pattern) {
  return isOneOf(VALIDATION_CONFIG.HIGH_RISK_SUFFIXES, pattern);
}
function isHighRiskPreposition(pattern) {
  return isOneOf(VALIDATION_CONFIG.HIGH_RISK_PREPOSITIONS, pattern);
}
function isFormWithSuffixPattern(arabicMatch) {
  return isOneOf(VALIDATION_CONFIG.PREPOSITIONS_WITH_SUFFIXES, arabicMatch);
}
var SHORTENED_FORMS = {
  \u0639\u0644\u064A: "\u0639\u0644",
  \u0639\u0644\u0649: "\u0639\u0644",
  \u0644\u062F\u064A: "\u0644\u062F",
  \u0644\u062F\u0649: "\u0644\u062F",
  \u0625\u0644\u064A: "\u0625\u0644",
  \u0625\u0644\u0649: "\u0625\u0644"
};
function getShortenedPrepositionForm(fullForm) {
  return SHORTENED_FORMS[fullForm];
}

// ../open-arabic/utils/arabicAnalysis/edgeCases.ts
function isSingleStandaloneComponent(analysis, normalizedArabic) {
  const componentCount = analysis.prefixes.length + (analysis.suffix ? 1 : 0) + (analysis.infix ? 1 : 0) + (analysis.diacritic ? 1 : 0);
  if (componentCount !== 1) {
    return false;
  }
  if (analysis.prefixes.length === 1) {
    const prefix = analysis.prefixes[0];
    if (normalizeArabic(prefix?.arabicMatch ?? "") === normalizedArabic) {
      return true;
    }
  }
  return false;
}

// ../open-arabic/utils/arabicAnalysis/englishMatching.ts
function shouldRejectWholeTranslationMatch(candidate, normalizedEnglish, tokenCount, arabicWord, componentPattern) {
  if (tokenCount === 1) {
    return false;
  }
  if (candidate !== normalizedEnglish) {
    return false;
  }
  if (candidate.includes(" ")) {
    return false;
  }
  if (arabicWord && componentPattern) {
    const normalizedArabicWord = normalizeArabic(arabicWord);
    const isStandaloneParticle = normalizedArabicWord.length === componentPattern.length;
    return !isStandaloneParticle;
  }
  return true;
}
function hasEnglishMatch(english, patterns, arabicWord, componentPattern) {
  const expandedEnglish = expandContractions(english);
  const norm = normalizeEnglish(expandedEnglish);
  const tokens = norm.split(WHITESPACE_REGEX).filter(Boolean);
  const unigrams = new Set(tokens);
  let bigrams = null;
  let trigrams = null;
  const matches = [];
  for (const raw of patterns) {
    const candidate = normalizeEnglish(raw);
    if (shouldRejectWholeTranslationMatch(
      candidate,
      norm,
      tokens.length,
      arabicWord,
      componentPattern
    )) {
      continue;
    }
    if (candidate.includes(" ")) {
      if (bigrams === null || trigrams === null) {
        bigrams = new Set(
          tokens.map((_, i) => i + 1 < tokens.length ? `${tokens[i]} ${tokens[i + 1]}` : "").filter(Boolean)
        );
        trigrams = new Set(
          tokens.map(
            (_, i) => i + 2 < tokens.length ? `${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}` : ""
          ).filter(Boolean)
        );
      }
      if (bigrams !== null && trigrams !== null) {
        if (bigrams.has(candidate) || trigrams.has(candidate)) {
          matches.push(raw);
        }
      }
    } else {
      if (unigrams.has(candidate)) {
        matches.push(raw);
      }
    }
  }
  return matches;
}

// ../open-arabic/utils/arabicAnalysis/componentDetection.ts
var THE_WORD_REGEX = /\bthe\b/;
var FUSED_AL_WORDS = /* @__PURE__ */ new Set([
  "\u0627\u0644\u0644\u0647",
  // Allah / God — proper noun
  "\u0627\u0644\u0644\u0647\u0645",
  // O Allah — fused vocative
  "\u0627\u0644\u0630\u064A",
  // who / which — relative pronoun
  "\u0627\u0644\u0630\u064A\u0646",
  // those who — plural relative pronoun
  "\u0627\u0644\u062A\u064A",
  // who / which (feminine) — relative pronoun
  "\u0627\u0644\u0644\u0627\u062A\u064A",
  // those (feminine plural) — relative pronoun
  "\u0627\u0644\u0644\u0648\u0627\u062A\u064A",
  // those (feminine plural) — relative pronoun
  "\u0627\u0644\u0644\u0630\u0627\u0646",
  // those two (masculine dual) — relative pronoun
  "\u0627\u0644\u0644\u062A\u0627\u0646",
  // those two (feminine dual) — relative pronoun
  // Hamza-on-alef forms that look like ال after normalization (إ/آ/ٱ → ا).
  // The matcher receives already-normalized input and cannot tell these apart
  // from genuine ال-prefixed words, so we list them explicitly.
  "\u0627\u0644",
  // ← آل, "family / came to" — the whole word, no stem
  "\u0627\u0644\u0649",
  // ← إلى, preposition "to"
  "\u0627\u0644\u064A",
  // ← إليّ, "to me"
  "\u0627\u0644\u064A\u0647",
  // ← إليه, "to him"
  "\u0627\u0644\u064A\u0647\u0627",
  // ← إليها, "to her/it"
  "\u0627\u0644\u064A\u0647\u0645",
  // ← إليهم, "to them"
  "\u0627\u0644\u064A\u0647\u0645\u0627",
  // ← إليهما, "to them both"
  "\u0627\u0644\u064A\u0647\u0646",
  // ← إليهن, "to them (f)"
  "\u0627\u0644\u064A\u0643",
  // ← إليك, "to you"
  "\u0627\u0644\u064A\u0643\u0645",
  // ← إليكم, "to you all"
  "\u0627\u0644\u064A\u0643\u0645\u0627",
  // ← إليكما, "to you both"
  "\u0627\u0644\u064A\u0646\u0627",
  // ← إلينا, "to us"
  "\u0627\u0644\u0627",
  // ← إلا, "except"
  "\u0627\u0644\u0647",
  // ← إله, "god"
  "\u0627\u0644\u0647\u0627",
  // ← إلها, "god" (acc)
  "\u0627\u0644\u0647\u064A"
  // ← إلهي, "my god"
]);
function hasNonArticleAlef(originalArabic) {
  if (!originalArabic) return false;
  const first = originalArabic[0];
  if (first === "\u0623" || first === "\u0625" || first === "\u0622") return true;
  return first === "\u0627" && originalArabic[1] === "\u0650";
}
var ENGLISH_TOKEN_REGEX = /\s+/;
var SHORTENED_PREPOSITION_FORMS = /* @__PURE__ */ new Set(["\u0639\u0644", "\u0625\u0644", "\u0644\u062F", "\u062D\u062A"]);
function findComponent(arabic, english, components, type) {
  for (const component of components) {
    const pattern = component.arabic;
    let matches = false;
    if (type === ComponentType.PREFIX) {
      matches = arabic.startsWith(foldAlefVariants(pattern));
    } else if (type === ComponentType.SUFFIX) {
      matches = arabic.endsWith(pattern);
    } else if (type === ComponentType.INFIX) {
      const index = arabic.indexOf(pattern);
      matches = index > 0 && index < arabic.length - pattern.length;
      if (matches && pattern === "\u0633\u062A") {
        const preceding = index > 0 ? arabic[index - 1] : "";
        if (preceding !== "\u0627") {
          matches = false;
        }
      }
    } else if (type === ComponentType.DIACRITIC) {
      matches = arabic.trim().endsWith(pattern);
      if (matches && pattern === "\u064E\u0627" && normalizeArabic(arabic).length < 3) {
        matches = false;
      }
    }
    if (matches && type === ComponentType.PREFIX && pattern === "\u0627\u0644" && FUSED_AL_WORDS.has(arabic)) {
      matches = false;
    }
    if (matches && type === ComponentType.PREFIX && SHORTENED_PREPOSITION_FORMS.has(pattern) && arabic[foldAlefVariants(pattern).length] !== "\u064A") {
      matches = false;
    }
    if (matches && type === ComponentType.PREFIX) {
      if (isSubjectMarker(pattern)) {
        const remaining = arabic.slice(pattern.length);
        if (!hasSubstantialStructure(
          remaining,
          VALIDATION_CONFIG.PREFIX_VALIDATION.MIN_REMAINING_LENGTH,
          VALIDATION_CONFIG.PREFIX_VALIDATION.MIN_CONSONANTS
        )) {
          matches = false;
        }
      }
      if (isHighRiskPreposition(pattern)) {
        const remaining = arabic.slice(pattern.length);
        const knownParticles = ["\u0645\u0627", "\u0645\u0646", "\u0646"];
        const isParticleCombination = knownParticles.includes(remaining);
        if (!isParticleCombination) {
          if (!hasSubstantialStructure(
            remaining,
            VALIDATION_CONFIG.PREFIX_VALIDATION.MIN_REMAINING_LENGTH,
            VALIDATION_CONFIG.PREFIX_VALIDATION.MIN_CONSONANTS
          )) {
            matches = false;
          }
        }
      }
    }
    if (matches && type === ComponentType.SUFFIX) {
      if (isHighRiskSuffix(pattern)) {
        const remaining = arabic.slice(0, arabic.length - pattern.length);
        const isPrefixSuffixCompound = remaining.length === 0;
        const isLikelyPrefixOnly = remaining.length === 1;
        if (!isLikelyPrefixOnly && !isPrefixSuffixCompound) {
          const startsWithSubjectMarker = isSubjectMarker(remaining.charAt(0));
          const possessivePronouns = ["my", "your", "his", "her", "its", "our", "their"];
          const objectPronouns = ["me", "him", "her", "them", "us"];
          const englishWords = english.toLowerCase().split(/\s+/);
          const hasPossessivePronoun = englishWords.some((word) => possessivePronouns.includes(word));
          const hasObjectPronoun = englishWords.some((word) => objectPronouns.includes(word));
          const hasHiddenPrefix = startsWithSubjectMarker && remaining.length <= 3 && !hasPossessivePronoun;
          const minLengthRequired = hasHiddenPrefix ? VALIDATION_CONFIG.SUFFIX_VALIDATION.HIDDEN_PREFIX_MIN_LENGTH : VALIDATION_CONFIG.SUFFIX_VALIDATION.MIN_REMAINING_LENGTH;
          const minLengthSatisfied = remaining.length >= minLengthRequired;
          const minConsonantsRequired = remaining.length === 2 ? VALIDATION_CONFIG.SUFFIX_VALIDATION.MIN_CONSONANTS_2CHAR : hasPossessivePronoun || hasObjectPronoun ? VALIDATION_CONFIG.SUFFIX_VALIDATION.MIN_CONSONANTS_2CHAR : VALIDATION_CONFIG.SUFFIX_VALIDATION.MIN_CONSONANTS_3PLUS;
          const hasEnoughConsonants = countConsonants(remaining) >= minConsonantsRequired;
          const potentialFa3eelPattern = pattern === "\u0647" && remaining.length === 3 && remaining.charAt(2) === "\u064A";
          const isKnownPreposition = isFormWithSuffixPattern(remaining);
          const isFa3eelPattern = potentialFa3eelPattern && !isKnownPreposition;
          if (!minLengthSatisfied || !hasEnoughConsonants || isFa3eelPattern) {
            matches = false;
          }
        }
      }
    }
    if (matches) {
      const englishMatches = hasEnglishMatch(english, component.english, arabic, pattern);
      if (englishMatches.length > 0) {
        return {
          component,
          arabicMatch: pattern,
          englishMatches,
          matchedInEnglish: true,
          role: component.role
        };
      }
    }
  }
  return void 0;
}
function resolveOverlap(normalized, prefix, suffix) {
  if (!prefix || !suffix) {
    return { resolvedPrefix: prefix, resolvedSuffix: suffix };
  }
  const prefixEnd = prefix.arabicMatch.length;
  const suffixStart = normalized.length - suffix.arabicMatch.length;
  if (prefixEnd > suffixStart) {
    return prefix.arabicMatch.length >= suffix.arabicMatch.length ? { resolvedPrefix: prefix, resolvedSuffix: void 0 } : { resolvedPrefix: void 0, resolvedSuffix: suffix };
  }
  return { resolvedPrefix: prefix, resolvedSuffix: suffix };
}
function findInfix(remainingArabic, english, prefixes, suffix) {
  const result = findComponent(remainingArabic, english, ARABIC_INFIXES, ComponentType.INFIX);
  if (result) {
    const tokenize = (match) => match.toLowerCase().split(ENGLISH_TOKEN_REGEX);
    const claimedWords = /* @__PURE__ */ new Set();
    const claim = (match) => {
      for (const word of tokenize(match)) claimedWords.add(word);
    };
    for (const prefix of prefixes) {
      for (const match of prefix.englishMatches) claim(match);
    }
    if (suffix) {
      for (const match of suffix.englishMatches) claim(match);
    }
    const allClaimed = result.englishMatches.every(
      (match) => tokenize(match).every((word) => claimedWords.has(word))
    );
    if (allClaimed) {
      return void 0;
    }
  }
  return result;
}
function findDiacritic(arabic, english) {
  return findComponent(arabic, english, ARABIC_DIACRITICS, ComponentType.DIACRITIC);
}
function shouldInjectBracket(normalizedArabic, englishTranslation, originalArabic) {
  const hasDefiniteArticle = normalizedArabic.startsWith("\u0627\u0644") || normalizedArabic.startsWith("\u0628\u0627\u0644") || normalizedArabic.startsWith("\u0644\u0644") || normalizedArabic.startsWith("\u0643\u0627\u0644");
  if (!hasDefiniteArticle) {
    return false;
  }
  const alBearingTail = normalizedArabic.startsWith("\u0644\u0644") ? `\u0627${normalizedArabic.slice(1)}` : normalizedArabic.startsWith("\u0628\u0627\u0644") || normalizedArabic.startsWith("\u0643\u0627\u0644") ? normalizedArabic.slice(1) : normalizedArabic;
  if (FUSED_AL_WORDS.has(alBearingTail)) {
    return false;
  }
  if (hasNonArticleAlef(originalArabic)) {
    return false;
  }
  const textToCheck = originalArabic || normalizedArabic;
  if (/[\u064B\u064C\u064D]/.test(textToCheck)) {
    return false;
  }
  const lowerEnglish = englishTranslation.toLowerCase();
  if (THE_WORD_REGEX.test(lowerEnglish)) {
    return false;
  }
  const skipInjection = normalizedArabic.includes("\u0627\u0644\u0644\u0647") || lowerEnglish.includes("god") || lowerEnglish.includes("allah") || lowerEnglish.includes("lord") || lowerEnglish.includes("creator") || lowerEnglish.includes("most high") || // Gloss already romanizes the article ("al-Sufi", "al-Milal") — injecting
  // "[the]" would double it: "[the] al-Sufi".
  lowerEnglish.includes("al-");
  return !skipInjection;
}
function analyzeDiacriticMatches(diacriticMatches, otherComponents) {
  if (diacriticMatches.length === 0) {
    return { hasUnique: false, overlappingComponent: void 0, overlappingMatches: [] };
  }
  const normalizedDiacriticMatches = diacriticMatches.map((m) => m.toLowerCase());
  let overlappingComponent;
  const overlappingMatches = [];
  for (const component of otherComponents) {
    if (!component?.englishMatches) continue;
    const componentMatchesLower = component.englishMatches.map((m) => m.toLowerCase());
    const overlap = normalizedDiacriticMatches.filter((diacriticMatch) => {
      return componentMatchesLower.some((componentMatch) => {
        if (componentMatch === diacriticMatch) return true;
        return componentMatch.split(/\s+/).some((word) => word === diacriticMatch);
      });
    });
    if (overlap.length > 0) {
      overlappingMatches.push(...overlap);
      if (!overlappingComponent) {
        overlappingComponent = component;
      }
    }
  }
  const hasUnique = normalizedDiacriticMatches.some((m) => !overlappingMatches.includes(m));
  return { hasUnique, overlappingComponent, overlappingMatches };
}
function areGrammaticallyRelated(diacritic, overlappingComponent, overlappingMatches) {
  const diacriticArabic = diacritic.arabicMatch;
  const componentType = overlappingComponent.component.type;
  const normalizedOverlap = overlappingMatches.map((m) => m.toLowerCase());
  if (componentType === ComponentType.SUFFIX) {
    const isPronounSuffix = overlappingComponent.role === GrammaticalRole.POSSESSIVE;
    if (isPronounSuffix) {
      return true;
    }
    const pronounPatterns = ["he", "it", "they", "his", "her", "their", "him", "them"];
    const hasOverlappingPronoun = normalizedOverlap.some((m) => pronounPatterns.includes(m));
    if (hasOverlappingPronoun) {
      return true;
    }
  }
  if (componentType === ComponentType.PREFIX && diacriticArabic === "\u064F") {
    const subjectPatterns = ["he", "she", "it", "they", "you"];
    const hasOverlappingSubject = normalizedOverlap.some((m) => subjectPatterns.includes(m));
    if (hasOverlappingSubject) {
      return true;
    }
  }
  if (componentType === ComponentType.PREFIX && diacriticArabic === "\u0650") {
    const prepositionPatterns = ["from", "in", "with", "to", "by", "for", "of"];
    const hasOverlappingPreposition = normalizedOverlap.some((m) => prepositionPatterns.includes(m));
    if (hasOverlappingPreposition) {
      return true;
    }
  }
  return false;
}

// ../open-arabic/utils/arabicAnalysis/prefixDetection.ts
var POSSESSIVE_INDICATORS = ["my", "me", "of me"];
var SINGLE_LETTER_PREPOSITION_SET = /* @__PURE__ */ new Set(["\u0628", "\u0644", "\u0643", "\u0645"]);
var SINGLE_LETTER_CONJUNCTION_SET = /* @__PURE__ */ new Set(["\u0648", "\u0641", "\u0628", "\u0644"]);
var NON_FATHA_VOWELS = /* @__PURE__ */ new Set(["\u064F", "\u0650", "\u0652"]);
var CONJUNCTION_IN_GLOSS_REGEX = /\b(and|then|so|but|or|nor|yet)\b/i;
function consumeElidedConjunction(remaining, english, originalArabic, iterationCount) {
  if (iterationCount !== 1) return false;
  const first = remaining[0];
  if (first !== "\u0648" && first !== "\u0641") return false;
  if (originalArabic?.[0] !== first) return false;
  if (NON_FATHA_VOWELS.has(originalArabic[1] ?? "")) return false;
  if (CONJUNCTION_IN_GLOSS_REGEX.test(english)) return false;
  const behind = remaining.substring(1);
  if (behind.length < 2) return false;
  const match = findComponent(behind, english, ARABIC_PREFIXES, ComponentType.PREFIX);
  return match?.role === GrammaticalRole.DEFINITE_ARTICLE;
}
function detectPrefixes(normalizedArabic, english, originalArabic) {
  const detectedPrefixes = [];
  let remaining = normalizedArabic;
  let elidedPrefixLength = 0;
  const lowerEnglish = english.toLowerCase();
  const seenRoles = /* @__PURE__ */ new Set();
  let continueDetection = true;
  let iterationCount = 0;
  const MAX_ITERATIONS = 5;
  while (continueDetection && iterationCount < MAX_ITERATIONS) {
    iterationCount++;
    const prefixMatch = findComponent(remaining, english, ARABIC_PREFIXES, ComponentType.PREFIX);
    if (prefixMatch) {
      let role = prefixMatch.component.role || GrammaticalRole.GENERIC;
      let remainingAfterPrefix = remaining.substring(prefixMatch.arabicMatch.length);
      if (isFormWithSuffixPattern(prefixMatch.arabicMatch) && remainingAfterPrefix === "") {
        const hasPossessivePronoun = POSSESSIVE_INDICATORS.some((p) => lowerEnglish.includes(p));
        const hasShadda = originalArabic?.includes("\u0651") ?? false;
        if (hasPossessivePronoun && hasShadda) {
          const shortenedForm = getShortenedPrepositionForm(prefixMatch.arabicMatch);
          if (shortenedForm && remaining.startsWith(shortenedForm)) {
            const shortenedComponent = ARABIC_PREFIXES.find((p) => p.arabic === shortenedForm);
            if (shortenedComponent) {
              const shortenedEnglishMatches = hasEnglishMatch(
                english,
                shortenedComponent.english,
                remaining,
                shortenedForm
              );
              if (shortenedEnglishMatches.length > 0) {
                prefixMatch.component = shortenedComponent;
                prefixMatch.arabicMatch = shortenedForm;
                prefixMatch.englishMatches = shortenedEnglishMatches;
                remainingAfterPrefix = remaining.substring(shortenedForm.length);
                role = shortenedComponent.role || GrammaticalRole.GENERIC;
              }
            }
          }
        }
      }
      if (detectedPrefixes.length === 0 && (prefixMatch.arabicMatch === "\u0648" || prefixMatch.arabicMatch === "\u0641") && originalArabic?.[0] === prefixMatch.arabicMatch && NON_FATHA_VOWELS.has(originalArabic[1] ?? "")) {
        continueDetection = false;
        continue;
      }
      if (detectedPrefixes.length === 0 && role === GrammaticalRole.DEFINITE_ARTICLE && hasNonArticleAlef(originalArabic)) {
        continueDetection = false;
        continue;
      }
      if (role === GrammaticalRole.DEFINITE_ARTICLE && seenRoles.has(GrammaticalRole.DEFINITE_ARTICLE)) {
        continueDetection = false;
        continue;
      }
      if (prefixMatch.arabicMatch.length === 1) {
        const sameLetterAlreadyDetected = detectedPrefixes.some(
          (p) => p.arabicMatch === prefixMatch.arabicMatch
        );
        if (sameLetterAlreadyDetected && prefixMatch.arabicMatch !== "\u0644") {
          continueDetection = false;
          continue;
        }
        if (role === GrammaticalRole.PREPOSITION && SINGLE_LETTER_PREPOSITION_SET.has(prefixMatch.arabicMatch)) {
          const isLamAfterLam = prefixMatch.arabicMatch === "\u0644" && detectedPrefixes.some((p) => p.arabicMatch === "\u0644");
          if (!isLamAfterLam) {
            const hasSingleLetterPreposition = detectedPrefixes.some(
              (p) => p.role === GrammaticalRole.PREPOSITION && p.arabicMatch.length === 1 && SINGLE_LETTER_PREPOSITION_SET.has(p.arabicMatch)
            );
            if (hasSingleLetterPreposition) {
              continueDetection = false;
              continue;
            }
          }
        }
      }
      if (remainingAfterPrefix === "\u0627\u0644") {
        continueDetection = false;
        continue;
      }
      const hasLamPrefix = detectedPrefixes.some((p) => p.arabicMatch === "\u0644");
      const isSingleLamMatch = prefixMatch.arabicMatch === "\u0644";
      const isDivineName = lowerEnglish.includes("god") || lowerEnglish.includes("allah") || lowerEnglish.includes("lord") || remaining.includes("\u0627\u0644\u0644\u0647");
      if (hasLamPrefix && isSingleLamMatch && isDivineName) {
        continueDetection = false;
        continue;
      }
      if (hasLamPrefix && isSingleLamMatch) {
        role = GrammaticalRole.DEFINITE_ARTICLE;
        prefixMatch.englishMatches = ["the"];
      }
      const hasMeemPrefix = detectedPrefixes.some((p) => p.arabicMatch === "\u0645");
      const isMeemMatch = prefixMatch.arabicMatch === "\u0645";
      const isMaMatch = prefixMatch.arabicMatch === "\u0645\u0627";
      if (hasMeemPrefix && isMeemMatch) {
        continueDetection = false;
        continue;
      }
      if (hasMeemPrefix && isMaMatch) {
        continueDetection = false;
        continue;
      }
      const isManMatch = prefixMatch.arabicMatch === "\u0645\u0646";
      if (hasMeemPrefix && isManMatch) {
        continueDetection = false;
        continue;
      }
      if (seenRoles.has(GrammaticalRole.DEFINITE_ARTICLE)) {
        continueDetection = false;
        continue;
      }
      if (isHighRiskPreposition(prefixMatch.arabicMatch)) {
        const normalizedEnglishPhrase = normalizeEnglish(english);
        const words = normalizedEnglishPhrase.split(/\s+/).filter(Boolean);
        const hasEmbeddedOf = prefixMatch.englishMatches.some((match) => {
          const normalizedMatch = normalizeEnglish(match);
          if (normalizedMatch === "of") {
            const matchIndex = words.indexOf("of");
            return matchIndex > 0 && matchIndex < words.length - 1;
          }
          return false;
        });
        if (hasEmbeddedOf) {
          continueDetection = false;
          continue;
        }
      }
      if (isSubjectMarker(prefixMatch.arabicMatch)) {
        if (remainingAfterPrefix.startsWith("\u062A")) {
          continueDetection = false;
        }
        if (detectedPrefixes.some((p) => isFutureOrNegationPrefix(p.arabicMatch))) {
          continueDetection = false;
        }
      }
      const hasSubjectMarker = detectedPrefixes.some((p) => isSubjectMarker(p.arabicMatch));
      if (hasSubjectMarker && SINGLE_LETTER_CONJUNCTION_SET.has(prefixMatch.arabicMatch) && remainingAfterPrefix.length < 3) {
        continueDetection = false;
        continue;
      }
      if (hasSubjectMarker && isFutureOrNegationPrefix(prefixMatch.arabicMatch)) {
        continueDetection = false;
        continue;
      }
      if (prefixMatch.arabicMatch === "\u0641" && prefixMatch.englishMatches.length === 1 && prefixMatch.englishMatches[0]?.toLowerCase() === "for" && detectedPrefixes.some((p) => p.arabicMatch === "\u0628")) {
        continueDetection = false;
        continue;
      }
      if (prefixMatch.arabicMatch === "\u0641" && prefixMatch.englishMatches.length === 1 && prefixMatch.englishMatches[0]?.toLowerCase() === "and" && detectedPrefixes.some((p) => p.arabicMatch === "\u0648")) {
        continueDetection = false;
        continue;
      }
      seenRoles.add(role);
      const analyzedPrefix = {
        ...prefixMatch,
        role,
        position: detectedPrefixes.length
      };
      detectedPrefixes.push(analyzedPrefix);
      remaining = remainingAfterPrefix;
    } else if (consumeElidedConjunction(remaining, english, originalArabic, iterationCount)) {
      remaining = remaining.substring(1);
      elidedPrefixLength = 1;
    } else {
      continueDetection = false;
    }
  }
  if (detectedPrefixes.length === 0) {
    elidedPrefixLength = 0;
  }
  return { prefixes: detectedPrefixes, remainingArabic: remaining, elidedPrefixLength };
}
function calculateRemainingEnglish(originalEnglish, components) {
  const matchedWords = /* @__PURE__ */ new Set();
  const allComponents = [
    ...components.prefixes,
    components.suffix,
    components.infix,
    components.diacritic
  ];
  for (const component of allComponents) {
    component?.englishMatches.forEach((match) => {
      match.toLowerCase().split(/\s+/).forEach((word) => matchedWords.add(word.trim()));
    });
  }
  const words = originalEnglish.toLowerCase().split(/\s+/);
  const remainingWords = words.filter((word) => {
    const trimmed = word.trim();
    return trimmed && !matchedWords.has(trimmed);
  });
  return remainingWords.join(" ");
}

// ../open-arabic/utils/arabicAnalysis/colorSegments.ts
function mapToOriginalPosition(original, normalizedLength, fromEnd = false) {
  let position = fromEnd ? original.length : 0;
  let count = 0;
  if (fromEnd) {
    for (let i = original.length - 1; i >= 0 && count < normalizedLength; i--) {
      const char = original[i];
      if (char && !DIACRITIC_REGEX.test(char)) {
        count++;
      }
      position = i;
    }
  } else {
    let i = 0;
    for (; i < original.length && count < normalizedLength; i++) {
      const char = original[i];
      if (char && !DIACRITIC_REGEX.test(char)) {
        count++;
      }
    }
    while (i < original.length) {
      const nextChar = original[i];
      if (nextChar && DIACRITIC_REGEX.test(nextChar)) {
        i++;
        continue;
      }
      break;
    }
    position = i;
  }
  return position;
}
function getComponentColorName(component, defaultType) {
  if (!component) {
    return COMPONENT_TYPE_CONFIG[defaultType].colorName;
  }
  return component.role ? GRAMMATICAL_ROLE_COLORS[component.role] : COMPONENT_TYPE_CONFIG[defaultType].colorName;
}
function deduplicateColor(colorName, usedColors, fallbackType) {
  if (!usedColors.has(colorName)) {
    usedColors.add(colorName);
    return colorName;
  }
  const fallback = COMPONENT_TYPE_CONFIG[fallbackType].colorName;
  usedColors.add(fallback);
  return fallback;
}
function getDiacriticColorName(diacritic, analysis, _usedColors) {
  if (!diacritic) return "text";
  if (diacritic.inheritColorFrom === ComponentType.SUFFIX && analysis?.suffix) {
    return getComponentColorName(analysis.suffix, ComponentType.SUFFIX);
  }
  if (diacritic.inheritColorFrom === ComponentType.PREFIX && analysis?.prefixes) {
    const prefix = analysis.prefixes.at(-1);
    return getComponentColorName(prefix, ComponentType.PREFIX);
  }
  if (diacritic.inheritColorFrom) {
    return COMPONENT_TYPE_CONFIG[diacritic.inheritColorFrom].colorName;
  }
  return COMPONENT_TYPE_CONFIG[ComponentType.DIACRITIC].colorName;
}
function addInfixToSegments(remainingText, infixArabic, infixColorName, segments) {
  const normalizedRemaining = normalizeArabic(remainingText);
  const infixIndex = normalizedRemaining.indexOf(infixArabic);
  const infixStart = infixIndex > 0 ? mapToOriginalPosition(remainingText, infixIndex) : 0;
  if (infixStart > 0) {
    segments.push({
      text: remainingText.substring(0, infixStart),
      colorName: "arabicText",
      type: "root"
    });
  }
  const infixEnd = mapToOriginalPosition(remainingText, infixIndex + infixArabic.length);
  segments.push({
    text: remainingText.substring(infixStart, infixEnd),
    colorName: infixColorName,
    type: "infix"
  });
  return infixEnd;
}
function splitWithDiacritic(text, mainColorName, mainType, analysis, usedColors) {
  if (analysis.diacritic && text.endsWith(analysis.diacritic.arabicMatch)) {
    const mainText = text.substring(0, text.length - analysis.diacritic.arabicMatch.length);
    const segments = [];
    if (mainText) {
      segments.push({ text: mainText, colorName: mainColorName, type: mainType });
    }
    segments.push({
      text: analysis.diacritic.arabicMatch,
      colorName: getDiacriticColorName(analysis.diacritic, analysis, usedColors),
      type: "diacritic"
    });
    return segments;
  }
  return [{ text, colorName: mainColorName, type: mainType }];
}
function reconstructWithColors(analysis) {
  const segments = [];
  const { arabic } = analysis.original;
  let processed = 0;
  const usedColors = /* @__PURE__ */ new Set();
  if (analysis.elidedPrefixLength) {
    const elidedEnd = mapToOriginalPosition(arabic, analysis.elidedPrefixLength);
    segments.push({
      text: arabic.substring(0, elidedEnd),
      colorName: "arabicText",
      type: "root"
    });
    processed = elidedEnd;
  }
  if (analysis.prefixes && analysis.prefixes.length > 0) {
    for (let i = 0; i < analysis.prefixes.length; i++) {
      const prefix = analysis.prefixes[i];
      if (!prefix) continue;
      const prefixLength = prefix.arabicMatch.length;
      const isLastPrefix = i === analysis.prefixes.length - 1;
      let originalEnd;
      if (isLastPrefix && !analysis.remainingArabic && !analysis.suffix) {
        originalEnd = arabic.length;
      } else {
        const mappedEnd = mapToOriginalPosition(arabic.substring(processed), prefixLength) + processed;
        originalEnd = Math.min(mappedEnd, arabic.length);
      }
      const baseColor = getComponentColorName(prefix, ComponentType.PREFIX);
      const colorName = deduplicateColor(baseColor, usedColors, ComponentType.PREFIX);
      segments.push({
        text: arabic.substring(processed, originalEnd),
        colorName,
        type: "prefix"
      });
      processed = originalEnd;
    }
  }
  const infixColorName = COMPONENT_TYPE_CONFIG[ComponentType.INFIX].colorName;
  if (analysis.infix && analysis.suffix) {
    const suffixOriginalStart = mapToOriginalPosition(
      arabic,
      analysis.suffix.arabicMatch.length,
      true
    );
    const remainingText = arabic.substring(processed, suffixOriginalStart);
    const infixEnd = addInfixToSegments(
      remainingText,
      analysis.infix.arabicMatch,
      infixColorName,
      segments
    );
    if (infixEnd < remainingText.length) {
      segments.push({
        text: remainingText.substring(infixEnd),
        colorName: "arabicText",
        type: "root"
      });
    }
    segments.push(
      ...splitWithDiacritic(
        arabic.substring(suffixOriginalStart),
        getComponentColorName(analysis.suffix, ComponentType.SUFFIX),
        "suffix",
        analysis,
        usedColors
      )
    );
  } else if (analysis.infix) {
    const remainingText = arabic.substring(processed);
    const infixEnd = addInfixToSegments(
      remainingText,
      analysis.infix.arabicMatch,
      infixColorName,
      segments
    );
    if (infixEnd < remainingText.length) {
      segments.push(
        ...splitWithDiacritic(
          remainingText.substring(infixEnd),
          "arabicText",
          "root",
          analysis,
          usedColors
        )
      );
    }
  } else if (analysis.suffix) {
    const originalStart = mapToOriginalPosition(arabic, analysis.suffix.arabicMatch.length, true);
    if (originalStart > processed) {
      segments.push({
        text: arabic.substring(processed, originalStart),
        colorName: "arabicText",
        type: "root"
      });
    }
    const suffixText = arabic.substring(originalStart);
    segments.push(
      ...splitWithDiacritic(
        suffixText,
        getComponentColorName(analysis.suffix, ComponentType.SUFFIX),
        "suffix",
        analysis,
        usedColors
      )
    );
  } else if (processed < arabic.length && analysis.remainingArabic) {
    const remainingText = arabic.substring(processed);
    segments.push(...splitWithDiacritic(remainingText, "arabicText", "root", analysis, usedColors));
  }
  if (analysis.diacritic && segments.length === 0) {
    segments.push(...splitWithDiacritic(arabic, "arabicText", "root", analysis, usedColors));
  }
  if (segments.length === 0) {
    segments.push({ text: arabic, colorName: "arabicText", type: "root" });
  }
  return { segments, totalText: arabic };
}
function formatWordAnalysis(analysis) {
  const englishForDisplay = analysis.original.english;
  const title = `${analysis.original.arabic} \u2192 ${englishForDisplay}`;
  const reconstructedArabic = analysis.hasComponents ? reconstructWithColors(analysis) : void 0;
  const sections = [{ type: "original", content: englishForDisplay }];
  const segmentColorByType = /* @__PURE__ */ new Map();
  if (reconstructedArabic) {
    for (const seg2 of reconstructedArabic.segments) {
      const list = segmentColorByType.get(seg2.type) || [];
      list.push(seg2.colorName);
      segmentColorByType.set(seg2.type, list);
    }
  }
  const hasDiacriticSegment = segmentColorByType.has("diacritic");
  const hasSuffixSegment = segmentColorByType.has("suffix");
  const typeIndex = /* @__PURE__ */ new Map();
  function getSegmentColor(type, fallback) {
    const colors = segmentColorByType.get(type);
    if (!colors) return fallback;
    const idx = typeIndex.get(type) || 0;
    typeIndex.set(type, idx + 1);
    return colors[idx] ?? fallback;
  }
  if (analysis.prefixes) {
    analysis.prefixes.forEach((prefix) => {
      const fallbackColor = getComponentColorName(prefix, ComponentType.PREFIX);
      sections.push({
        type: "components",
        arabicPart: prefix.arabicMatch,
        englishPart: prefix.englishMatches.join(" / "),
        colorName: getSegmentColor("prefix", fallbackColor),
        icon: COMPONENT_TYPE_CONFIG[ComponentType.PREFIX].icon
      });
    });
  }
  if (analysis.infix) {
    const fallbackColor = COMPONENT_TYPE_CONFIG[ComponentType.INFIX].colorName;
    sections.push({
      type: "components",
      arabicPart: analysis.infix.arabicMatch,
      englishPart: analysis.infix.englishMatches.join(" / "),
      colorName: getSegmentColor("infix", fallbackColor),
      icon: COMPONENT_TYPE_CONFIG[ComponentType.INFIX].icon
    });
  }
  if (analysis.suffix && hasSuffixSegment) {
    const fallbackColor = getComponentColorName(analysis.suffix, ComponentType.SUFFIX);
    sections.push({
      type: "components",
      arabicPart: analysis.suffix.arabicMatch,
      englishPart: analysis.suffix.englishMatches.join(" / "),
      colorName: getSegmentColor("suffix", fallbackColor),
      icon: COMPONENT_TYPE_CONFIG[ComponentType.SUFFIX].icon
    });
  }
  if (analysis.diacritic && hasDiacriticSegment) {
    const diacriticFallback = COMPONENT_TYPE_CONFIG[ComponentType.DIACRITIC].colorName;
    const diacriticColor = getSegmentColor("diacritic", diacriticFallback);
    const parentSection = sections.find(
      (s) => s.type === "components" && s.colorName === diacriticColor
    );
    if (parentSection) {
      parentSection.arabicPart = (parentSection.arabicPart || "") + analysis.diacritic.arabicMatch;
      const existing = new Set((parentSection.englishPart || "").split(" / "));
      for (const e of analysis.diacritic.englishMatches) {
        if (!existing.has(e)) {
          parentSection.englishPart = parentSection.englishPart ? `${parentSection.englishPart} / ${e}` : e;
        }
      }
    } else {
      sections.push({
        type: "components",
        arabicPart: analysis.diacritic.arabicMatch,
        englishPart: analysis.diacritic.englishMatches.join(" / "),
        colorName: diacriticColor,
        icon: COMPONENT_TYPE_CONFIG[ComponentType.DIACRITIC].icon
      });
    }
  }
  if (analysis.remainingArabic && analysis.remainingEnglish) {
    sections.push({
      type: "root",
      arabicPart: analysis.remainingArabic,
      englishPart: analysis.remainingEnglish,
      colorName: "text",
      icon: "\u2192"
    });
  }
  return { title, reconstructedArabic, sections };
}

// ../open-arabic/utils/arabicAnalysis/validationConstants.ts
var MIN_REMAINING_LENGTH = {
  /**
   * Minimum root length for high-risk suffix validation
   *
   * Rationale: Arabic roots are typically 3+ letters. If removing a high-risk suffix
   * (ה, הא, י, כ) leaves < 3 chars, it's likely a false positive where the "suffix"
   * is actually part of the root.
   *
   * Examples:
   * - "כרה" → "he hates" - removing ה leaves "כר" (2 chars) = FALSE POSITIVE
   * - "כתבה" → "he wrote it" - removing ה leaves "כתב" (3 chars) = VALID
   */
  HIGH_RISK_SUFFIX: 3,
  /**
   * Minimum root length for subject marker validation
   *
   * Rationale: When a subject marker prefix (ي/ת/ن/أ) is detected and remaining
   * is ≤ 3 chars, check if English contains subject pronoun. Short remaining text
   * makes it more likely the "marker" is actually a root letter.
   *
   * Examples:
   * - "يوم" → "day" - ي looks like subject marker but no "he" in English = FALSE POSITIVE
   * - "يكتب" → "he writes" - ي is subject marker, "he" in English = VALID
   */
  SUBJECT_MARKER: 3,
  /**
   * Minimum root length after prefix detection
   *
   * Rationale: After removing prefixes, remaining text should be ≥ 3 chars
   * to be considered a valid root. Shorter remainders suggest over-aggressive
   * prefix detection.
   *
   * Note: This is a soft threshold - some valid prefix+suffix compounds may have
   * 0-2 char remainders (e.g., "מנא" = "from what" = preposition + interrogative).
   */
  AFTER_PREFIX: 3,
  /**
   * Minimum text length for infix detection
   *
   * Rationale: Infixes appear within roots. Text must be > 2 chars to potentially
   * contain an infix (at least 1 char before + infix + 1 char after).
   */
  INFIX_DETECTION: 2,
  /**
   * Maximum remaining length for prefix-only detection
   *
   * Rationale: When remaining text after prefix is ≤ 1 char, the word is likely
   * a standalone prefix/particle with no root. Used in prefix validation to prevent
   * false prefix detection on actual roots.
   */
  PREFIX_ONLY: 1
};
var OVERLAP_REJECTION = {
  /**
   * Critical remaining length for overlap rejection
   *
   * Rationale: If prefix and suffix overlap and removing the suffix would leave
   * exactly 2 chars of remaining text, this is likely a false positive suffix.
   * Real roots are typically 3+ chars.
   *
   * Examples:
   * - "يכרה" → "he hates" - prefix ي + suffix ה overlap, removing ה leaves "כר" (2 chars)
   *   → Reject suffix as false positive
   * - "يכתבה" → "he wrote it" - removing ה leaves "כתב" (3 chars) → Keep suffix
   *
   * Exception: If remaining is 0-1 chars, allow it (valid prefix+suffix compound
   * with no root, like "מנא" = "from what").
   */
  CRITICAL_LENGTH: 2
};

// ../open-arabic/constants/translationNormalizations.ts
var TRANSLATION_NORMALIZATION_RULES = [
  {
    arabic: "\u0648\u0644\u0627",
    normalizedEnglish: "and not",
    description: "\u0648 (and) + \u0644\u0627 (not)"
  },
  {
    arabic: "\u0641\u0644\u0627",
    normalizedEnglish: "so not",
    description: "\u0641 (so) + \u0644\u0627 (not)"
  },
  {
    arabic: "\u0648\u0644\u0645",
    normalizedEnglish: "and did not",
    description: "\u0648 (and) + \u0644\u0645 (did not)"
  },
  {
    arabic: "\u0641\u0644\u0645",
    normalizedEnglish: "so did not",
    description: "\u0641 (so) + \u0644\u0645 (did not)"
  },
  {
    arabic: "\u0648\u0644\u0646",
    normalizedEnglish: "and will not",
    description: "\u0648 (and) + \u0644\u0646 (will not)"
  },
  {
    arabic: "\u0641\u0644\u0646",
    normalizedEnglish: "so will not",
    description: "\u0641 (so) + \u0644\u0646 (will not)"
  },
  {
    arabic: "\u0648\u0628\u0627\u0644",
    normalizedEnglish: "and with the",
    description: "\u0648 (and) + \u0628 (with) + \u0627\u0644 (the)"
  },
  {
    arabic: "\u0641\u0628\u0627\u0644",
    normalizedEnglish: "so with the",
    description: "\u0641 (so) + \u0628 (with) + \u0627\u0644 (the)"
  },
  {
    arabic: "\u0648\u0644\u0644",
    normalizedEnglish: "and for the",
    description: "\u0648 (and) + \u0644 (for) + \u0627\u0644 (the)"
  },
  {
    arabic: "\u0641\u0644\u0644",
    normalizedEnglish: "so for the",
    description: "\u0641 (so) + \u0644 (for) + \u0627\u0644 (the)"
  },
  {
    arabic: "\u0645\u0645\u0627",
    normalizedEnglish: "for what",
    description: '\u0645\u0646 (from) + \u0645\u0627 (what) - normalized to "for what"'
  },
  {
    arabic: "\u0641\u0645\u0646",
    normalizedEnglish: "so whoever",
    description: "\u0641 (so) + \u0645\u0646 (whoever)"
  },
  {
    arabic: "\u0648\u0645\u0646",
    normalizedEnglish: "and whoever",
    description: "\u0648 (and) + \u0645\u0646 (whoever)"
  },
  {
    arabic: "\u0628\u0645\u0627",
    normalizedEnglish: "with what",
    description: "\u0628 (with) + \u0645\u0627 (what)"
  },
  {
    arabic: "\u0641\u0625\u0646",
    normalizedEnglish: "so indeed",
    description: "\u0641 (so) + \u0625\u0646 (indeed)"
  },
  {
    arabic: "\u0648\u0625\u0646",
    normalizedEnglish: "and indeed",
    description: "\u0648 (and) + \u0625\u0646 (indeed)"
  },
  // NOTE: فقد intentionally EXCLUDED — ambiguous:
  // فقد = ف+قد (so indeed) OR root فقد (to lose/miss)
  // When used as compound, ف will match "so" and قد will match "indeed" directly.
  {
    arabic: "\u0648\u0642\u062F",
    normalizedEnglish: "and indeed",
    description: "\u0648 (and) + \u0642\u062F (indeed/already)"
  },
  {
    arabic: "\u0641\u0625\u0630\u0627",
    normalizedEnglish: "so when",
    description: "\u0641 (so) + \u0625\u0630\u0627 (when/if)"
  },
  {
    arabic: "\u0648\u0625\u0630\u0627",
    normalizedEnglish: "and when",
    description: "\u0648 (and) + \u0625\u0630\u0627 (when/if)"
  },
  {
    arabic: "\u0643\u0645\u0627",
    normalizedEnglish: "as for",
    description: "\u0643 (as/like) + \u0645\u0627 (what/for)"
  },
  {
    arabic: "\u0648\u0643\u0645\u0627",
    normalizedEnglish: "and as for",
    description: "\u0648 (and) + \u0643 (as) + \u0645\u0627 (for)"
  },
  {
    arabic: "\u0641\u0643\u0645\u0627",
    normalizedEnglish: "so as for",
    description: "\u0641 (so) + \u0643 (as) + \u0645\u0627 (for)"
  },
  {
    arabic: "\u0641\u0645\u0627",
    normalizedEnglish: "so what",
    description: "\u0641 (so) + \u0645\u0627 (what)"
  },
  {
    arabic: "\u0648\u0645\u0627",
    normalizedEnglish: "and what",
    description: "\u0648 (and) + \u0645\u0627 (what)"
  },
  // Pronoun combinations (conjunction + pronoun)
  {
    arabic: "\u0641\u0647\u0648",
    normalizedEnglish: "so he",
    description: "\u0641 (so) + \u0647\u0648 (he)"
  },
  {
    arabic: "\u0648\u0647\u0648",
    normalizedEnglish: "and he",
    description: "\u0648 (and) + \u0647\u0648 (he)"
  },
  {
    arabic: "\u0641\u0647\u064A",
    normalizedEnglish: "so she",
    description: "\u0641 (so) + \u0647\u064A (she)"
  },
  {
    arabic: "\u0648\u0647\u064A",
    normalizedEnglish: "and she",
    description: "\u0648 (and) + \u0647\u064A (she)"
  },
  // NOTE: فهم and وهم intentionally EXCLUDED — they are ambiguous:
  // فهم = ف+هم (so they) OR root فهم (to understand)
  // وهم = و+هم (and they) OR root وهم (illusion/delusion)
  // When used as compounds, ف/و will match "so/and" and هم will match "they" directly.
  {
    arabic: "\u0641\u0647\u0646",
    normalizedEnglish: "so they",
    description: "\u0641 (so) + \u0647\u0646 (they - feminine)"
  },
  {
    arabic: "\u0648\u0647\u0646",
    normalizedEnglish: "and they",
    description: "\u0648 (and) + \u0647\u0646 (they - feminine)"
  },
  // Preposition + negation combinations
  {
    arabic: "\u0628\u0644\u0627",
    normalizedEnglish: "with no",
    description: "\u0628 (with) + \u0644\u0627 (no)"
  },
  {
    arabic: "\u0641\u0628\u0644\u0627",
    normalizedEnglish: "so with no",
    description: "\u0641 (so) + \u0628 (with) + \u0644\u0627 (no)"
  },
  {
    arabic: "\u0648\u0628\u0644\u0627",
    normalizedEnglish: "and with no",
    description: "\u0648 (and) + \u0628 (with) + \u0644\u0627 (no)"
  }
];
var NORMALIZATION_MAP = new Map(
  TRANSLATION_NORMALIZATION_RULES.map((rule) => [
    // Folded the way normalizeArabic() folds the text it is looked up by
    foldAlefVariants(rule.arabic),
    rule.normalizedEnglish
  ])
);

// ../open-arabic/utils/arabicAnalysis/translationNormalization.ts
function normalizeTranslation(arabicWord, englishTranslation) {
  const normalizedArabic = normalizeArabic(arabicWord);
  const normalizedEnglish = NORMALIZATION_MAP.get(normalizedArabic);
  return normalizedEnglish || englishTranslation;
}

// ../open-arabic/utils/arabicWordAnalysis.ts
var SUBJECT_PRONOUN_SET = /* @__PURE__ */ new Set(["he", "she", "it", "i", "we", "you", "they"]);
var OBJECT_POSSESSIVE_SET = /* @__PURE__ */ new Set([
  "his",
  "her",
  "its",
  "it",
  "my",
  "our",
  "your",
  "you",
  "their",
  "him",
  "me",
  "us",
  "them"
]);
var REGEX_ESCAPE_RE = /[.*+?^${}()|[\]\\]/g;
var escapeRegex = (s) => s.replace(REGEX_ESCAPE_RE, "\\$&");
var TOKEN_BOUNDARY_REGEX_CACHE = /* @__PURE__ */ new Map();
function tokenBoundaryRegex(token, flags) {
  const key = `${flags}:${token}`;
  let re = TOKEN_BOUNDARY_REGEX_CACHE.get(key);
  if (!re) {
    re = new RegExp(`(^|[^\\p{L}])${escapeRegex(token)}([^\\p{L}]|$)`, flags);
    TOKEN_BOUNDARY_REGEX_CACHE.set(key, re);
  }
  return re;
}
function analyzeArabicWord(arabic, english) {
  const normalizedEnglish = normalizeTranslation(arabic, english);
  const normalized = normalizeArabic(arabic);
  const cacheKey = `${arabic}|${normalizedEnglish}`;
  const cachedResult = ANALYSIS_CACHE.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }
  const hasBracketInjection = shouldInjectBracket(normalized, normalizedEnglish, arabic);
  const expandedEnglish = expandContractions(normalizedEnglish);
  if (!shouldApplyColorCoding(expandedEnglish) && !hasBracketInjection) {
    const singleWordResult = {
      original: { arabic, english: normalizedEnglish },
      prefixes: [],
      // No prefixes for single words
      hasComponents: false,
      remainingArabic: normalized,
      remainingEnglish: normalizeEnglish(normalizedEnglish),
      hasBracketInjection
    };
    cacheWithFifoEviction(ANALYSIS_CACHE, cacheKey, singleWordResult);
    return singleWordResult;
  }
  const {
    prefixes: detectedPrefixes,
    remainingArabic: remainingAfterPrefixes,
    elidedPrefixLength
  } = detectPrefixes(
    normalized,
    normalizedEnglish,
    arabic
    // Pass original Arabic for shadda detection
  );
  let suffix = findComponent(
    remainingAfterPrefixes,
    normalizedEnglish,
    ARABIC_SUFFIXES,
    ComponentType.SUFFIX
  );
  if (suffix && detectedPrefixes.length > 0) {
    const prefixEnglishWords = /* @__PURE__ */ new Set();
    detectedPrefixes.forEach((prefix) => {
      prefix.englishMatches.forEach((match) => {
        if (!match.includes(" ")) {
          prefixEnglishWords.add(match.toLowerCase());
        }
      });
    });
    const suffixEnglishWords = new Set(
      suffix.englishMatches.filter((match) => !match.includes(" ")).map((match) => match.toLowerCase())
    );
    const overlappingWords = [...suffixEnglishWords.intersection(prefixEnglishWords)];
    if (overlappingWords.length > 0) {
      const englishTokens = normalizedEnglish.toLowerCase().split(/\s+/);
      const hasRepeatedOverlap = overlappingWords.some(
        (word) => englishTokens.filter((token) => token === word).length >= 2
      );
      if (!hasRepeatedOverlap) {
        const remainingAfterSuffix = remainingAfterPrefixes.substring(
          0,
          remainingAfterPrefixes.length - suffix.arabicMatch.length
        );
        if (remainingAfterSuffix.length === OVERLAP_REJECTION.CRITICAL_LENGTH) {
          suffix = void 0;
        }
      }
    }
  }
  if (suffix && detectedPrefixes.length === 0) {
    const leftover = remainingAfterPrefixes.substring(
      0,
      remainingAfterPrefixes.length - suffix.arabicMatch.length
    );
    if (leftover.length === 0) {
      suffix = void 0;
    }
  }
  if (suffix && isHighRiskSuffix(suffix.arabicMatch)) {
    const remainingAfterSuffix = remainingAfterPrefixes.substring(
      0,
      remainingAfterPrefixes.length - suffix.arabicMatch.length
    );
    const isPrefixSuffixCompound = remainingAfterSuffix.length === 0 && detectedPrefixes.length > 0;
    if (!isPrefixSuffixCompound && remainingAfterSuffix.length < MIN_REMAINING_LENGTH.HIGH_RISK_SUFFIX) {
      const englishWords = normalizedEnglish.toLowerCase().split(/\s+/);
      const hasSubjectPronoun = englishWords.some((word) => SUBJECT_PRONOUN_SET.has(word));
      const hasObjectPossessivePronoun = englishWords.some((word) => OBJECT_POSSESSIVE_SET.has(word));
      if (hasSubjectPronoun && !hasObjectPossessivePronoun) {
        suffix = void 0;
      } else if (hasSubjectPronoun && hasObjectPossessivePronoun) {
        const suffixEnglishWords = suffix.englishMatches.flatMap(
          (match) => match.toLowerCase().split(/\s+/)
        );
        const suffixClaimsObjectPronoun = englishWords.some(
          (word) => OBJECT_POSSESSIVE_SET.has(word) && suffixEnglishWords.includes(word)
        );
        if (!suffixClaimsObjectPronoun) {
          suffix = void 0;
        }
      }
    }
  }
  const diacritic = findDiacritic(arabic, normalizedEnglish);
  const lastPrefix = detectedPrefixes.at(-1);
  const { resolvedPrefix, resolvedSuffix } = resolveOverlap(normalized, lastPrefix, suffix);
  let finalPrefixes = detectedPrefixes;
  if (lastPrefix && !resolvedPrefix) {
    finalPrefixes = detectedPrefixes.slice(0, -1);
  }
  let remaining = remainingAfterPrefixes;
  if (resolvedSuffix)
    remaining = remaining.substring(0, remaining.length - resolvedSuffix.arabicMatch.length);
  const infix = remaining.length > MIN_REMAINING_LENGTH.INFIX_DETECTION ? findInfix(remaining, normalizedEnglish, finalPrefixes, resolvedSuffix) : void 0;
  let resolvedDiacritic;
  if (diacritic) {
    const matchAnalysis = analyzeDiacriticMatches(diacritic.englishMatches, [
      ...finalPrefixes,
      // Include all prefixes
      infix,
      resolvedSuffix
    ]);
    const isPronounSuffixPresent = resolvedSuffix?.role === GrammaticalRole.POSSESSIVE;
    if (isPronounSuffixPresent) {
      resolvedDiacritic = {
        ...diacritic,
        inheritColorFrom: ComponentType.SUFFIX
      };
    } else if (matchAnalysis.hasUnique) {
      resolvedDiacritic = diacritic;
    } else if (matchAnalysis.overlappingComponent) {
      const isRelated = areGrammaticallyRelated(
        diacritic,
        matchAnalysis.overlappingComponent,
        matchAnalysis.overlappingMatches
      );
      if (isRelated) {
        resolvedDiacritic = {
          ...diacritic,
          inheritColorFrom: matchAnalysis.overlappingComponent.component.type
        };
      } else {
        resolvedDiacritic = void 0;
      }
    } else {
      resolvedDiacritic = diacritic;
    }
  }
  const remainingEnglish = calculateRemainingEnglish(normalizedEnglish, {
    prefixes: finalPrefixes,
    suffix: resolvedSuffix,
    infix,
    diacritic: resolvedDiacritic
  });
  const lowerEnglish = expandContractions(normalizedEnglish).toLowerCase();
  const englishContainsAnyMatch = (matches) => matches.some((m) => tokenBoundaryRegex(m.toLowerCase(), "u").test(lowerEnglish));
  const isVisible = (c) => !!c && c.englishMatches.length > 0 && englishContainsAnyMatch(c.englishMatches);
  let visiblePrefixes = finalPrefixes.filter(isVisible);
  let visibleSuffix = isVisible(resolvedSuffix) ? resolvedSuffix : void 0;
  let visibleInfix = isVisible(infix) ? infix : void 0;
  let visibleDiacritic = isVisible(resolvedDiacritic) ? resolvedDiacritic : void 0;
  const countOccurrences = (token) => (lowerEnglish.match(tokenBoundaryRegex(token, "gu")) ?? []).length;
  const remainingOccurrences = /* @__PURE__ */ new Map();
  const ensureToken = (t) => {
    if (!remainingOccurrences.has(t)) remainingOccurrences.set(t, countOccurrences(t));
  };
  const claimOne = (c) => {
    for (const m of c.englishMatches) {
      const t = m.toLowerCase();
      ensureToken(t);
      const remaining2 = remainingOccurrences.get(t) ?? 0;
      if (remaining2 > 0) {
        remainingOccurrences.set(t, remaining2 - 1);
        return true;
      }
    }
    return false;
  };
  const englishFirstToken = lowerEnglish.trim().split(/\s+/)[0] ?? "";
  let suffixClaimedEarly = false;
  if (visibleSuffix) {
    const prefixTokens = new Set(
      visiblePrefixes.flatMap((p) => p.englishMatches.map((m) => m.toLowerCase()))
    );
    const claimables = visibleSuffix.englishMatches.map((m) => m.toLowerCase()).filter((t) => {
      ensureToken(t);
      return (remainingOccurrences.get(t) ?? 0) > 0;
    });
    const allContested = claimables.length > 0 && claimables.every((t) => prefixTokens.has(t));
    const first = claimables[0];
    if (allContested && first && OBJECT_POSSESSIVE_SET.has(first) && first !== englishFirstToken) {
      suffixClaimedEarly = claimOne(visibleSuffix);
    }
  }
  const claimedPrefixes = [];
  for (const p of visiblePrefixes) {
    if (claimOne(p)) claimedPrefixes.push(p);
  }
  visiblePrefixes = claimedPrefixes;
  if (visibleInfix && !claimOne(visibleInfix)) visibleInfix = void 0;
  if (visibleSuffix && !suffixClaimedEarly && !claimOne(visibleSuffix)) visibleSuffix = void 0;
  if (visibleDiacritic) {
    const parentStillVisible = visibleDiacritic.inheritColorFrom === ComponentType.SUFFIX && visibleSuffix || visibleDiacritic.inheritColorFrom === ComponentType.PREFIX && visiblePrefixes.length > 0 || visibleDiacritic.inheritColorFrom === ComponentType.INFIX && visibleInfix;
    if (!parentStillVisible && !claimOne(visibleDiacritic)) {
      visibleDiacritic = void 0;
    }
  }
  const droppedCount = finalPrefixes.length - visiblePrefixes.length + (resolvedSuffix && !visibleSuffix ? 1 : 0) + (infix && !visibleInfix ? 1 : 0);
  let visibleRemaining;
  if (droppedCount === 0) {
    visibleRemaining = remaining;
  } else {
    visibleRemaining = normalized;
    for (const p of visiblePrefixes) {
      visibleRemaining = visibleRemaining.substring(p.arabicMatch.length);
    }
    if (visibleSuffix) {
      visibleRemaining = visibleRemaining.substring(
        0,
        visibleRemaining.length - visibleSuffix.arabicMatch.length
      );
    }
  }
  const isStandalone = isSingleStandaloneComponent(
    {
      prefixes: visiblePrefixes,
      suffix: visibleSuffix,
      infix: visibleInfix,
      diacritic: visibleDiacritic
    },
    normalized
  );
  const result = {
    original: { arabic, english: normalizedEnglish },
    prefixes: visiblePrefixes,
    infix: visibleInfix,
    suffix: visibleSuffix,
    diacritic: visibleDiacritic,
    hasComponents: isStandalone ? false : Boolean(visiblePrefixes.length > 0 || visibleInfix || visibleSuffix || visibleDiacritic),
    remainingArabic: visibleRemaining.trim(),
    remainingEnglish,
    hasBracketInjection,
    // Only meaningful if a prefix behind the elided connective actually survived the
    // visibility filter; otherwise there is nothing to offset and the word renders whole.
    elidedPrefixLength: visiblePrefixes.length > 0 ? elidedPrefixLength : 0
  };
  cacheWithFifoEviction(ANALYSIS_CACHE, cacheKey, result);
  return result;
}

// scripts/analyze-entry.ts
import fs from "node:fs";
// Edited after bundling: input and output are arguments, and rows come from a ship snapshot. Rebuilding needs the app repo (run-analyze.mjs).
var snap = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
var seg = {};
var t0 = Date.now();
var multi = 0;
var single = 0;
var failed = 0;
var markOnly = 0;
var roundtrip = 0;
var MARK = /^[ؐ-ًؚ-ٰٟۖ-ۭ]+$/u;
for (const w of snap.tables.sentence_words) {
  try {
    const norm = normalizeArabic(w.word_form);
    const en = shouldInjectBracket(norm, w.english, w.word_form) ? `[the] ${w.english}` : w.english;
    const a = analyzeArabicWord(w.word_form, en);
    const f = a?.hasComponents ? formatWordAnalysis(a) : null;
    const s = f?.reconstructedArabic?.segments;
    if (s && s.length > 1) {
      multi++;
      seg[w.id] = s.map((x) => ({ t: x.text, c: x.colorName }));
      if (s.map((x) => x.text).join("") !== w.word_form) roundtrip++;
      if (s.some((x) => MARK.test(x.text))) markOnly++;
    } else single++;
  } catch (e) {
    failed++;
  }
}
fs.writeFileSync(process.argv[3], JSON.stringify(seg));
console.log({ ms: Date.now() - t0, multi, single, failed, markOnly, roundtripMismatch: roundtrip });
