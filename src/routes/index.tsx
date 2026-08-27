import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createNote,
  deleteNote,
  duplicateNote,
  listNotes,
  getStrokes,
  subscribeNotes,
  updateNote,
  type NoteMeta,
} from "@/lib/notes";
import { NoteThumb } from "@/components/ink/NoteThumb";
import { THEMES, GRADIENTS, type ThemeId, type PaperPatternId } from "@/components/ink/palette";
import {
  MarkArchive,
  MarkDuplicate,
  MarkGrid,
  MarkInkwell,
  MarkNib,
  MarkPlus,
  MarkRows,
  MarkSearch,
  MarkSort,
  MarkSpark,
  MarkStar,
  MarkTrash,
} from "@/components/ink/marks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inkwell — Handwritten Notes on an Infinite Canvas" },
      {
        name: "description",
        content:
          "Inkwell is a fast handwriting studio: infinite canvas, pressure pen, precision eraser, lasso, shapes, rich inks and custom gradients. Your whole notebook in one place.",
      },
      { property: "og:title", content: "Inkwell — Handwritten Notes on an Infinite Canvas" },
      {
        property: "og:description",
        content:
          "Create notebooks, sketch with pressure-aware ink, and organize everything on an infinite canvas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const fmt = (t: number) => {
  const d = Date.now() - t;
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(t).toLocaleDateString();
};

type SortKey = "recent" | "title" | "size";
type ViewMode = "grid" | "rows";
type Filter = "all" | "starred";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "recent", label: "Recent" },
  { id: "title", label: "Title" },
  { id: "size", label: "Strokes" },
];

const NOTE_TEMPLATES: {
  title: string;
  eyebrow: string;
  description: string;
  theme: ThemeId;
  pattern: PaperPatternId;
  accent: string;
}[] = [
  {
    title: "Meeting note",
    eyebrow: "Stay present",
    description: "A ruled page for decisions, actions and loose thoughts.",
    theme: "paper",
    pattern: "ruled",
    accent: "#e1b76b",
  },
  {
    title: "Study map",
    eyebrow: "Connect the dots",
    description: "A graph canvas for concepts, sketches and working it out.",
    theme: "sage",
    pattern: "graph",
    accent: "#78a998",
  },
  {
    title: "Project sketch",
    eyebrow: "See the system",
    description: "An isometric surface for flows, plans and diagrams.",
    theme: "midnight",
    pattern: "isometric",
    accent: "#78bce0",
  },
];

