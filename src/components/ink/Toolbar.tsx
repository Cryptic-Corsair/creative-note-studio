import { useState } from "react";
import {
  Pen,
  Eraser,
  Lasso,
  Hand,
  Undo2,
  Redo2,
  Trash2,
  Palette,
  Crosshair,
  Sparkles,
  X,
  ChevronLeft,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Brush } from "@/lib/ink";
import { brushCss, GRADIENTS, SOLID_COLORS, THEMES, type ThemeId } from "./palette";
import { cn } from "@/lib/utils";

export type Tool = "pen" | "eraser" | "lasso" | "hand";

type Props = {
  title: string;
  onTitleChange: (t: string) => void;
  tool: Tool;
  setTool: (t: Tool) => void;
  brush: Brush;
  setBrush: (b: Brush) => void;
  size: number;
  setSize: (n: number) => void;
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelection: () => void;
  onResetView: () => void;
  onClear: () => void;
};

const TOOLS: { id: Tool; icon: typeof Pen; label: string }[] = [
  { id: "pen", icon: Pen, label: "Pen" },
  { id: "eraser", icon: Eraser, label: "Eraser" },
  { id: "lasso", icon: Lasso, label: "Lasso" },
  { id: "hand", icon: Hand, label: "Pan" },
];

function IconButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-xl text-panel-foreground/70 transition-all",
        "hover:bg-panel-accent hover:text-panel-foreground active:scale-95",
        active && "bg-panel-accent text-panel-foreground shadow-inset-soft",
        disabled && "pointer-events-none opacity-30",
      )}
    >
      {children}
    </button>
  );
}

