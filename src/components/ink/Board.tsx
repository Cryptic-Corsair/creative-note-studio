import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  brushStyle,
  clamp,
  computeBounds,
  MAX_ZOOM,
  MIN_ZOOM,
  pointNearStroke,
  shouldAddPoint,
  strokeInLasso,
  strokePath,
  toWorld,
  translateStroke,
  uid,
  type Brush,
  type Camera,
  type Pt,
  type Stroke,
} from "@/lib/ink";
import { Toolbar, type Tool } from "./Toolbar";
import { THEMES, type ThemeId } from "./palette";

const STORE_KEY = "inkwell.board.v1";

type Saved = { strokes: Stroke[]; cam: Camera; theme: ThemeId };

export function Board() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const strokesRef = useRef<Stroke[]>([]);
  const camRef = useRef<Camera>({ x: 0, y: 0, k: 1 });
  const liveRef = useRef<Stroke | null>(null);
  const lassoRef = useRef<Pt[] | null>(null);
  const selectionRef = useRef<Set<string>>(new Set());
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const gestureRef = useRef<
    | { mode: "none" }
    | { mode: "draw"; id: number }
    | { mode: "erase"; id: number }
    | { mode: "lasso"; id: number }
    | { mode: "pan"; id: number; lastX: number; lastY: number }
    | { mode: "move"; id: number; lastX: number; lastY: number }
    | { mode: "pinch"; startDist: number; startK: number; lastCx: number; lastCy: number }
  >({ mode: "none" });

  const historyRef = useRef<Stroke[][]>([[]]);
  const histIndexRef = useRef(0);
  const dirtyRef = useRef(false);
  const rafRef = useRef(0);

  const [tool, setTool] = useState<Tool>("pen");
  const [brush, setBrush] = useState<Brush>({ kind: "solid", color: "#111318" });
  const [size, setSize] = useState(4);
  const [theme, setTheme] = useState<ThemeId>("graphite");
  const [zoom, setZoom] = useState(1);
  const [hasSelection, setHasSelection] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const toolRef = useRef(tool);
  const brushRef = useRef(brush);
  const sizeRef = useRef(size);
  toolRef.current = tool;
  brushRef.current = brush;
  sizeRef.current = size;

  /* ---------------- rendering ---------------- */
  const requestDraw = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      draw();
    });
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const cam = camRef.current;
    const css = getComputedStyle(document.documentElement);
    const paper = css.getPropertyValue("--canvas-paper").trim() || "#ffffff";
    const dot = css.getPropertyValue("--canvas-dot").trim() || "#00000022";
    const accent = css.getPropertyValue("--canvas-accent").trim() || "#3b5bdb";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, w, h);

    // dot grid (adaptive)
    let step = 28;
    while (step * cam.k < 18) step *= 4;
    while (step * cam.k > 90) step /= 2;
    const sp = step * cam.k;
    const ox = ((cam.x % sp) + sp) % sp;
    const oy = ((cam.y % sp) + sp) % sp;
    ctx.fillStyle = dot;
    const r = clamp(cam.k, 0.6, 1.4);
    for (let x = ox; x < w; x += sp) {
      for (let y = oy; y < h; y += sp) {
        ctx.fillRect(x - r / 2, y - r / 2, r, r);
      }
    }

    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.k, cam.k);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const viewX0 = -cam.x / cam.k;
    const viewY0 = -cam.y / cam.k;
    const viewX1 = viewX0 + w / cam.k;
    const viewY1 = viewY0 + h / cam.k;

    const paint = (s: Stroke, selected: boolean) => {
      const b = s.bounds;
      const pad = s.width;
      if (b.x1 + pad < viewX0 || b.x0 - pad > viewX1 || b.y1 + pad < viewY0 || b.y0 - pad > viewY1)
        return;
      ctx.strokeStyle = brushStyle(ctx, s);
      ctx.lineWidth = s.width;
      ctx.globalAlpha = 1;
      ctx.stroke(strokePath(s.pts));
      if (selected) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = accent;
        ctx.lineWidth = s.width + 6 / cam.k;
        ctx.stroke(strokePath(s.pts));
        ctx.restore();
      }
    };

    const sel = selectionRef.current;
    for (const s of strokesRef.current) paint(s, sel.has(s.id));
    const live = liveRef.current;
    if (live) paint(live, false);

    const lasso = lassoRef.current;
    if (lasso && lasso.length > 1) {
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5 / cam.k;
      ctx.setLineDash([6 / cam.k, 5 / cam.k]);
      ctx.beginPath();
      ctx.moveTo(lasso[0]!.x, lasso[0]!.y);
      for (const p of lasso) ctx.lineTo(p.x, p.y);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }, []);

  /* ---------------- persistence ---------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Saved;
        if (Array.isArray(data.strokes)) {
          strokesRef.current = data.strokes;
          historyRef.current = [data.strokes];
        }
        if (data.cam) camRef.current = data.cam;
        if (data.theme && THEMES.some((t) => t.id === data.theme)) setTheme(data.theme);
        setZoom(camRef.current.k);
      }
    } catch {
      /* ignore corrupted store */
    }
    requestDraw();
  }, [requestDraw]);

  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
    requestDraw();
  }, [theme, requestDraw]);

  const save = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      try {
        const payload: Saved = { strokes: strokesRef.current, cam: camRef.current, theme };
        localStorage.setItem(STORE_KEY, JSON.stringify(payload));
      } catch {
        /* quota */
      }
    }, 1200);
    return () => clearInterval(t);
  }, [theme]);

  /* ---------------- history ---------------- */
  const commit = useCallback(
    (next: Stroke[]) => {
      strokesRef.current = next;
      const h = historyRef.current.slice(0, histIndexRef.current + 1);
      h.push(next);
      if (h.length > 80) h.shift();
      historyRef.current = h;
      histIndexRef.current = h.length - 1;
      setCanUndo(histIndexRef.current > 0);
      setCanRedo(false);
      save();
      requestDraw();
    },
    [requestDraw, save],
  );

  const jump = useCallback(
    (delta: number) => {
      const i = clamp(histIndexRef.current + delta, 0, historyRef.current.length - 1);
      if (i === histIndexRef.current) return;
      histIndexRef.current = i;
      strokesRef.current = historyRef.current[i] ?? [];
      selectionRef.current.clear();
      setHasSelection(false);
      setCanUndo(i > 0);
      setCanRedo(i < historyRef.current.length - 1);
      save();
      requestDraw();
    },
    [requestDraw, save],
  );

  /* ---------------- camera helpers ---------------- */
  const zoomAt = useCallback(
    (px: number, py: number, factor: number) => {
      const cam = camRef.current;
      const next = clamp(cam.k * factor, MIN_ZOOM, MAX_ZOOM);
      const ratio = next / cam.k;
      camRef.current = {
        k: next,
        x: px - (px - cam.x) * ratio,
        y: py - (py - cam.y) * ratio,
      };
      setZoom(next);
      save();
      requestDraw();
    },
    [requestDraw, save],
  );

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1;
      if (e.ctrlKey || e.metaKey) {
        zoomAt(px, py, Math.exp(-e.deltaY * scale * 0.0025));
      } else {
        const cam = camRef.current;
        camRef.current = { ...cam, x: cam.x - e.deltaX * scale, y: cam.y - e.deltaY * scale };
        save();
        requestDraw();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt, requestDraw, save]);

  useEffect(() => {
    const onResize = () => requestDraw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [requestDraw]);

  const deleteSelection = useCallback(() => {
    if (selectionRef.current.size === 0) return;
    const next = strokesRef.current.filter((s) => !selectionRef.current.has(s.id));
    selectionRef.current.clear();
    setHasSelection(false);
    commit(next);
  }, [commit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        jump(e.shiftKey ? 1 : -1);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectionRef.current.size) {
          e.preventDefault();
          deleteSelection();
        }
        return;
      }
      if (e.target instanceof HTMLInputElement) return;
      const map: Record<string, Tool> = { p: "pen", e: "eraser", l: "lasso", h: "hand", v: "hand" };
      const t = map[e.key.toLowerCase()];
      if (t) setTool(t);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump, deleteSelection]);

  /* ---------------- pointer input ---------------- */
  const localPoint = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const eraseAt = (wx: number, wy: number) => {
    const r = Math.max(6, sizeRef.current * 2) / camRef.current.k;
    const kept = strokesRef.current.filter((s) => !pointNearStroke(s, wx, wy, r));
    if (kept.length !== strokesRef.current.length) {
      strokesRef.current = kept;
      requestDraw();
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const { x, y } = localPoint(e);
    pointersRef.current.set(e.pointerId, { x, y });

    if (pointersRef.current.size === 2) {
      // discard in-progress stroke, enter pinch
      liveRef.current = null;
      lassoRef.current = null;
      const pts = [...pointersRef.current.values()];
      const a = pts[0]!;
      const b = pts[1]!;
      gestureRef.current = {
        mode: "pinch",
        startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        startK: camRef.current.k,
        lastCx: (a.x + b.x) / 2,
        lastCy: (a.y + b.y) / 2,
      };
      requestDraw();
      return;
    }
    if (pointersRef.current.size > 2) return;

    const world = toWorld(camRef.current, x, y);
    const middle = e.button === 1;
    const activeTool = toolRef.current;

    if (activeTool === "hand" || middle || e.pointerType === "touch" === false && e.shiftKey && activeTool === "pen" && false) {
      gestureRef.current = { mode: "pan", id: e.pointerId, lastX: x, lastY: y };
      return;
    }

    if (activeTool === "lasso") {
      const sel = selectionRef.current;
      if (sel.size) {
        const hit = strokesRef.current.some(
          (s) => sel.has(s.id) && pointNearStroke(s, world.x, world.y, 12 / camRef.current.k),
        );
        if (hit) {
          gestureRef.current = { mode: "move", id: e.pointerId, lastX: world.x, lastY: world.y };
          return;
        }
        sel.clear();
        setHasSelection(false);
      }
      lassoRef.current = [{ x: world.x, y: world.y, p: 1 }];
      gestureRef.current = { mode: "lasso", id: e.pointerId };
      requestDraw();
      return;
    }

    if (activeTool === "eraser") {
      gestureRef.current = { mode: "erase", id: e.pointerId };
      eraseAt(world.x, world.y);
      return;
    }

    // pen
    const pressure = e.pointerType === "pen" ? clamp(e.pressure || 0.5, 0.15, 1) : 0.7;
    liveRef.current = {
      id: uid(),
      pts: [{ x: world.x, y: world.y, p: pressure }],
      width: sizeRef.current * (0.75 + pressure * 0.5),
      brush: brushRef.current,
      bounds: { x0: world.x, y0: world.y, x1: world.x, y1: world.y },
    };
    gestureRef.current = { mode: "draw", id: e.pointerId };
    requestDraw();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    const { x, y } = localPoint(e);
    pointersRef.current.set(e.pointerId, { x, y });
    const g = gestureRef.current;

    if (g.mode === "pinch") {
      const pts = [...pointersRef.current.values()];
      const a = pts[0];
      const b = pts[1];
      if (!a || !b) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const cam = camRef.current;
      const nextK = clamp(g.startK * (dist / g.startDist), MIN_ZOOM, MAX_ZOOM);
      const ratio = nextK / cam.k;
      camRef.current = {
        k: nextK,
        x: cx - (cx - cam.x) * ratio + (cx - g.lastCx),
        y: cy - (cy - cam.y) * ratio + (cy - g.lastCy),
      };
      g.lastCx = cx;
      g.lastCy = cy;
      setZoom(nextK);
      requestDraw();
      return;
    }

    if (g.mode === "none" || g.id !== e.pointerId) return;
    const world = toWorld(camRef.current, x, y);

    if (g.mode === "pan") {
      const cam = camRef.current;
      camRef.current = { ...cam, x: cam.x + (x - g.lastX), y: cam.y + (y - g.lastY) };
      g.lastX = x;
      g.lastY = y;
      requestDraw();
      return;
    }

    if (g.mode === "erase") {
      eraseAt(world.x, world.y);
      return;
    }

    if (g.mode === "lasso") {
      const poly = lassoRef.current;
      if (!poly) return;
      const last = poly[poly.length - 1];
      if (shouldAddPoint(last, { x: world.x, y: world.y, p: 1 }, 3 / camRef.current.k)) {
        poly.push({ x: world.x, y: world.y, p: 1 });
        requestDraw();
      }
      return;
    }

    if (g.mode === "move") {
      const dx = world.x - g.lastX;
      const dy = world.y - g.lastY;
      g.lastX = world.x;
      g.lastY = world.y;
      const sel = selectionRef.current;
      strokesRef.current = strokesRef.current.map((s) =>
        sel.has(s.id) ? translateStroke(s, dx, dy) : s,
      );
      requestDraw();
      return;
    }

    if (g.mode === "draw") {
      const live = liveRef.current;
      if (!live) return;
      const events =
        typeof e.nativeEvent.getCoalescedEvents === "function"
          ? e.nativeEvent.getCoalescedEvents()
          : [e.nativeEvent];
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      for (const ev of events.length ? events : [e.nativeEvent]) {
        const w = toWorld(camRef.current, ev.clientX - rect.left, ev.clientY - rect.top);
        const pt: Pt = {
          x: w.x,
          y: w.y,
          p: e.pointerType === "pen" ? clamp(ev.pressure || 0.5, 0.15, 1) : 0.7,
        };
        if (shouldAddPoint(live.pts[live.pts.length - 1], pt, 1.2 / camRef.current.k)) {
          live.pts.push(pt);
          const b = live.bounds;
          b.x0 = Math.min(b.x0, pt.x);
          b.y0 = Math.min(b.y0, pt.y);
          b.x1 = Math.max(b.x1, pt.x);
          b.y1 = Math.max(b.y1, pt.y);
        }
      }
      requestDraw();
    }
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    const g = gestureRef.current;

    if (g.mode === "pinch") {
      if (pointersRef.current.size < 2) gestureRef.current = { mode: "none" };
      save();
      return;
    }
    if (g.mode === "none" || g.id !== e.pointerId) return;
    gestureRef.current = { mode: "none" };

    if (g.mode === "draw") {
      const live = liveRef.current;
      liveRef.current = null;
      if (live && live.pts.length > 0) {
        live.bounds = computeBounds(live.pts);
        commit([...strokesRef.current, live]);
      } else {
        requestDraw();
      }
      return;
    }
    if (g.mode === "erase" || g.mode === "move") {
      commit([...strokesRef.current]);
      return;
    }
    if (g.mode === "lasso") {
      const poly = lassoRef.current;
      lassoRef.current = null;
      const sel = selectionRef.current;
      sel.clear();
      if (poly && poly.length > 2) {
        for (const s of strokesRef.current) if (strokeInLasso(s, poly)) sel.add(s.id);
      }
      setHasSelection(sel.size > 0);
      requestDraw();
      return;
    }
    save();
  };

  const cursor = useMemo(() => {
    if (tool === "hand") return "grab";
    if (tool === "lasso") return "crosshair";
    return "crosshair";
  }, [tool]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <div
        ref={wrapRef}
        className="absolute inset-0 touch-none select-none"
        style={{ cursor }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onContextMenu={(e) => e.preventDefault()}
      >
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>

      <Toolbar
        tool={tool}
        setTool={setTool}
        brush={brush}
        setBrush={setBrush}
        size={size}
        setSize={setSize}
        theme={theme}
        setTheme={setTheme}
        zoom={zoom}
        canUndo={canUndo}
        canRedo={canRedo}
        hasSelection={hasSelection}
        onUndo={() => jump(-1)}
        onRedo={() => jump(1)}
        onDeleteSelection={deleteSelection}
        onResetView={() => {
          camRef.current = { x: 0, y: 0, k: 1 };
          setZoom(1);
          save();
          requestDraw();
        }}
        onClear={() => {
          selectionRef.current.clear();
          setHasSelection(false);
          commit([]);
        }}
      />
    </div>
  );
}
