/**
 * Converts a flat binary mask (Float32Array) from the TFLite model
 * into an SVG path string in the app's coordinate space.
 *
 * The app's SVG coordinate space uses 1000 units for the image width.
 */

interface Point { x: number; y: number; }

/**
 * Normalized crop region within the full image (values 0–1).
 * When provided, mask coordinates are mapped into the full-image SVG space.
 */
export interface CropRegion {
    left: number;
    top: number;
    width: number;
    height: number;
}

const MIN_FOREGROUND_PIXELS  = 50;
const MAX_FOREGROUND_RATIO   = 0.04;
// How many Laplacian smoothing passes to run on the raw boundary before
// path simplification. More passes = rounder/smoother outline, less detail.
const BOUNDARY_SMOOTH_PASSES = 15;

export function maskToSvgPath(
    mask: Float32Array,
    maskW: number,
    maskH: number,
    svgW: number,
    svgH: number,
    crop?: CropRegion,
): string | null {
    const foregroundCount = countForeground(mask);
    if (foregroundCount < MIN_FOREGROUND_PIXELS) return null;
    if (foregroundCount > mask.length * MAX_FOREGROUND_RATIO) return null;

    // 1. Trace the boundary in order (no crossing, no jumps)
    const rawBoundary = mooreBoundaryTrace(mask, maskW, maskH);
    if (rawBoundary.length < 4) return null;

    // 1b. Laplacian smoothing to reduce pixel-grid staircase bumps
    const boundary = laplacianSmooth(rawBoundary, BOUNDARY_SMOOTH_PASSES);

    // 2. Stride-subsample before Douglas-Peucker so DP stays fast.
    //    Target ≤ 200 input points regardless of hold size.
    const stride = Math.max(1, Math.ceil(boundary.length / 200));
    const sampled = stride === 1 ? boundary : boundary.filter((_, i) => i % stride === 0);

    // 3. Simplify with Douglas-Peucker (lower tolerance = more points = better fit)
    const simplified = douglasPeucker(sampled, 0.5);
    if (simplified.length < 3) return null;

    // 3. Scale from mask-local space to SVG space (accounting for crop)
    const scaleX  = crop ? svgW * crop.width  / maskW : svgW / maskW;
    const scaleY  = crop ? svgH * crop.height / maskH : svgH / maskH;
    const offsetX = crop ? svgW * crop.left : 0;
    const offsetY = crop ? svgH * crop.top  : 0;

    const pts = simplified.map(({ x, y }) => ({
        x: x * scaleX + offsetX,
        y: y * scaleY + offsetY,
    }));

    // 4. Emit a smooth closed curve using quadratic beziers through midpoints.
    //    Midpoint-based smoothing: the curve passes through midpoints and uses
    //    the original points as control points — guaranteed C1 continuous, no spikes.
    return smoothClosedPath(pts);
}

// ─── Laplacian boundary smoothing ────────────────────────────────────────────
// Each pass blends every point toward the average of its two neighbors.
// Runs on a closed loop so the seam is seamless.

function laplacianSmooth(pts: Point[], passes: number): Point[] {
    let cur = pts;
    for (let p = 0; p < passes; p++) {
        const n = cur.length;
        cur = cur.map((pt, i) => {
            const prev = cur[(i - 1 + n) % n];
            const next = cur[(i + 1) % n];
            return {
                x: (prev.x + pt.x + next.x) / 3,
                y: (prev.y + pt.y + next.y) / 3,
            };
        });
    }
    return cur;
}

// ─── Moore boundary tracing ───────────────────────────────────────────────────
// Walks the actual perimeter pixel-by-pixel, so the result is always an ordered,
// non-self-intersecting boundary — no jumping, no spikes from bad ordering.