export function Toolbar(p: Props) {
  const [panel, setPanel] = useState<null | "ink" | "theme">(null);
  const [customFrom, setCustomFrom] = useState("#7c5cff");
  const [customTo, setCustomTo] = useState("#28e0b8");

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-5">
        <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-panel/80 py-1.5 pl-1.5 pr-3 shadow-float backdrop-blur-xl">
          <Link
            to="/"
            aria-label="Back to notes"
            title="Back to notes"
            className="grid h-9 w-9 place-items-center rounded-xl text-panel-foreground/70 transition-colors hover:bg-panel-accent hover:text-panel-foreground"
          >
            <ChevronLeft className="h-[18px] w-[18px]" />
          </Link>
          <div className="min-w-0">
            <input
              value={p.title}
              onChange={(e) => p.onTitleChange(e.target.value)}
              aria-label="Note title"
              placeholder="Untitled note"
              className="w-36 truncate border-none bg-transparent font-display text-sm leading-tight tracking-tight text-panel-foreground outline-none placeholder:text-panel-foreground/40 sm:w-56"
            />
            <p className="text-[11px] text-panel-foreground/45">Inkwell</p>
          </div>
        </div>
        <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-panel/80 p-1.5 shadow-float backdrop-blur-xl">
          <IconButton label="Undo" onClick={p.onUndo} disabled={!p.canUndo}>
            <Undo2 className="h-[18px] w-[18px]" />
          </IconButton>
          <IconButton label="Redo" onClick={p.onRedo} disabled={!p.canRedo}>
            <Redo2 className="h-[18px] w-[18px]" />
          </IconButton>
          <IconButton label="Reset view" onClick={p.onResetView}>
            <Crosshair className="h-[18px] w-[18px]" />
          </IconButton>
          <IconButton
            label={p.hasSelection ? "Delete selection" : "Clear canvas"}
            onClick={p.hasSelection ? p.onDeleteSelection : p.onClear}
          >
            <Trash2 className="h-[18px] w-[18px]" />
          </IconButton>
          <span className="px-2 text-xs tabular-nums text-panel-foreground/45">
            {Math.round(p.zoom * 100)}%
          </span>
        </div>
      </header>

      {panel && (
        <div className="absolute inset-x-0 bottom-24 z-20 flex justify-center px-3 sm:bottom-28">
          <div className="w-full max-w-md rounded-3xl bg-panel/90 p-4 shadow-float backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-sm text-panel-foreground">
                {panel === "ink" ? "Ink" : "Theme"}
              </span>
              <button
                aria-label="Close"
                onClick={() => setPanel(null)}
                className="grid h-7 w-7 place-items-center rounded-lg text-panel-foreground/50 hover:bg-panel-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {panel === "ink" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-2">
                  {SOLID_COLORS.map((c) => {
                    const active = p.brush.kind === "solid" && p.brush.color === c;
                    return (
                      <button
                        key={c}
                        aria-label={`Color ${c}`}
                        onClick={() => p.setBrush({ kind: "solid", color: c })}
                        className={cn(
                          "h-9 rounded-xl border border-panel-border transition-transform hover:scale-105",
                          active && "ring-2 ring-panel-ring ring-offset-2 ring-offset-panel",
                        )}
                        style={{ background: c }}
                      />
                    );
                  })}
                </div>

                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-widest text-panel-foreground/45">
                    Gradients
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {GRADIENTS.map((g) => {
                      const active =
                        p.brush.kind === "gradient" && p.brush.from === g.from && p.brush.to === g.to;
                      return (
                        <button
                          key={g.name}
                          aria-label={g.name}
                          title={g.name}
                          onClick={() => p.setBrush({ kind: "gradient", from: g.from, to: g.to })}
                          className={cn(
                            "h-9 rounded-xl border border-panel-border transition-transform hover:scale-105",
                            active && "ring-2 ring-panel-ring ring-offset-2 ring-offset-panel",
                          )}
                          style={{ background: brushCss({ kind: "gradient", ...g }) }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl bg-panel-accent/60 p-3">
                  <p className="mb-2 text-[11px] uppercase tracking-widest text-panel-foreground/45">
                    Custom gradient
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      aria-label="Gradient start"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="h-9 w-9 cursor-pointer rounded-lg border border-panel-border bg-transparent p-0"
                    />
                    <div
                      className="h-9 flex-1 rounded-lg border border-panel-border"
                      style={{ background: `linear-gradient(90deg, ${customFrom}, ${customTo})` }}
                    />
                    <input
                      type="color"
                      aria-label="Gradient end"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="h-9 w-9 cursor-pointer rounded-lg border border-panel-border bg-transparent p-0"
                    />
                    <button
                      onClick={() =>
                        p.setBrush({ kind: "gradient", from: customFrom, to: customTo })
                      }
                      className="rounded-lg bg-panel-foreground px-3 py-2 text-xs font-medium text-panel transition-opacity hover:opacity-85"
                    >
                      Use
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-widest text-panel-foreground/45">
                    <span>Thickness</span>
                    <span className="tabular-nums">{p.size.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={0.5}
                    value={p.size}
                    aria-label="Stroke thickness"
                    onChange={(e) => p.setSize(Number(e.target.value))}
                    className="ink-range w-full"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => p.setTheme(t.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border border-panel-border p-3 text-left transition-colors hover:bg-panel-accent",
                      p.theme === t.id && "bg-panel-accent ring-2 ring-panel-ring",
                    )}
                  >
                    <span
                      className="h-8 w-8 rounded-lg border border-panel-border"
                      data-theme={t.id}
                      style={{ background: "var(--canvas-paper)" }}
                    />
                    <span className="text-sm text-panel-foreground">{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center p-3 sm:p-5">
        <div className="flex items-center gap-1 rounded-2xl bg-panel/85 p-1.5 shadow-float backdrop-blur-xl">
          {TOOLS.map((t) => (
            <IconButton
              key={t.id}
              label={t.label}
              active={p.tool === t.id}
              onClick={() => p.setTool(t.id)}
            >
              <t.icon className="h-[18px] w-[18px]" />
            </IconButton>
          ))}
          <span className="mx-1 h-6 w-px bg-panel-border" />
          <button
            aria-label="Ink settings"
            onClick={() => setPanel(panel === "ink" ? null : "ink")}
            className={cn(
              "flex h-10 items-center gap-2 rounded-xl px-2.5 transition-colors hover:bg-panel-accent",
              panel === "ink" && "bg-panel-accent",
            )}
          >
            <span
              className="h-5 w-5 rounded-full border border-panel-border"
              style={{ background: brushCss(p.brush) }}
            />
            <span
              className="rounded-full bg-panel-foreground/80"
              style={{ height: Math.max(2, Math.min(p.size, 14)), width: 22 }}
            />
            <Palette className="h-4 w-4 text-panel-foreground/60" />
          </button>
          <IconButton
            label="Themes"
            active={panel === "theme"}
            onClick={() => setPanel(panel === "theme" ? null : "theme")}
          >
            <Sparkles className="h-[18px] w-[18px]" />
          </IconButton>
        </div>
      </div>
    </>
  );
}
