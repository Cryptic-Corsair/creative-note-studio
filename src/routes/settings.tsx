import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  ACCENTS,
  DEFAULT_PREFS,
  getPrefs,
  resetPrefs,
  setPrefs,
  usePrefs,
  type Density,
  type FontChoice,
  type Prefs,
} from "@/lib/prefs";
import { PAPER_PATTERNS, THEMES, brushCss } from "@/components/ink/palette";
import { MarkInkwell, MarkPlus, MarkSpark, MarkTrash } from "@/components/ink/marks";
import { cn } from "@/lib/utils";
import type { StrokeStyle } from "@/lib/ink";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Studio Settings — Inkwell" },
      {
        name: "description",
        content:
          "Customize every part of Inkwell: themes, accent color, typography, paper grid, pen defaults, eraser, library layout and your own ink palette.",
      },
      { property: "og:title", content: "Studio Settings — Inkwell" },
      {
        property: "og:description",
        content: "Tune themes, accents, typography, paper, pens and your custom ink library.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const SECTIONS = [
  { id: "appearance", label: "Appearance" },
  { id: "canvas", label: "Canvas & paper" },
  { id: "tools", label: "Tools & ink" },
  { id: "library", label: "Library" },
  { id: "data", label: "Data" },
] as const;

const PENS: { id: StrokeStyle; label: string }[] = [
  { id: "pen", label: "Studio pen" },
  { id: "calligraphy", label: "Calligraphy" },
  { id: "highlighter", label: "Highlighter" },
  { id: "brush", label: "Brush" },
];

