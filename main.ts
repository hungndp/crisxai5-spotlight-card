// crisxai5-spotlight — spotlight card generator for the make.fun bounty
// "Spotlight @crisxai5: AI & Crypto Expert on X".
// Renders a crisp vector spotlight card (SVG) and copies POST.json into the
// grader output directory. Node 22, standard library only: no network, no
// wall clock, no files outside the repository, fully deterministic.
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

// Card geometry: 1080 x 1350 (4:5 portrait, phone-first for the X feed).
const CARD_W = 1080;
const CARD_H = 1350;

// Palette: deep-navy terminal background, cyan signal, gold accent.
const INK = "#0a0f1e";
const INK2 = "#101a33";
const PANEL = "#131f3d";
const CYAN = "#22d3ee";
const GOLD = "#fbbf24";
const WHITE = "#f8fafc";
const MUTED = "#94a3b8";
const LINE = "#1e293b";
const DARK_TEXT = "#082f49";

function botDir(): string {
  return process.env.MAKEFUN_BOT_DIR ?? ".";
}

function outDir(): string {
  const dir = process.env.MAKEFUN_OUTPUT_DIR;
  if (!dir) throw new Error("MAKEFUN_OUTPUT_DIR is not set");
  return dir;
}

// Make the output directory and clear only its CONTENTS (never the
// directory itself: the grader runs with a read-only parent).
function prepareOutDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

function copyPost(fromDir: string, toDir: string): void {
  copyFileSync(join(fromDir, "POST.json"), join(toDir, "POST.json"));
}

// --- SVG helpers ---------------------------------------------------------

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// One benefit row: a rounded panel, a drawn vector glyph in a cyan ring,
// a bold title and a one-line payoff. Rows are 120 tall, 940 wide.
function benefitRow(
  y: number,
  glyph: string,
  title: string,
  sub: string,
): string {
  const cy = y + 60;
  return [
    `<rect x="70" y="${y}" width="940" height="120" rx="18" fill="${PANEL}" stroke="${LINE}" stroke-width="2"/>`,
    `<circle cx="140" cy="${cy}" r="36" fill="none" stroke="${CYAN}" stroke-width="3"/>`,
    `<g stroke="${CYAN}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>`,
    `<text x="200" y="${cy - 6}" font-family="Arial, Helvetica, DejaVu Sans, sans-serif" font-size="40" font-weight="bold" fill="${WHITE}">${esc(title)}</text>`,
    `<text x="200" y="${cy + 36}" font-family="Arial, Helvetica, DejaVu Sans, sans-serif" font-size="28" fill="${MUTED}">${esc(sub)}</text>`,
  ].join("\n");
}

// Vector glyphs, each drawn inside the 36px ring centred on (140, cy).
// 1. AI agents: three linked nodes. 2. Crypto alpha: a rising chart.
// 3. Web3 tooling: a hex nut. 4. On-chain automation: a refresh loop.
function glyphAgents(cy: number): string {
  return [
    `<circle cx="126" cy="${cy - 14}" r="6" fill="${CYAN}" stroke="none"/>`,
    `<circle cx="154" cy="${cy - 14}" r="6" fill="${CYAN}" stroke="none"/>`,
    `<circle cx="140" cy="${cy + 14}" r="6" fill="${CYAN}" stroke="none"/>`,
    `<line x1="126" y1="${cy - 14}" x2="154" y2="${cy - 14}"/>`,
    `<line x1="126" y1="${cy - 14}" x2="140" y2="${cy + 14}"/>`,
    `<line x1="154" y1="${cy - 14}" x2="140" y2="${cy + 14}"/>`,
  ].join("\n");
}

function glyphChart(cy: number): string {
  return [
    `<polyline points="118,${cy + 16} 132,${cy + 2} 144,${cy + 8} 162,${cy - 16}"/>`,
    `<polyline points="152,${cy - 16} 162,${cy - 16} 162,${cy - 6}"/>`,
  ].join("\n");
}