function mooreBoundaryTrace(mask: Float32Array, w: number, h: number): Point[] {
    // Clockwise neighbors: E, SE, S, SW, W, NW, N, NE
    const dx = [ 1,  1,  0, -1, -1, -1,  0,  1];
    const dy = [ 0,  1,  1,  1,  0, -1, -1, -1];

    const get = (x: number, y: number) =>
        x >= 0 && x < w && y >= 0 && y < h && mask[y * w + x] > 0.5;

    // Find top-left foreground pixel as starting point
    let sx = -1, sy = -1;
    outer: for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (get(x, y)) { sx = x; sy = y; break outer; }
        }
    }
    if (sx === -1) return [];

    const boundary: Point[] = [];
    let cx = sx, cy = sy;
    // We entered the start pixel from the west (background is to the left of topmost pixel)
    let backX = sx - 1, backY = sy;
    const startBackX = backX, startBackY = backY;

    const limit = w * h * 2;
    let iter = 0;

    do {
        boundary.push({ x: cx, y: cy });

        // Find which direction index points toward the backtrack pixel
        let bd = -1;
        for (let i = 0; i < 8; i++) {
            if (cx + dx[i] === backX && cy + dy[i] === backY) { bd = i; break; }
        }
        if (bd === -1) break;

        // Rotate clockwise from bd until we find the next foreground neighbor
        let nextX = -1, nextY = -1, newBackX = 0, newBackY = 0;
        for (let i = 1; i <= 8; i++) {
            const d  = (bd + i) % 8;
            const nx = cx + dx[d];
            const ny = cy + dy[d];
            if (get(nx, ny)) {
                nextX = nx; nextY = ny;
                // The new backtrack is the last background pixel we checked
                const pd = (d - 1 + 8) % 8;
                newBackX = cx + dx[pd];
                newBackY = cy + dy[pd];
                break;
            }
        }

        if (nextX === -1) break;

        backX = newBackX; backY = newBackY;
        cx = nextX;       cy = nextY;

        if (++iter > limit) break;
    } while (cx !== sx || cy !== sy || backX !== startBackX || backY !== startBackY);

    return boundary;
}

// ─── Corner-rounding SVG path ─────────────────────────────────────────────────
// Draws straight lines along the edges of the polygon (accurate to the shape)
// and adds a tiny quadratic bezier only at each corner to avoid hard spikes.
//
// CORNER_RADIUS controls the rounding in SVG units (out of 1000 total width).
// 6 ≈ 0.6% of image width — barely visible but enough to eliminate spikes.

const CORNER_RADIUS = 6;

function smoothClosedPath(pts: Point[]): string {
    const n = pts.length;
    const fmt = (p: Point) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;

    // For each vertex compute the two "near" points flanking it:
    //   inPt  = point CORNER_RADIUS units back along the incoming edge
    //   outPt = point CORNER_RADIUS units forward along the outgoing edge
    const corners = pts.map((p, i) => {
        const prev = pts[(i - 1 + n) % n];
        const next = pts[(i + 1) % n];

        const dIn  = Math.sqrt((p.x - prev.x) ** 2 + (p.y - prev.y) ** 2) || 1;
        const dOut = Math.sqrt((next.x - p.x) ** 2 + (next.y - p.y) ** 2) || 1;

        const tIn  = Math.min(CORNER_RADIUS / dIn,  0.5);
        const tOut = Math.min(CORNER_RADIUS / dOut, 0.5);

        return {
            inPt:  { x: p.x + tIn  * (prev.x - p.x), y: p.y + tIn  * (prev.y - p.y) },
            ctrl:  p,
            outPt: { x: p.x + tOut * (next.x - p.x), y: p.y + tOut * (next.y - p.y) },
        };
    });

    // Start just past the first corner
    let d = `M${fmt(corners[0].outPt)}`;
    for (let i = 0; i < n; i++) {
        const c = corners[(i + 1) % n];
        d += ` L${fmt(c.inPt)}`;          // straight line along the edge
        d += ` Q${fmt(c.ctrl)} ${fmt(c.outPt)}`; // tiny arc around the corner
    }

    return d + ' Z';
}

// ─── Douglas-Peucker path simplification ─────────────────────────────────────

function douglasPeucker(points: Point[], tolerance: number): Point[] {
    if (points.length <= 2) return points;

    let maxDist = 0, maxIdx = 0;
    const first = points[0], last = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
        const d = perpendicularDistance(points[i], first, last);
        if (d > maxDist) { maxDist = d; maxIdx = i; }
    }

    if (maxDist > tolerance) {
        const left  = douglasPeucker(points.slice(0, maxIdx + 1), tolerance);
        const right = douglasPeucker(points.slice(maxIdx),        tolerance);
        return [...left.slice(0, -1), ...right];
    }
    return [first, last];
}

function perpendicularDistance(p: Point, a: Point, b: Point): number {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return Math.sqrt((p.x - a.x) ** 2 + (p.y - a.y) ** 2);
    return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / len;
}

function countForeground(mask: Float32Array): number {
    let n = 0;
    for (let i = 0; i < mask.length; i++) if (mask[i] > 0.5) n++;
    return n;
}