function Home() {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState<NoteMeta[] | null>(null);
  const [q, setQ] = useState("");
  const [theme, setTheme] = useState<ThemeId>("graphite");
  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<Filter>("all");

  const refresh = useCallback(() => setNotes(listNotes()), []);

  useEffect(() => {
    refresh();
    return subscribeNotes(refresh);
  }, [refresh]);

  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (typing) return;
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    if (!notes) return [];
    const s = q.trim().toLowerCase();
    let list = s ? notes.filter((n) => n.title.toLowerCase().includes(s)) : notes.slice();
    if (filter === "starred") list = list.filter((n) => n.favorite);
    list.sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "size") return b.strokeCount - a.strokeCount;
      return b.updatedAt - a.updatedAt;
    });
    return list;
  }, [notes, q, sort, filter]);

  const stats = useMemo(() => {
    const list = notes ?? [];
    return {
      count: list.length,
      strokes: list.reduce((a, n) => a + n.strokeCount, 0),
      starred: list.filter((n) => n.favorite).length,
    };
  }, [notes]);

  const recentNote = useMemo(
    () => (notes ?? []).slice().sort((a, b) => b.updatedAt - a.updatedAt)[0],
    [notes],
  );

  const newNote = (t: ThemeId = theme, title = "Untitled note", pattern?: PaperPatternId) => {
    const n = createNote(title, t, pattern);
    navigate({ to: "/note/$id", params: { id: n.id } });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ambient ink wash */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[520px] opacity-[0.16] blur-3xl"
        style={{
          background: `radial-gradient(60% 60% at 18% 0%, ${GRADIENTS[3]!.from}, transparent 70%), radial-gradient(50% 55% at 82% 8%, ${GRADIENTS[2]!.to}, transparent 70%)`,
        }}
      />

      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="mr-auto flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-float">
              <MarkInkwell className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <h1 className="font-display text-[17px] tracking-tight">Inkwell</h1>
              <p className="text-[11px] text-muted-foreground">infinite canvas studio</p>
            </div>
          </div>

          <label className="relative hidden sm:block">
            <MarkSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search notebooks"
              aria-label="Search notes"
              className="h-10 w-60 rounded-2xl border border-border bg-card pl-9 pr-12 text-sm outline-none transition-colors focus:border-ring"
            />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              /
            </kbd>
          </label>

          <div className="hidden items-center gap-0.5 rounded-2xl border border-border p-1 md:flex">
            {(
              [
                ["grid", MarkGrid, "Grid view"],
                ["rows", MarkRows, "List view"],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-label={label}
                aria-pressed={view === id}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl transition-colors",
                  view === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <button
            onClick={() => newNote()}
            className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98]"
          >
            <MarkPlus className="h-4 w-4" />
            <span className="hidden sm:inline">New note</span>
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        {/* Hero */}
        <section className="relative mb-6 overflow-hidden rounded-[32px] border border-border bg-card p-6 shadow-float sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-2xl"
            style={{
              background: `linear-gradient(135deg, ${GRADIENTS[0]!.from}, ${GRADIENTS[3]!.to})`,
            }}
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <MarkSpark className="h-3.5 w-3.5" /> your thinking space
              </span>
              <h2 className="mt-4 max-w-xl font-display text-3xl leading-[1.08] tracking-tight sm:text-5xl">
                Make room for the ideas
                <span className="text-muted-foreground"> that don&apos;t fit in a box.</span>
              </h2>
              <p className="mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
                A paper-like canvas for notes, diagrams and fast visual thinking. Every mark is
                pressure-responsive, instantly saved, and ready to pick up again.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => newNote()}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <MarkNib className="h-4 w-4" /> Open a blank canvas
                </button>
                <div className="flex items-center gap-4 rounded-2xl border border-border px-4 py-2.5 text-xs text-muted-foreground">
                  <Stat label="notes" value={stats.count} />
                  <span className="h-4 w-px bg-border" />
                  <Stat label="strokes" value={stats.strokes} />
                  <span className="h-4 w-px bg-border" />
                  <Stat label="starred" value={stats.starred} />
                </div>
              </div>
            </div>

            {/* Theme quick-start shelf */}
            <div>
              <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <p>Choose your paper</p>
                <span className="normal-case tracking-normal">double click to start</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    onDoubleClick={() => newNote(t.id)}
                    title={`${t.name} — ${t.desc}`}
                    aria-pressed={theme === t.id}
                    className={cn(
                      "group overflow-hidden rounded-2xl border border-border text-left transition-transform hover:-translate-y-0.5",
                      theme === t.id && "ring-2 ring-ring",
                    )}
                  >
                    <span
                      data-theme={t.id}
                      className="block h-14 w-full"
                      style={{
                        background: "var(--canvas-paper)",
                        backgroundImage: "radial-gradient(currentColor 0.7px, transparent 0.7px)",
                        backgroundSize: "9px 9px",
                        color: "var(--canvas-grid, transparent)",
                      }}
                    />
                    <span className="block bg-background/60 px-2.5 py-1.5 text-[11px] font-medium">
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-3 md:grid-cols-[1.35fr_1fr]">
          {recentNote ? (
            <Link
              to="/note/$id"
              params={{ id: recentNote.id }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-float"
            >
              <div
                className="absolute inset-y-0 right-0 w-2/5 opacity-70"
                data-theme={recentNote.theme}
                style={{ background: "var(--canvas-paper)" }}
              />
              <div className="relative max-w-[62%]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Continue thinking
                </p>
                <h3 className="mt-2 truncate font-display text-xl">
                  {recentNote.title || "Untitled note"}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Edited {fmt(recentNote.updatedAt)} · {recentNote.strokeCount} marks
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Resume canvas <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ) : (
            <button
              onClick={() => newNote()}
              className="rounded-3xl border border-dashed border-border bg-card p-5 text-left transition-colors hover:bg-accent/40"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                First thought
              </p>
              <h3 className="mt-2 font-display text-xl">Start where your mind is.</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                A blank, endless page is one click away.
              </p>
            </button>
          )}
          <div className="rounded-3xl border border-border bg-card p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Built for flow
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-muted-foreground">
              <div className="rounded-2xl bg-accent/55 px-2 py-3">
                <b className="mb-1 block text-sm text-foreground">∞</b>Canvas
              </div>
              <div className="rounded-2xl bg-accent/55 px-2 py-3">
                <b className="mb-1 block text-sm text-foreground">⌁</b>Pressure
              </div>
              <div className="rounded-2xl bg-accent/55 px-2 py-3">
                <b className="mb-1 block text-sm text-foreground">↗</b>Shapes
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10 rounded-[30px] border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Start with a shape
              </p>
              <h3 className="mt-1 font-display text-2xl tracking-tight">
                A page for the way you work.
              </h3>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Templates set the paper up front — the canvas stays entirely yours.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {NOTE_TEMPLATES.map((template) => (
              <button
                key={template.title}
                onClick={() =>
                  newNote(
                    template.theme,
                    `${template.title} — ${new Date().toLocaleDateString()}`,
                    template.pattern,
                  )
                }
                className="group relative min-h-44 overflow-hidden rounded-2xl border border-border p-4 text-left transition-all hover:-translate-y-1 hover:shadow-float"
                style={{
                  background: `linear-gradient(135deg, ${template.accent}26, transparent 64%)`,
                }}
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {template.eyebrow}
                </span>
                <span className="mt-6 block font-display text-xl tracking-tight">
                  {template.title}
                </span>
                <span className="mt-1 block max-w-[14rem] text-xs leading-relaxed text-muted-foreground">
                  {template.description}
                </span>
                <span className="absolute bottom-4 right-4 grid h-8 w-8 place-items-center rounded-full bg-background/80 text-primary opacity-0 transition-all group-hover:opacity-100">
                  <MarkPlus className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Mobile search */}
        <label className="relative mb-4 block sm:hidden">
          <MarkSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notebooks"
            aria-label="Search notes"
            className="h-10 w-full rounded-2xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-ring"
          />
        </label>

        {/* Library controls */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <h3 className="mr-auto font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Library
          </h3>

          <div className="flex items-center gap-0.5 rounded-2xl border border-border p-1">
            {(
              [
                ["all", "All"],
                ["starred", "Starred"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
                className={cn(
                  "h-8 rounded-xl px-3 text-xs font-medium transition-colors",
                  filter === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 rounded-2xl border border-border p-1">
            <MarkSort className="mx-1.5 h-4 w-4 text-muted-foreground" />
            {SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                aria-pressed={sort === s.id}
                className={cn(
                  "h-8 rounded-xl px-3 text-xs font-medium transition-colors",
                  sort === s.id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {notes === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-60 animate-pulse rounded-3xl border border-border bg-card"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid place-items-center rounded-3xl border border-dashed border-border p-14 text-center">
            <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-border text-muted-foreground">
              <MarkArchive className="h-5 w-5" />
            </span>
            <p className="text-sm text-muted-foreground">
              {q
                ? "No notebooks match that search."
                : filter === "starred"
                  ? "Nothing starred yet."
                  : "No notes yet — your canvas is waiting."}
            </p>
            {!q && filter === "all" && (
              <button
                onClick={() => newNote()}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <MarkPlus className="h-4 w-4" /> Create your first note
              </button>
            )}
          </div>
        ) : view === "grid" ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((n) => (
              <li
                key={n.id}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-float"
              >
                <Link
                  to="/note/$id"
                  params={{ id: n.id }}
                  className="block aspect-[4/3] overflow-hidden border-b border-border"
                >
                  {n.strokeCount ? (
                    <NoteThumb strokes={getStrokes(n.id)} theme={n.theme} />
                  ) : (
                    <div
                      data-theme={n.theme}
                      className="grid h-full w-full place-items-center text-xs text-muted-foreground"
                      style={{ background: "var(--canvas-paper)" }}
                    >
                      Empty canvas
                    </div>
                  )}
                </Link>

                {n.favorite && (
                  <span className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-background/85 text-primary backdrop-blur">
                    <MarkStar className="h-3.5 w-3.5" filled />
                  </span>
                )}

                <div className="flex items-center gap-1 p-3">
                  <Link
                    to="/note/$id"
                    params={{ id: n.id }}
                    className="mr-auto min-w-0 leading-tight"
                  >
                    <p className="truncate text-sm font-medium">{n.title || "Untitled note"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {fmt(n.updatedAt)} · {n.strokeCount} strokes
                    </p>
                  </Link>
                  <CardActions note={n} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="overflow-hidden rounded-3xl border border-border bg-card">
            {filtered.map((n, i) => (
              <li
                key={n.id}
                className={cn(
                  "group flex items-center gap-3 p-3 transition-colors hover:bg-accent/50",
                  i > 0 && "border-t border-border",
                )}
              >
                <Link
                  to="/note/$id"
                  params={{ id: n.id }}
                  className="h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-border"
                >
                  {n.strokeCount ? (
                    <NoteThumb strokes={getStrokes(n.id)} theme={n.theme} />
                  ) : (
                    <span
                      data-theme={n.theme}
                      className="block h-full w-full"
                      style={{ background: "var(--canvas-paper)" }}
                    />
                  )}
                </Link>
                <Link
                  to="/note/$id"
                  params={{ id: n.id }}
                  className="mr-auto min-w-0 leading-tight"
                >
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {n.title || "Untitled note"}
                    {n.favorite && <MarkStar className="h-3.5 w-3.5 text-primary" filled />}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {fmt(n.updatedAt)} · {n.strokeCount} strokes ·{" "}
                    {THEMES.find((t) => t.id === n.theme)?.name}
                  </p>
                </Link>
                <CardActions note={n} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="leading-tight">
      <span className="block font-display text-sm text-foreground">{value}</span>
      <span className="block text-[10px] uppercase tracking-widest">{label}</span>
    </span>
  );
}

function CardActions({ note }: { note: NoteMeta }) {
  const btn =
    "grid h-8 w-8 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
  return (
    <div className="flex items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
      <button
        aria-label={note.favorite ? "Unstar note" : "Star note"}
        onClick={() => updateNote(note.id, { favorite: !note.favorite }, false)}
        className={cn(btn, note.favorite && "text-primary")}
      >
        <MarkStar className="h-4 w-4" filled={note.favorite} />
      </button>
      <button aria-label="Duplicate note" onClick={() => duplicateNote(note.id)} className={btn}>
        <MarkDuplicate className="h-4 w-4" />
      </button>
      <button
        aria-label="Delete note"
        onClick={() => {
          if (confirm(`Delete "${note.title || "Untitled note"}"? This cannot be undone.`))
            deleteNote(note.id);
        }}
        className={cn(btn, "hover:text-destructive")}
      >
        <MarkTrash className="h-4 w-4" />
      </button>
    </div>
  );
}
