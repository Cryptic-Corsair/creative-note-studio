import type { Brush } from "@/lib/ink";

export const SOLID_COLORS = [
  "#111318",
  "#5b6472",
  "#e7422f",
  "#f08a24",
  "#f2c744",
  "#3fae6a",
  "#2f9bd6",
  "#3b5bdb",
  "#8b5cf6",
  "#e05a8f",
  "#8b5e3c",
  "#f7f5f0",
];

export const GRADIENTS: { from: string; to: string; name: string }[] = [
  { name: "Sunset", from: "#ff9a3c", to: "#e0417f" },
  { name: "Lagoon", from: "#2fd8c4", to: "#2f6fd6" },
  { name: "Orchid", from: "#a06bff", to: "#ff6bb5" },
  { name: "Citrus", from: "#f7d94c", to: "#f2622f" },
  { name: "Aurora", from: "#37f0a0", to: "#3b5bdb" },
  { name: "Ember", from: "#ff5f6d", to: "#7b1fa2" },
];

export function brushCss(b: Brush) {
  return b.kind === "solid"
    ? b.color
    : `linear-gradient(135deg, ${b.from}, ${b.to})`;
}

export const THEMES = [
  { id: "graphite", name: "Graphite" },
  { id: "paper", name: "Paper" },
  { id: "midnight", name: "Midnight" },
  { id: "sage", name: "Sage" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
