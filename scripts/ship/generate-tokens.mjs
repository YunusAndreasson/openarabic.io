#!/usr/bin/env node
// Generates the site's design tokens from DESIGN.md. `design.md export` isn't used, per DESIGN.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import { ROOT } from './lib.mjs';

export const CSS_PATH = 'src/styles/tokens.generated.css';
export const TS_PATH = 'src/styles/tokens.generated.ts';

const HEADER = 'Generated from DESIGN.md by `pnpm tokens`. Do not edit: `pnpm ship` stops on any difference.';

export function splitDesign(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('DESIGN.md has no front matter.');
  return { front: parse(match[1]), body: match[2] };
}

/** OKLCH to sRGB, for the one place a hex is required: the theme-color meta. */
export function oklchToHex(value) {
  const match = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/);
  if (!match) throw new Error(`Not an oklch() colour: ${value}`);
  const [L, C, h] = match.slice(1).map(Number);
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const channels = linear.map((x) => {
    const c = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, c)) * 255)
      .toString(16)
      .padStart(2, '0');
  });
  return `#${channels.join('')}`;
}

export function generateTokens(designText) {
  const { front, body } = splitDesign(designText);
  const stacks = body.match(/- Stacks: `([^`]+)` and `([^`]+)`/);
  if (!stacks) throw new Error('DESIGN.md `Typography` no longer has its "Stacks:" line.');
  const stackFor = { Amiri: 'var(--font-arabic)', 'Alegreya Sans': 'var(--font-latin)' };

  const lines = [
    ...Object.entries(front.colors).map(([k, v]) => `--color-${k}: ${v};`),
    `--font-arabic: ${stacks[1]};`,
    `--font-latin: ${stacks[2]};`,
  ];
  for (const [name, t] of Object.entries(front.typography)) {
    if (!stackFor[t.fontFamily]) throw new Error(`Typography ${name} uses an unknown family: ${t.fontFamily}`);
    lines.push(
      `--type-${name}-family: ${stackFor[t.fontFamily]};`,
      `--type-${name}-size: ${t.fontSize};`,
      `--type-${name}-weight: ${t.fontWeight};`,
      `--type-${name}-line-height: ${t.lineHeight};`,
    );
  }
  lines.push(
    ...Object.entries(front.spacing).map(([k, v]) => `--space-${k}: ${v};`),
    ...Object.entries(front.rounded).map(([k, v]) => `--radius-${k}: ${v};`),
    ...Object.entries(front.fluid).map(([k, v]) => `--fluid-${k}: ${v};`),
    ...Object.entries(front['breakpoints-rem']).map(([k, v]) => `--breakpoint-${k}: ${v}rem;`),
    `--ease: ${front.motion.ease};`,
    ...Object.entries(front.motion['duration-ms']).map(([k, v]) => `--duration-${k}: ${v}ms;`),
  );
  const zero = Object.keys(front.motion['duration-ms']).map((k) => `    --duration-${k}: 0ms;`);

  const css = [
    `/* ${HEADER} */`,
    ':root {',
    ...lines.map((line) => `  ${line}`),
    '}',
    '',
    '@media (prefers-reduced-motion: reduce) {',
    '  :root {',
    ...zero,
    '  }',
    '}',
    '',
  ].join('\n');
  const ts = `// ${HEADER}\nexport const themeColorHex = '${oklchToHex(front.colors.surface)}';\n`;
  return { [CSS_PATH]: css, [TS_PATH]: ts };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = generateTokens(fs.readFileSync(path.join(ROOT, 'DESIGN.md'), 'utf8'));
  for (const [file, text] of Object.entries(files)) {
    fs.writeFileSync(path.join(ROOT, file), text);
    console.log(`wrote ${file}`);
  }
}
