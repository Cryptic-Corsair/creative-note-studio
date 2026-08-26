import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Brush, PenStyle } from "@/lib/ink";
import { PEN_STYLES } from "@/lib/ink";
import { brushCss, GRADIENTS, SOLID_COLORS, THEMES, type ThemeId } from "./palette";
import { cn } from "@/lib/utils";
import {
  IconBack,
  IconChevronLeft,
  IconClose,
  IconCopy,
  IconEraser,
  IconFront,
  IconHand,
  IconLasso,
  IconMarquee,
  IconPalette,
  IconPen,
  IconRedo,
  IconScale,
  IconSparkle,
  IconStraight,
  IconTarget,
  IconTrash,
  IconUndo,
  IconWand,
} from "./icons";

export type Tool = "pen" | "eraser" | "lasso" | "hand";
export type EraserMode = "stroke" | "precision";
export type LassoMode = "free" | "rect";

type Props = {
  title: string;
  onTitleChange: (t: string) => void;
  tool: Tool;
  setTool: (t: Tool) => void;
  brush: Brush;
  setBrush: (b: Brush) => void;
  penStyle?: PenStyle;
  setPenStyle?: (s: PenStyle) => void;
  size: number;
  setSize: (n: number) => void;
  opacity?: number;
  setOpacity?: (n: number) => void;
  straight?: boolean;
  setStraight?: (v: boolean) => void;
  eraserMode?: EraserMode;
  setEraserMode?: (m: EraserMode) => void;
  eraserSize?: number;
  setEraserSize?: (n: number) => void;
  lassoMode?: LassoMode;
  setLassoMode?: (m: LassoMode) => void;
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  zoom: number;
  onZoom?: (factor: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  selectionCount: number;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelection: () => void;
  onDuplicateSelection?: () => void;
  onBringFront?: () => void;
  onSendBack?: () => void;
  onRestyleSelection?: () => void;
  onScaleSelection?: (f: number) => void;
  onResetView: () => void;
  onClear: () => void;
};

const TOOLS: { id: Tool; icon: typeof IconPen; label: string; key: string }[] = [
  { id: "pen", icon: IconPen, label: "Pen", key: "P" },
  { id: "eraser", icon: IconEraser, label: "Eraser", key: "E" },
  { id: "lasso", icon: IconLasso, label: "Select", key: "L" },
  { id: "hand", icon: IconHand, label: "Pan", key: "H" },
];

function IconButton({
  active,
  disabled,
  label,
  onClick,
  danger,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  danger?: boolean;
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
        "grid h-9 w-9 place-items-center rounded-[13px] text-panel-foreground/65 transition-all duration-150",
        "hover:bg-panel-accent hover:text-panel-foreground active:scale-90",
        active && "bg-panel-accent text-panel-foreground shadow-inset-soft",
        danger && "hover:text-destructive",
        disabled && "pointer-events-none opacity-25",
      )}
    >
      {children}
    </button>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; icon?: typeof IconPen }[];
}) {
  return (
    <div className="flex rounded-xl bg-panel-accent/70 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-xs font-medium transition-all",
            value === o.id
              ? "bg-panel text-panel-foreground shadow-float"
              : "text-panel-foreground/55 hover:text-panel-foreground",
          )}
        >
          {o.icon ? <o.icon size={14} /> : null}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-panel-foreground/45">
        <span>{label}</span>
        <span className="tabular-nums text-panel-foreground/70">
          {value.toFixed(step < 1 ? 1 : 0)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ink-range w-full"
      />
    </div>
  );
}

