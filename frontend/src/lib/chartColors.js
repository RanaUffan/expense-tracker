// A categorical palette for charts — the app's own green stays first
// (so the single most common case, one dominant category, still reads
// as "on brand"), followed by distinct hues for the rest.
export const CHART_COLORS = [
  '#1F7A4D', // green (brand)
  '#C17A2E', // amber
  '#2E5FA3', // blue
  '#A3402E', // rust
  '#6B4EA0', // purple
  '#2E9B8F', // teal
  '#B0489A', // magenta
  '#7A8A3F', // olive
];

export function colorFor(index) {
  return CHART_COLORS[index % CHART_COLORS.length];
}