function SettingsPage() {
  const p = usePrefs();
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>("appearance");
  const [newColor, setNewColor] = useState("#6366f1");
  const [gFrom, setGFrom] = useState("#8b5cf6");
  const [gTo, setGTo] = useState("#ec4899");
  const fileRef = useRef<HTMLInputElement>(null);

  const exportPrefs = () => {
    const blob = new Blob([JSON.stringify(getPrefs(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "inkwell-settings.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importPrefs = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<Prefs>;
      setPrefs(parsed);
    } catch {
      alert("That file isn't a valid Inkwell settings backup.");
    }
  };

  const previewInk = useMemo(
    () => (p.customGradients[0] ? brushCss({ kind: "gradient", ...p.customGradients[0] }) : null),
    [p.customGradients],
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 mr-auto"
            aria-label="Back to the library"
          >
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <MarkInkwell className="h-4.5 w-4.5" />
            </span>
            <div className="leading-tight">
              <h1 className="font-display text-[16px] tracking-tight">Studio settings</h1>
              <p className="text-[11px] text-muted-foreground">Inkwell v1.5</p>
            </div>
          </Link>
          <button
            onClick={() => resetPrefs()}
            className="h-9 rounded-2xl border border-border px-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Reset all
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-[190px_1fr]">
        <nav className="flex gap-1 overflow-x-auto md:sticky md:top-24 md:h-max md:flex-col">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              aria-pressed={section === s.id}
              className={cn(
                "h-9 shrink-0 rounded-2xl px-3 text-left text-sm transition-colors",
                section === s.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="space-y-6">
          {section === "appearance" && (
            <>
              <Card title="Theme" hint="Applies across the library and every canvas.">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setPrefs({ theme: t.id })}
                      className={cn(
                        "overflow-hidden rounded-2xl border border-border text-left transition-transform hover:-translate-y-0.5",
                        p.theme === t.id && "ring-2 ring-ring",
                      )}
                    >
                      <span
                        data-theme={t.id}
                        className="block h-12 w-full"
                        style={{ background: "var(--canvas-paper)" }}
                      />
                      <span className="block px-2.5 py-1.5">
                        <span className="block text-[12px] font-medium">{t.name}</span>
                        <span className="block text-[10px] text-muted-foreground">{t.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              <Card title="Accent" hint="Drives buttons, focus rings and canvas highlights.">
                <div className="flex flex-wrap gap-2">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setPrefs({ accentHue: a.hue, accentChroma: a.chroma })}
                      title={a.name}
                      className={cn(
                        "h-9 w-9 rounded-full border border-border transition-transform hover:scale-105",
                        Math.round(p.accentHue) === a.hue && "ring-2 ring-ring ring-offset-2 ring-offset-background",
                      )}
                      style={{ background: `oklch(0.62 ${a.chroma} ${a.hue})` }}
                    />
                  ))}
                </div>
                <Slider
                  label="Hue"
                  value={p.accentHue}
                  min={0}
                  max={360}
                  step={1}
                  onChange={(v) => setPrefs({ accentHue: v })}
                  format={(v) => `${Math.round(v)}°`}
                />
                <Slider
                  label="Saturation"
                  value={p.accentChroma}
                  min={0.02}
                  max={0.28}
                  step={0.01}
                  onChange={(v) => setPrefs({ accentChroma: v })}
                  format={(v) => v.toFixed(2)}
                />
              </Card>

              <Card title="Shape & type">
                <Choice
                  label="Display font"
                  value={p.fontDisplay}
                  options={
                    [
                      ["grotesk", "Grotesk"],
                      ["serif", "Serif"],
                      ["rounded", "Rounded"],
                      ["mono", "Mono"],
                    ] as [FontChoice, string][]
                  }
                  onChange={(v) => setPrefs({ fontDisplay: v })}
                />
                <Choice
                  label="Density"
                  value={p.density}
                  options={
                    [
                      ["compact", "Compact"],
                      ["cozy", "Cozy"],
                      ["spacious", "Spacious"],
                    ] as [Density, string][]
                  }
                  onChange={(v) => setPrefs({ density: v })}
                />
                <Slider
                  label="Corner radius"
                  value={p.radius}
                  min={0}
                  max={1.6}
                  step={0.05}
                  onChange={(v) => setPrefs({ radius: v })}
                  format={(v) => `${v.toFixed(2)}rem`}
                />
                <Slider
                  label="Interface scale"
                  value={p.uiScale}
                  min={0.85}
                  max={1.2}
                  step={0.01}
                  onChange={(v) => setPrefs({ uiScale: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                />
                <Toggle
                  label="Glass panels"
                  hint="Frosted blur behind toolbars"
                  value={p.glass}
                  onChange={(v) => setPrefs({ glass: v })}
                />
                <Toggle
                  label="Reduce motion"
                  hint="Turns off animations and transitions"
                  value={p.reduceMotion}
                  onChange={(v) => setPrefs({ reduceMotion: v })}
                />
              </Card>
            </>
          )}

          {section === "canvas" && (
            <Card title="Paper" hint="Defaults for every new note.">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PAPER_PATTERNS.map((pat) => (
                  <button
                    key={pat.id}
                    onClick={() => setPrefs({ pattern: pat.id })}
                    className={cn(
                      "rounded-2xl border border-border px-3 py-3 text-left text-sm transition-colors hover:bg-accent",
                      p.pattern === pat.id && "ring-2 ring-ring",
                    )}
                  >
                    {pat.name}
                  </button>
                ))}
              </div>
              <Slider
                label="Grid size"
                value={p.gridSize}
                min={8}
                max={72}
                step={2}
                onChange={(v) => setPrefs({ gridSize: v })}
                format={(v) => `${v}px`}
              />
              <Slider
                label="Grid opacity"
                value={p.gridOpacity}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => setPrefs({ gridOpacity: v })}
                format={(v) => `${Math.round(v * 100)}%`}
              />
              <Toggle
                label="Cursor ring"
                hint="Shows the live nib / eraser size under the pointer"
                value={p.showCursorRing}
                onChange={(v) => setPrefs({ showCursorRing: v })}
              />
              <Slider
                label="Autosave interval"
                value={p.autosaveMs}
                min={300}
                max={4000}
                step={100}
                onChange={(v) => setPrefs({ autosaveMs: v })}
                format={(v) => `${(v / 1000).toFixed(1)}s`}
              />
            </Card>
          )}

          {section === "tools" && (
            <>
              <Card title="Pen defaults">
                <Choice
                  label="Nib"
                  value={p.penStyle}
                  options={PENS.map((x) => [x.id, x.label] as [StrokeStyle, string])}
                  onChange={(v) => setPrefs({ penStyle: v })}
                />
                <Slider
                  label="Thickness"
                  value={p.penSize}
                  min={1}
                  max={40}
                  step={0.5}
                  onChange={(v) => setPrefs({ penSize: v })}
                  format={(v) => `${v}px`}
                />
                <Slider
                  label="Opacity"
                  value={p.penOpacity}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onChange={(v) => setPrefs({ penOpacity: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                />
                <Slider
                  label="Pressure sensitivity"
                  value={p.pressure}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setPrefs({ pressure: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                />
                <Slider
                  label="Stroke smoothing"
                  value={p.smoothing}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => setPrefs({ smoothing: v })}
                  format={(v) => `${Math.round(v * 100)}%`}
                />
                <Toggle
                  label="Shape auto-snap"
                  hint="Turns rough loops and lines into clean geometry"
                  value={p.autoSnapShape}
                  onChange={(v) => setPrefs({ autoSnapShape: v })}
                />
                <Slider
                  label="Eraser radius"
                  value={p.eraserSize}
                  min={6}
                  max={60}
                  step={2}
                  onChange={(v) => setPrefs({ eraserSize: v })}
                  format={(v) => `${v}px`}
                />
              </Card>

              <Card title="Your ink library" hint="Saved swatches appear in the canvas palette.">
                <div className="flex flex-wrap items-center gap-2">
                  {p.customColors.map((c) => (
                    <button
                      key={c}
                      onClick={() =>
                        setPrefs({ customColors: p.customColors.filter((x) => x !== c) })
                      }
                      title={`${c} — click to remove`}
                      className="h-9 w-9 rounded-xl border border-border"
                      style={{ background: c }}
                    />
                  ))}
                  <label className="flex h-9 items-center gap-2 rounded-xl border border-border px-2 text-xs text-muted-foreground">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="h-6 w-6 cursor-pointer rounded border-none bg-transparent p-0"
                    />
                    <button
                      onClick={() =>
                        !p.customColors.includes(newColor) &&
                        setPrefs({ customColors: [...p.customColors, newColor] })
                      }
                      className="inline-flex items-center gap-1 font-medium text-foreground"
                    >
                      <MarkPlus className="h-3.5 w-3.5" /> Add
                    </button>
                  </label>
                </div>

                <div className="mt-4 space-y-2">
                  {p.customGradients.map((g, i) => (
                    <div
                      key={`${g.from}${g.to}${i}`}
                      className="flex items-center gap-3 rounded-2xl border border-border p-2"
                    >
                      <span
                        className="h-8 w-16 rounded-xl"
                        style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                      />
                      <span className="mr-auto text-sm">{g.name}</span>
                      <button
                        onClick={() =>
                          setPrefs({ customGradients: p.customGradients.filter((_, j) => j !== i) })
                        }
                        className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-accent hover:text-destructive"
                        aria-label={`Delete ${g.name}`}
                      >
                        <MarkTrash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-border p-2">
                    <input
                      type="color"
                      value={gFrom}
                      onChange={(e) => setGFrom(e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded-lg border-none bg-transparent p-0"
                    />
                    <input
                      type="color"
                      value={gTo}
                      onChange={(e) => setGTo(e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded-lg border-none bg-transparent p-0"
                    />
                    <span
                      className="h-8 flex-1 min-w-24 rounded-xl"
                      style={{ background: `linear-gradient(135deg, ${gFrom}, ${gTo})` }}
                    />
                    <button
                      onClick={() =>
                        setPrefs({
                          customGradients: [
                            ...p.customGradients,
                            { name: `Custom ${p.customGradients.length + 1}`, from: gFrom, to: gTo },
                          ],
                        })
                      }
                      className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-medium text-primary-foreground"
                    >
                      <MarkSpark className="h-3.5 w-3.5" /> Save blend
                    </button>
                  </div>
                  {previewInk && (
                    <p className="text-[11px] text-muted-foreground">
                      First saved blend previews as{" "}
                      <span
                        className="inline-block h-2.5 w-8 translate-y-0.5 rounded-full"
                        style={{ background: previewInk }}
                      />
                    </p>
                  )}
                </div>
              </Card>
            </>
          )}

          {section === "library" && (
            <Card title="Library layout">
              <Choice
                label="Default view"
                value={p.defaultView}
                options={
                  [
                    ["grid", "Grid"],
                    ["rows", "List"],
                  ] as ["grid" | "rows", string][]
                }
                onChange={(v) => setPrefs({ defaultView: v })}
              />
              <Choice
                label="Default sort"
                value={p.defaultSort}
                options={
                  [
                    ["recent", "Recent"],
                    ["title", "Title"],
                    ["size", "Strokes"],
                  ] as ["recent" | "title" | "size", string][]
                }
                onChange={(v) => setPrefs({ defaultSort: v })}
              />
              <Toggle
                label="Show hero"
                hint="The big header block on the library page"
                value={p.showHero}
                onChange={(v) => setPrefs({ showHero: v })}
              />
              <Toggle
                label="Show stats"
                hint="Note, stroke and starred counters"
                value={p.showStats}
                onChange={(v) => setPrefs({ showStats: v })}
              />
            </Card>
          )}

          {section === "data" && (
            <Card title="Backup & restore" hint="Settings are stored on this device.">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportPrefs}
                  className="h-10 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Export settings
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="h-10 rounded-2xl border border-border px-4 text-sm font-medium hover:bg-accent"
                >
                  Import settings
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importPrefs(f);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => resetPrefs()}
                  className="h-10 rounded-2xl border border-border px-4 text-sm font-medium text-destructive hover:bg-destructive/10"
                >
                  Restore defaults
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {Object.keys(DEFAULT_PREFS).length} customizable options in this build.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-float">
      <h2 className="font-display text-base tracking-tight">{title}</h2>
      {hint && <p className="mb-4 mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className={cn("space-y-4", !hint && "mt-4")}>{children}</div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-xs font-medium">
        <span>{label}</span>
        <span className="tabular-nums text-muted-foreground">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ink-range w-full"
      />
    </label>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
      className="flex w-full items-center gap-3 rounded-2xl border border-border p-3 text-left transition-colors hover:bg-accent/50"
    >
      <span className="mr-auto">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          value ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-background transition-all",
            value ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
  );
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium">{label}</p>
      <div className="flex flex-wrap gap-1 rounded-2xl border border-border p-1">
        {options.map(([id, text]) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-pressed={value === id}
            className={cn(
              "h-8 rounded-xl px-3 text-xs font-medium transition-colors",
              value === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