function glyphHex(cy: number): string {
  const pts = [
    [140, cy - 20],
    [157, cy - 10],
    [157, cy + 10],
    [140, cy + 20],
    [123, cy + 10],
    [123, cy - 10],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(" ");
  return `<polygon points="${pts}"/><circle cx="140" cy="${cy}" r="7"/>`;
}

function glyphLoop(cy: number): string {
  return [
    `<path d="M 158 ${cy - 12} A 20 20 0 1 1 124 ${cy - 8}"/>`,
    `<polyline points="118,${cy - 24} 122,${cy - 4} 136,${cy - 10}"/>`,
  ].join("\n");
}

// --- The card ------------------------------------------------------------
// Layout (1350 tall, 70px side margins): eyebrow, giant handle, gold rule,
// expert subtitle, two-line hook, four benefit rows, cyan follow pill,
// footer link. Every letter is vector text: crisp at any size, phone or
// desktop, never a blurry raster.
function cardSvg(): string {
  const rows = [
    { title: "AI AGENTS", sub: "Practical agent builds, not hype" },
    { title: "CRYPTO ALPHA", sub: "Signals and setups worth your timeline" },
    { title: "WEB3 TOOLING", sub: "Tools that ship on-chain" },
    { title: "ON-CHAIN AUTOMATION", sub: "Workflows that run while you sleep" },
  ];
  const rowYs = [560, 710, 860, 1010];
  const rowsSvg = rows
    .map((row, i) => {
      const y = rowYs[i];
      const cy = y + 60;
      // Each glyph is drawn relative to its own row centre.
      const glyph =
        i === 0 ? glyphAgents(cy)
        : i === 1 ? glyphChart(cy)
        : i === 2 ? glyphHex(cy)
        : glyphLoop(cy);
      return benefitRow(y, glyph, row.title, row.sub);
    })
    .join("\n");

  const font = "Arial, Helvetica, DejaVu Sans, sans-serif";
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}">`,
    "<defs>",
    `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK2}"/><stop offset="1" stop-color="${INK}"/></linearGradient>`,
    `<radialGradient id="glow" cx="0.85" cy="0.08" r="0.7"><stop offset="0" stop-color="${CYAN}" stop-opacity="0.22"/><stop offset="1" stop-color="${CYAN}" stop-opacity="0"/></radialGradient>`,
    "</defs>",
    `<rect width="${CARD_W}" height="${CARD_H}" fill="url(#bg)"/>`,
    `<rect width="${CARD_W}" height="${CARD_H}" fill="url(#glow)"/>`,
    // Faint terminal grid, low opacity so the text stays the star.
    `<g stroke="${CYAN}" stroke-width="1" opacity="0.07">`,
    [180, 360, 540, 720, 900].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="${CARD_H}"/>`).join("\n"),
    [300, 520, 1180].map((y) => `<line x1="0" y1="${y}" x2="${CARD_W}" y2="${y}"/>`).join("\n"),
    "</g>",
    // Corner ticks: a terminal-frame accent.
    `<g stroke="${CYAN}" stroke-width="4" fill="none" stroke-linecap="round"><path d="M 40 80 V 40 H 80"/><path d="M 1000 40 H 1040 V 80"/><path d="M 40 1270 V 1310 H 80"/><path d="M 1000 1310 H 1040 V 1270"/></g>`,
    `<text x="70" y="118" font-family="${font}" font-size="30" font-weight="bold" letter-spacing="10" fill="${CYAN}">SPOTLIGHT &#183; ON X</text>`,
    `<text x="66" y="232" font-family="${font}" font-size="118" font-weight="bold" fill="${WHITE}">@crisxai5</text>`,
    `<rect x="70" y="262" width="180" height="8" rx="4" fill="${GOLD}"/>`,
    `<text x="70" y="332" font-family="${font}" font-size="40" font-weight="bold" letter-spacing="6" fill="${GOLD}">AI &amp; CRYPTO EXPERT</text>`,
    `<text x="70" y="428" font-family="${font}" font-size="56" font-weight="bold" fill="${WHITE}">The feed where AI agents</text>`,
    `<text x="70" y="496" font-family="${font}" font-size="56" font-weight="bold" fill="${WHITE}">meet crypto alpha.</text>`,
    rowsSvg,
    `<rect x="70" y="1180" width="940" height="96" rx="48" fill="${CYAN}"/>`,
    `<text x="540" y="1242" text-anchor="middle" font-family="${font}" font-size="46" font-weight="bold" fill="${DARK_TEXT}">FOLLOW @crisxai5</text>`,
    `<text x="540" y="1322" text-anchor="middle" font-family="${font}" font-size="28" letter-spacing="4" fill="${MUTED}">x.com/crisxai5</text>`,
    "</svg>",
  ].join("\n");
}

// --- Entry point ---------------------------------------------------------
function main(): void {
  const out = outDir();
  prepareOutDir(out);
  writeFileSync(join(out, "card.svg"), cardSvg(), "utf8");
  copyPost(botDir(), out);
}

main();