export function Toolbar(p: Props) {
  const [panel, setPanel] = useState<null | "ink" | "theme">(null);
  const [customFrom, setCustomFrom] = useState("#7c5cff");
  const [customTo, setCustomTo] = useState("#28e0b8");

  return (
    <>
      {/* ---------- top bar ---------- */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 sm:p-4">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-panel-border/60 bg-panel/75 py-1.5 pl-1.5 pr-3.5 shadow-float backdrop-blur-2xl">
          <Link
            to="/"
            aria-label="Back to notes"
            title="Back to notes"
            className="grid h-8 w-8 place-items-center rounded-xl text-panel-foreground/60 transition-colors hover:bg-panel-accent hover:text-panel-foreground"
          >
            <IconChevronLeft size={18} />
          </Link>
          <div className="min-w-0">
            <input
              value={p.title}
              onChange={(e) => p.onTitleChange(e.target.value)}
              aria-label="Note title"
              placeholder="Untitled note"
              className="w-32 truncate border-none bg-transparent font-display text-sm leading-tight tracking-tight text-panel-foreground outline-none placeholder:text-panel-foreground/35 sm:w-52"
            />
            <p className="text-[10px] uppercase tracking-[0.18em] text-panel-foreground/35">
              Inkwell
            </p>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border border-panel-border/60 bg-panel/75 p-1.5 shadow-float backdrop-blur-2xl">
          <IconButton label="Undo" onClick={p.onUndo} disabled={!p.canUndo}>
            <IconUndo />
          </IconButton>
          <IconButton label="Redo" onClick={p.onRedo} disabled={!p.canRedo}>
            <IconRedo />
          </IconButton>
          <span className="mx-0.5 h-5 w-px bg-panel-border" />
          <IconButton label="Themes" active={panel === "theme"} onClick={() => setPanel(panel === "theme" ? null : "theme")}>
            <IconSparkle />
          </IconButton>
          <IconButton label="Clear canvas" danger onClick={p.onClear}>
            <IconTrash />
          </IconButton>
        </div>
      </header>

      {/* ---------- left tool rail ---------- */}
      <div className="absolute left-3 top-1/2 z-20 -translate-y-1/2 sm:left-4">
        <div className="flex flex-col items-center gap-1 rounded-[20px] border border-panel-border/60 bg-panel/75 p-1.5 shadow-float backdrop-blur-2xl">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-label={`${t.label} (${t.key})`}
              title={`${t.label} (${t.key})`}
              onClick={() => {
                p.setTool(t.id);
                if (t.id === "pen") setPanel(null);
              }}
              className={cn(
                "group relative grid h-11 w-11 place-items-center rounded-2xl transition-all duration-200",
                p.tool === t.id
                  ? "bg-panel-accent text-panel-foreground shadow-inset-soft"
                  : "text-panel-foreground/55 hover:bg-panel-accent/60 hover:text-panel-foreground active:scale-90",
              )}
            >
              <t.icon size={20} />
              {p.tool === t.id && (
                <span className="absolute -left-1.5 h-5 w-1 rounded-full bg-panel-ring" />
              )}
            </button>
          ))}

          <span className="my-0.5 h-px w-6 bg-panel-border" />

          <button
            type="button"
            aria-label="Ink settings"
            title="Ink settings"
            onClick={() => setPanel(panel === "ink" ? null : "ink")}
            className={cn(
              "grid h-11 w-11 place-items-center rounded-2xl transition-all",
              panel === "ink" ? "bg-panel-accent" : "hover:bg-panel-accent/60",
            )}
          >
            <span
              className="h-6 w-6 rounded-full border border-panel-border shadow-inset-soft"
              style={{ background: brushCss(p.brush), opacity: Math.max(0.35, p.opacity) }}
            />
          </button>
        </div>
      </div>

      {/* ---------- zoom cluster ---------- */}
      <div className="absolute bottom-4 right-3 z-20 flex flex-col items-center gap-1 rounded-2xl border border-panel-border/60 bg-panel/75 p-1.5 shadow-float backdrop-blur-2xl sm:right-4">
        {p.onZoom && (
          <>
            <button
              aria-label="Zoom in"
              title="Zoom in"
              onClick={() => p.onZoom!(1.2)}
              className="grid h-8 w-8 place-items-center rounded-xl text-lg leading-none text-panel-foreground/65 transition-colors hover:bg-panel-accent hover:text-panel-foreground"
            >
              +
            </button>
            <span className="py-0.5 text-[10px] font-medium tabular-nums text-panel-foreground/55">
              {Math.round(p.zoom * 100)}
            </span>
            <button
              aria-label="Zoom out"
              title="Zoom out"
              onClick={() => p.onZoom!(1 / 1.2)}
              className="grid h-8 w-8 place-items-center rounded-xl text-lg leading-none text-panel-foreground/65 transition-colors hover:bg-panel-accent hover:text-panel-foreground"
            >
              −
            </button>
          </>
        )}
        <span className="h-px w-5 bg-panel-border" />
        <IconButton label="Reset view" onClick={p.onResetView}>
          <IconTarget size={18} />
        </IconButton>
      </div>

      {/* ---------- selection HUD ---------- */}
      {p.selectionCount > 0 && (
        <div className="absolute inset-x-0 top-20 z-20 flex justify-center px-3">
          <div className="flex items-center gap-1 rounded-2xl border border-panel-border/60 bg-panel/90 p-1.5 shadow-float backdrop-blur-2xl">
            <span className="px-2 text-xs font-medium tabular-nums text-panel-foreground/60">
              {p.selectionCount} selected
            </span>
            <span className="mx-0.5 h-5 w-px bg-panel-border" />
            {p.onDuplicateSelection && (
              <IconButton label="Duplicate" onClick={p.onDuplicateSelection}>
                <IconCopy size={18} />
              </IconButton>
            )}
            {p.onRestyleSelection && (
              <IconButton label="Apply current ink" onClick={p.onRestyleSelection}>
                <IconWand size={18} />
              </IconButton>
            )}
            {p.onScaleSelection && (
              <>
                <IconButton label="Shrink" onClick={() => p.onScaleSelection!(1 / 1.15)}>
                  <IconScale size={18} className="rotate-90" />
                </IconButton>
                <IconButton label="Enlarge" onClick={() => p.onScaleSelection!(1.15)}>
                  <IconScale size={18} />
                </IconButton>
              </>
            )}
            {p.onBringFront && (
              <IconButton label="Bring to front" onClick={p.onBringFront}>
                <IconFront size={18} />
              </IconButton>
            )}
            {p.onSendBack && (
              <IconButton label="Send to back" onClick={p.onSendBack}>
                <IconBack size={18} />
              </IconButton>
            )}
            <IconButton label="Delete selection" danger onClick={p.onDeleteSelection}>
              <IconTrash size={18} />
            </IconButton>
          </div>
        </div>
      )}

      {/* ---------- contextual bottom bar ---------- */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center p-3 sm:p-4">
        <div className="pointer-events-auto flex max-w-[calc(100vw-6.5rem)] items-center gap-1.5 overflow-x-auto rounded-2xl border border-panel-border/60 bg-panel/80 p-1.5 shadow-float backdrop-blur-2xl">
          {p.tool === "pen" && (
            <>
              {PEN_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  title={`${s.name} — ${s.hint}`}
                  onClick={() => {
                    p.setPenStyle?.(s.id);
                    p.setOpacity?.(s.opacity);
                  }}
                  className={cn(
                    "whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition-all",
                    p.penStyle === s.id
                      ? "bg-panel-accent text-panel-foreground shadow-inset-soft"
                      : "text-panel-foreground/55 hover:bg-panel-accent/60 hover:text-panel-foreground",
                  )}
                >
                  {s.name}
                </button>
              ))}
              <span className="mx-0.5 h-5 w-px bg-panel-border" />
              {p.setStraight && (
                <IconButton
                  label="Straight line mode"
                  active={!!p.straight}
                  onClick={() => p.setStraight!(!p.straight)}
                >
                  <IconStraight size={18} />
                </IconButton>
              )}
              <IconButton label="Ink settings" active={panel === "ink"} onClick={() => setPanel(panel === "ink" ? null : "ink")}>
                <IconPalette size={18} />
              </IconButton>
            </>
          )}

          {p.tool === "eraser" && p.setEraserMode && p.setEraserSize && (
            <div className="flex items-center gap-3 px-1">
              <Segmented
                value={p.eraserMode!}
                onChange={p.setEraserMode}
                options={[
                  { id: "stroke", label: "Whole stroke" },
                  { id: "precision", label: "Precision" },
                ]}
              />
              <div className="w-36">
                <Slider
                  label="Radius"
                  value={p.eraserSize!}
                  min={4}
                  max={80}
                  step={1}
                  onChange={p.setEraserSize}
                />
              </div>
            </div>
          )}

          {p.tool === "lasso" && p.setLassoMode && (
            <div className="flex items-center gap-3 px-1">
              <Segmented
                value={p.lassoMode!}
                onChange={p.setLassoMode}
                options={[
                  { id: "free", label: "Freeform", icon: IconLasso },
                  { id: "rect", label: "Rectangle", icon: IconMarquee },
                ]}
              />
              <span className="whitespace-nowrap pr-1 text-[11px] text-panel-foreground/45">
                Drag inside a selection to move it
              </span>
            </div>
          )}

          {p.tool === "hand" && (
            <span className="px-3 py-1.5 text-[11px] text-panel-foreground/50">
              Drag to pan · pinch or ⌘-scroll to zoom
            </span>
          )}
        </div>
      </div>

      {/* ---------- floating panels ---------- */}
      {panel && (
        <div className="absolute bottom-20 left-1/2 z-30 w-[min(23rem,calc(100vw-2rem))] -translate-x-1/2 sm:bottom-24">
          <div className="rounded-[26px] border border-panel-border/60 bg-panel/92 p-4 shadow-float backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-sm tracking-tight text-panel-foreground">
                {panel === "ink" ? "Ink studio" : "Canvas theme"}
              </span>
              <button
                aria-label="Close"
                onClick={() => setPanel(null)}
                className="grid h-7 w-7 place-items-center rounded-lg text-panel-foreground/45 hover:bg-panel-accent hover:text-panel-foreground"
              >
                <IconClose size={16} />
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
                          "h-8 rounded-xl border border-panel-border transition-transform hover:scale-110",
                          active && "ring-2 ring-panel-ring ring-offset-2 ring-offset-panel",
                        )}
                        style={{ background: c }}
                      />
                    );
                  })}
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-panel-foreground/45">
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
                            "h-8 rounded-xl border border-panel-border transition-transform hover:scale-110",
                            active && "ring-2 ring-panel-ring ring-offset-2 ring-offset-panel",
                          )}
                          style={{ background: brushCss({ kind: "gradient", ...g }) }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl bg-panel-accent/60 p-3">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-panel-foreground/45">
                    Custom gradient
                  </p>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="color"
                      aria-label="Gradient start"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded-lg border border-panel-border bg-transparent p-0"
                    />
                    <div
                      className="h-8 flex-1 rounded-lg border border-panel-border"
                      style={{ background: `linear-gradient(90deg, ${customFrom}, ${customTo})` }}
                    />
                    <input
                      type="color"
                      aria-label="Gradient end"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="h-8 w-8 cursor-pointer rounded-lg border border-panel-border bg-transparent p-0"
                    />
                    <button
                      onClick={() => p.setBrush({ kind: "gradient", from: customFrom, to: customTo })}
                      className="rounded-lg bg-panel-foreground px-3 py-2 text-xs font-medium text-panel transition-opacity hover:opacity-85"
                    >
                      Use
                    </button>
                  </div>
                </div>

                <Slider label="Thickness" value={p.size} min={1} max={40} step={0.5} onChange={p.setSize} />
                {p.opacity !== undefined && p.setOpacity && (
                  <Slider
                    label="Opacity"
                    value={p.opacity * 100}
                    min={5}
                    max={100}
                    step={1}
                    suffix="%"
                    onChange={(n) => p.setOpacity!(n / 100)}
                  />
                )}
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
    </>
  );
}
