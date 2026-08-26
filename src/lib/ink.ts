export type Brush =
  | { kind: "solid"; color: string }
  | { kind: "gradient"; from: string; to: string };

export type Pt = { x: number; y: number; p: number };

export type Stroke = {
  id: string;
  pts: Pt[];
  width: number;
  brush: Brush;
  /** cached bounds in world space */
  bounds: { x0: number; y0: number; x1: number; y1: number };
};

export type Camera = { x: number; y: number; k: number };

export const uid = () => Math.random().toString(36).slice(2, 10);

export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 6;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

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

export function strokeInLasso(s: Stroke, poly: Pt[]) {
  let hits = 0;
  for (const p of s.pts) if (pointInPolygon(poly, p.x, p.y)) hits++;
  return hits > 0 && hits >= s.pts.length * 0.5;
}

export function translateStroke(s: Stroke, dx: number, dy: number): Stroke {
  const pts = s.pts.map((p) => ({ x: p.x + dx, y: p.y + dy, p: p.p }));
  return {
    ...s,
    pts,
    bounds: { x0: s.bounds.x0 + dx, y0: s.bounds.y0 + dy, x1: s.bounds.x1 + dx, y1: s.bounds.y1 + dy },
  };
}
