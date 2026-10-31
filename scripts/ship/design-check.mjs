import fs from 'node:fs';
import path from 'node:path';
import { bin, fail, rel, ROOT, walk } from './lib.mjs';
import { CSS_PATH, generateTokens, splitDesign, TS_PATH } from './generate-tokens.mjs';

/** The pinned @google/design.md lint: 0 errors, 0 warnings and a token-summary, or the run stops. */
export function lintGate() {
  const result = bin('design.md', ['lint', 'DESIGN.md']);
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    fail(`design.md lint gave no report (exit ${result.status}): ${result.stderr || result.stdout}`);
  }
  const { errors, warnings } = report.summary;
  if (errors !== 0 || warnings !== 0) {
    const detail = report.findings
      .filter((finding) => finding.severity !== 'info')
      .map((finding) => `  ${finding.severity}${finding.rule ? ` ${finding.rule}` : ''}: ${finding.message}`)
      .join('\n');
    fail(`DESIGN.md lint found ${errors} errors and ${warnings} warnings:\n${detail}`);
  }
  const summary = report.findings.find((finding) => finding.rule === 'token-summary');
  if (!summary) fail('DESIGN.md lint printed no token-summary.');
  return summary.message;
}

export function driftCheck() {
  const wanted = generateTokens(fs.readFileSync(path.join(ROOT, 'DESIGN.md'), 'utf8'));
  for (const [file, text] of Object.entries(wanted)) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) fail(`${file} is missing. Run pnpm tokens.`);
    const have = fs.readFileSync(full, 'utf8');
    if (have === text) continue;
    const a = have.split('\n');
    const b = text.split('\n');
    const line = a.findIndex((value, i) => value !== b[i]);
    const at = line === -1 ? b.length : line;
    fail(
      `${file} has drifted from DESIGN.md at line ${at + 1}:\n  file:      ${a[at]?.trim()}\n  generated: ${b[at]?.trim()}\nDon't hand-edit tokens: change DESIGN.md and run pnpm tokens.`,
    );
  }
}

// CSS's named colours. transparent, currentcolor and inherit stay allowed.
const NAMED =
  'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'.split(
    ' ',
  );
const HEX = /(?<![&\w/-])#[0-9a-f]{3,8}\b/gi;
const FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/gi;
const COLOUR_PROPERTY =
  /(?:^|[;{\s"'])(?:color|background(?:-color)?|border(?:-[a-z]+)*|outline(?:-color)?|fill|stroke|box-shadow|text-shadow|caret-color|accent-color|text-decoration(?:-color)?|column-rule(?:-color)?)\s*:\s*([^;}"']*)/gi;
const NAMED_RE = new RegExp(`(?<![-\\w])(?:${NAMED.join('|')})(?![-\\w])`, 'i');
const SCANNED = /\.(css|astro|html|svg|ts|js|mjs|jsx|tsx|md|mdx)$/;

export function findColourLiterals(text, { named = true } = {}) {
  const hits = [];
  const code = text.replace(/\b(?:href|id)=(["'])#?[^"']*\1/gi, '');
  for (const match of code.matchAll(HEX)) hits.push(match[0]);
  for (const match of code.matchAll(FUNCTION)) hits.push(`${match[0]}…)`);
  if (named) {
    for (const match of code.matchAll(COLOUR_PROPERTY)) {
      const hit = match[1].match(NAMED_RE);
      if (hit) hits.push(hit[0]);
    }
  }
  return hits;
}

/** No colour literal below DESIGN.md's front matter, and none anywhere in site source. */
export function colourBan() {
  const problems = [];
  const { body } = splitDesign(fs.readFileSync(path.join(ROOT, 'DESIGN.md'), 'utf8'));
  // The prose talks about black badges and light plates, so only real literals count there.
  for (const hit of findColourLiterals(body, { named: false })) problems.push(`DESIGN.md below the front matter: ${hit}`);

  const generated = new Set([CSS_PATH, TS_PATH]);
  // The store badges are official artwork, used unmodified.
  const files = [...walk(path.join(ROOT, 'src')), ...walk(path.join(ROOT, 'public'))].filter(
    (file) => !/badge-[a-z-]+\.svg$/.test(file) && SCANNED.test(file) && !generated.has(rel(file)),
  );
  for (const file of files) {
    for (const hit of findColourLiterals(fs.readFileSync(file, 'utf8'))) problems.push(`${rel(file)}: ${hit}`);
  }
  if (problems.length > 0) {
    fail(`Colour literals found. Use a token from DESIGN.md instead:\n  ${problems.join('\n  ')}`);
  }
  return files.length;
}
