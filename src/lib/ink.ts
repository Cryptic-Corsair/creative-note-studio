export type Brush =
  { kind: "solid"; color: string } | { kind: "gradient"; from: string; to: string };

/** Pen personalities. */
export type PenStyle = "ink" | "fountain" | "marker" | "pencil" | "highlighter";

export type Pt = { x: number; y: number; p: number };

export type Stroke = {
  id: string;
  pts: Pt[];
  width: number;
  brush: Brush;
  style?: PenStyle;
  opacity?: number;
  /** cached bounds in world space */
  bounds: { x0: number; y0: number; x1: number; y1: number };
};

export type Camera = { x: number; y: number; k: number };

export const uid = () => Math.random().toString(36).slice(2, 10);

export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 6;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export const PEN_STYLES: { id: PenStyle; name: string; opacity: number; hint: string }[] = [
  { id: "ink", name: "Ballpoint", opacity: 1, hint: "Crisp, even line" },
  { id: "fountain", name: "Fountain", opacity: 1, hint: "Pressure tapered" },
  { id: "marker", name: "Marker", opacity: 0.9, hint: "Bold and flat" },
  { id: "pencil", name: "Pencil", opacity: 0.75, hint: "Soft grain" },
  { id: "highlighter", name: "Highlighter", opacity: 0.32, hint: "Translucent wash" },
];

export function toWorld(cam: Camera, sx: number, sy: number) {
  return { x: (sx - cam.x) / cam.k, y: (sy - cam.y) / cam.k };
}

export function computeBounds(pts: Pt[]) {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const p of pts) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  if (!isFinite(x0)) return { x0: 0, y0: 0, x1: 0, y1: 0 };
  return { x0, y0, x1, y1 };
}

/** Simplify while drawing: skip points closer than `min` world units. */
export function shouldAddPoint(last: Pt | undefined, p: Pt, min: number) {
  if (!last) return true;
  return Math.hypot(p.x - last.x, p.y - last.y) >= min;
}

export function strokePath(pts: Pt[]) {
  const path = new Path2D();
  if (pts.length === 0) return path;
  const first = pts[0]!;
  if (pts.length < 3) {
    const l = pts[pts.length - 1]!;
    path.moveTo(first.x, first.y);
    path.lineTo(l.x + 0.01, l.y + 0.01);
    return path;
  }
  path.moveTo(first.x, first.y);
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    path.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
  const last = pts[pts.length - 1]!;
  path.lineTo(last.x, last.y);
  return path;
}

export function brushStyle(ctx: CanvasRenderingContext2D, s: Stroke): string | CanvasGradient {
  if (s.brush.kind === "solid") return s.brush.color;
  const { x0, y0, x1, y1 } = s.bounds;
  const g = ctx.createLinearGradient(x0, y0, x1 === x0 && y1 === y0 ? x0 + 1 : x1, y1);
  g.addColorStop(0, s.brush.from);
  g.addColorStop(1, s.brush.to);
  return g;
}

/** Draw a stroke honouring its pen style. Assumes ctx is in world space. */
export function renderStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  const style = s.style ?? "ink";
  const paint = brushStyle(ctx, s);
  const alpha = s.opacity ?? 1;

  ctx.save();
  ctx.lineCap = style === "highlighter" || style === "marker" ? "butt" : "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = paint;
  ctx.globalAlpha = alpha;

  if (style === "fountain" && s.pts.length > 2) {
    for (let i = 0; i < s.pts.length - 1; i++) {
      const a = s.pts[i]!;
      const b = s.pts[i + 1]!;
      const t = i / (s.pts.length - 1);
      const taper = Math.min(1, Math.sin(Math.PI * clamp(t, 0, 1)) * 1.6 + 0.35);
      ctx.lineWidth = Math.max(0.4, s.width * (0.45 + ((a.p + b.p) / 2) * 0.75) * taper);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  const path = strokePath(s.pts);
  if (style === "pencil") {
    ctx.lineWidth = s.width;
    ctx.stroke(path);
    ctx.globalAlpha = alpha * 0.4;
    ctx.lineWidth = s.width * 1.7;
    ctx.stroke(path);
    ctx.restore();
    return;
  }

  ctx.lineWidth = style === "highlighter" ? s.width * 2.4 : s.width;
  ctx.stroke(path);
  ctx.restore();
}

export function pointNearStroke(s: Stroke, x: number, y: number, r: number) {
  const b = s.bounds;
  const pad = r + s.width;
  if (x < b.x0 - pad || x > b.x1 + pad || y < b.y0 - pad || y > b.y1 + pad) return false;
  const rr = (r + s.width / 2) ** 2;
  for (let i = 0; i < s.pts.length - 1; i++) {
    if (distSqToSeg(x, y, s.pts[i]!, s.pts[i + 1]!) <= rr) return true;
  }
  if (s.pts.length === 1) {
    const p = s.pts[0]!;
    return (p.x - x) ** 2 + (p.y - y) ** 2 <= rr;
  }
  return false;
}

function distSqToSeg(x: number, y: number, a: Pt, b: Pt) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  let t = len === 0 ? 0 : ((x - a.x) * dx + (y - a.y) * dy) / len;
  t = clamp(t, 0, 1);
  const px = a.x + t * dx - x;
  const py = a.y + t * dy - y;
  return px * px + py * py;
}

