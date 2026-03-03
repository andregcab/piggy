/** Pie chart: toned-down bright palette (green, orange, pink vibe) */
export const PIE_COLORS = [
  'oklch(0.74 0.14 55)', // orange (app primary vibe)
  'oklch(0.72 0.15 145)', // green (app positive vibe)
  'oklch(0.68 0.15 330)', // pink
  'oklch(0.7 0.16 165)', // teal
  'oklch(0.68 0.15 310)', // magenta
  'oklch(0.66 0.15 200)', // cyan
  'oklch(0.7 0.14 25)', // coral
  'oklch(0.68 0.15 265)', // violet
  'oklch(0.72 0.14 130)', // lime-green
  'oklch(0.66 0.15 350)', // rose
  'oklch(0.7 0.14 185)', // teal
  'oklch(0.68 0.14 230)', // blue
  'oklch(0.72 0.13 85)', // amber
  'oklch(0.66 0.15 290)', // purple
  'oklch(0.7 0.14 180)', // turquoise
  'oklch(0.68 0.14 45)', // gold
];

/** Bar chart: cool (cyan) to hot (coral/orange). Ratio 0–1. Toned-down. */
export function barColorByRatio(ratio: number): string {
  const t = Math.max(0, Math.min(1, ratio));
  const hue = 200 + 130 * t;
  const chroma = 0.14 + 0.03 * t;
  const lightness = 0.66 + 0.06 * t;
  return `oklch(${lightness} ${chroma} ${hue})`;
}
