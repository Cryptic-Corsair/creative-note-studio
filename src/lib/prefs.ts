import { useSyncExternalStore } from "react";
import type { StrokeStyle } from "@/lib/ink";
import type { PaperPatternId, ThemeId } from "@/components/ink/palette";

export type AccentPreset = { id: string; name: string; hue: number; chroma: number };

export const ACCENTS: AccentPreset[] = [
  { id: "indigo", name: "Indigo", hue: 265, chroma: 0.16 },
  { id: "cyan", name: "Lagoon", hue: 200, chroma: 0.14 },
  { id: "emerald", name: "Emerald", hue: 160, chroma: 0.13 },
  { id: "amber", name: "Amber", hue: 75, chroma: 0.15 },
  { id: "rose", name: "Rose", hue: 15, chroma: 0.16 },
  { id: "violet", name: "Violet", hue: 300, chroma: 0.16 },
];

export type Density = "cozy" | "compact" | "spacious";
export type FontChoice = "grotesk" | "serif" | "mono" | "rounded";
export type ToolbarSide = "left" | "right";

export type Prefs = {
  /* appearance */
  theme: ThemeId;
  accentHue: number;
  accentChroma: number;
  radius: number; // rem
  density: Density;
  fontDisplay: FontChoice;
  uiScale: number; // 0.85 – 1.2
  glass: boolean;
  reduceMotion: boolean;
  /* canvas */
  pattern: PaperPatternId;
  gridSize: number;
  gridOpacity: number; // 0-1
  showCursorRing: boolean;
  /* tools */
  penStyle: StrokeStyle;
  penSize: number;
  penOpacity: number;
  eraserSize: number;
  pressure: number; // 0-1 sensitivity
  smoothing: number; // 0-1
  straightSnap: boolean;
  autoSnapShape: boolean;
  /* library */
  defaultView: "grid" | "rows";
  defaultSort: "recent" | "title" | "size";
  showHero: boolean;
  showStats: boolean;
  /* studio */
  autosaveMs: number;
  customColors: string[];
  customGradients: { name: string; from: string; to: string }[];
};

export const DEFAULT_PREFS: Prefs = {
  theme: "graphite",
  accentHue: 265,
  accentChroma: 0.16,
  radius: 0.75,
  density: "cozy",
  fontDisplay: "grotesk",
  uiScale: 1,
  glass: true,
  reduceMotion: false,
  pattern: "dots",
  gridSize: 24,
  gridOpacity: 0.5,
  showCursorRing: true,
  penStyle: "pen",
  penSize: 4,
  penOpacity: 1,
  eraserSize: 20,
  pressure: 0.6,
  smoothing: 0.5,
  straightSnap: false,
  autoSnapShape: false,
  defaultView: "grid",
  defaultSort: "recent",
  showHero: true,
  showStats: true,
  autosaveMs: 900,
  customColors: [],
  customGradients: [],
};

const KEY = "inkwell.prefs.v1";
const listeners = new Set<() => void>();
let cache: Prefs = DEFAULT_PREFS;
let hydrated = false;

function read(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    /* ignore */
  }
  return DEFAULT_PREFS;
}

export function getPrefs(): Prefs {
  if (!hydrated && typeof window !== "undefined") {
    cache = read();
    hydrated = true;
  }
  return cache;
}

export function setPrefs(patch: Partial<Prefs>) {
  cache = { ...getPrefs(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* quota */
  }
  applyPrefs(cache);
  listeners.forEach((l) => l());
}

export function resetPrefs() {
  cache = { ...DEFAULT_PREFS };
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  applyPrefs(cache);
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(subscribe, getPrefs, () => DEFAULT_PREFS);
}

const FONT_STACKS: Record<FontChoice, string> = {
  grotesk: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
  serif: '"Instrument Serif", Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
  rounded: '"Nunito", ui-rounded, "Segoe UI", system-ui, sans-serif',
};

const DENSITY_GAP: Record<Density, string> = {
  compact: "0.5rem",
  cozy: "0.75rem",
  spacious: "1.15rem",
};

/** Writes preference-driven CSS variables onto <html>. */
export function applyPrefs(p: Prefs = getPrefs()) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.dataset["theme"] = p.theme;
  const s = el.style;
  s.setProperty("--radius", `${p.radius}rem`);
  s.setProperty("--font-display-user", FONT_STACKS[p.fontDisplay]);
  s.setProperty("--ui-gap", DENSITY_GAP[p.density]);
  s.setProperty("--ui-scale", String(p.uiScale));
  s.setProperty("--glass-blur", p.glass ? "18px" : "0px");
  s.setProperty("--panel-alpha", p.glass ? "0.85" : "1");
  const c = p.accentChroma;
  const h = p.accentHue;
  s.setProperty("--primary", `oklch(0.62 ${c} ${h})`);
  s.setProperty("--ring", `oklch(0.68 ${c} ${h})`);
  s.setProperty("--panel-ring", `oklch(0.68 ${c} ${h})`);
  s.setProperty("--canvas-accent", `oklch(0.62 ${c} ${h})`);
  s.setProperty("--primary-foreground", `oklch(0.99 0.01 ${h})`);
  el.dataset["motion"] = p.reduceMotion ? "reduced" : "full";
}