/**
 * Precision eraser: remove only the points inside the eraser disc and return
 * the surviving fragments as independent strokes.
 */
export function splitStrokeByEraser(s: Stroke, x: number, y: number, r: number): Stroke[] {
  const rr = (r + s.width / 2) ** 2;
  const runs: Pt[][] = [];
  let run: Pt[] = [];
  for (const p of s.pts) {
    const hit = (p.x - x) ** 2 + (p.y - y) ** 2 <= rr;
    if (hit) {
      if (run.length) runs.push(run);
      run = [];
    } else {
      run.push(p);
    }
  }
  if (run.length) runs.push(run);
  if (runs.length === 1 && runs[0]!.length === s.pts.length) return [s];
  return runs.map((pts, i) => ({
    ...s,
    id: i === 0 ? s.id : uid(),
    pts,
    bounds: computeBounds(pts),
  }));
}

export function pointInPolygon(poly: Pt[], x: number, y: number) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i]!.x,
      yi = poly[i]!.y,
      xj = poly[j]!.x,
      yj = poly[j]!.y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function strokeInLasso(s: Stroke, poly: Pt[], strict = true) {
  let hits = 0;
  for (const p of s.pts) if (pointInPolygon(poly, p.x, p.y)) hits++;
  return strict ? hits > 0 && hits >= s.pts.length * 0.5 : hits > 0;
}

export function translateStroke(s: Stroke, dx: number, dy: number): Stroke {
  const pts = s.pts.map((p) => ({ x: p.x + dx, y: p.y + dy, p: p.p }));
  return {
    ...s,
    pts,
    bounds: {
      x0: s.bounds.x0 + dx,
      y0: s.bounds.y0 + dy,
      x1: s.bounds.x1 + dx,
      y1: s.bounds.y1 + dy,
    },
  };
}

export function scaleStroke(s: Stroke, cx: number, cy: number, f: number): Stroke {
  const pts = s.pts.map((p) => ({ x: cx + (p.x - cx) * f, y: cy + (p.y - cy) * f, p: p.p }));
  return { ...s, pts, width: s.width * f, bounds: computeBounds(pts) };
}

export function rotateStroke(s: Stroke, cx: number, cy: number, rad: number): Stroke {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const pts = s.pts.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos, p: p.p };
  });
  return { ...s, pts, bounds: computeBounds(pts) };
}

export function boundsOf(strokes: Stroke[]) {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const s of strokes) {
    x0 = Math.min(x0, s.bounds.x0);
    y0 = Math.min(y0, s.bounds.y0);
    x1 = Math.max(x1, s.bounds.x1);
    y1 = Math.max(y1, s.bounds.y1);
  }
  if (!isFinite(x0)) return null;
  return { x0, y0, x1, y1 };
}

/** Snap the end of a stroke to a straight line / 15° increments. */
export function straighten(pts: Pt[], snapAngle: boolean): Pt[] {
  if (pts.length < 2) return pts;
  const a = pts[0]!;
  let b = pts[pts.length - 1]!;
  if (snapAngle) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const step = Math.PI / 12;
    const ang = Math.round(Math.atan2(dy, dx) / step) * step;
    b = { x: a.x + Math.cos(ang) * len, y: a.y + Math.sin(ang) * len, p: b.p };
  }
  return [a, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, p: (a.p + b.p) / 2 }, b];
}
