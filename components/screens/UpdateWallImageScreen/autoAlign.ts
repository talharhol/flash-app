import { AlphaType, ColorType, Skia } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system';
import { type LightGlueMatch, matchLightGlueLocal } from './lightGlueLocal';

const FINE = 512;
const WARP = 2048;


async function loadGray(
    uri: string,
): Promise<{ gray: Uint8Array; w: number; h: number } | null> {
    try {
        const data = await Skia.Data.fromURI(uri);
        const src = Skia.Image.MakeImageFromEncoded(data);
        if (!src) return null;
        const w = src.width(), h = src.height();

        const surface = Skia.Surface.Make(FINE, FINE);
        if (!surface) return null;
        surface.getCanvas().drawImageRect(
            src,
            { x: 0, y: 0, width: w, height: h },
            { x: 0, y: 0, width: FINE, height: FINE },
            Skia.Paint(),
        );
        surface.flush();
        const snap = surface.makeImageSnapshot();

        // Always use RGBA → manual Rec.601 to match Python reference exactly.
        // Gray_8 uses Rec.709 weights (different luma coefficients) which can
        // cause subtle differences that break self-match in SuperPoint.
        const rgba = snap.readPixels(0, 0, {
            width: FINE, height: FINE,
            colorType: ColorType.RGBA_8888,
            alphaType: AlphaType.Unpremul,
        });
        if (!(rgba instanceof Uint8Array)) return null;
        const gray = new Uint8Array(FINE * FINE);
        for (let i = 0; i < FINE * FINE; i++) {
            gray[i] = (0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2]) | 0;
        }
        return { gray, w, h };
    } catch {
        return null;
    }
}

// ── RANSAC (homography model for inlier detection only) ──────────────────────

function solve8(A: number[][], b: number[]): number[] | null {
    const n = 8;
    const M = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col++) {
        let p = col;
        for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[p][col])) p = r;
        if (col !== p) [M[col], M[p]] = [M[p], M[col]];
        if (Math.abs(M[col][col]) < 1e-10) return null;
        const d = M[col][col];
        for (let k = col; k <= n; k++) M[col][k] /= d;
        for (let r = 0; r < n; r++) {
            if (r === col) continue;
            const f = M[r][col];
            for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k];
        }
    }
    return M.map(row => row[n]);
}

function computeH(src: [number, number][], dst: [number, number][]): number[] | null {
    const A: number[][] = [], b: number[] = [];
    for (let i = 0; i < 4; i++) {
        const [x, y] = src[i], [xp, yp] = dst[i];
        A.push([-x, -y, -1, 0, 0, 0, x * xp, y * xp]);
        A.push([0, 0, 0, -x, -y, -1, x * yp, y * yp]);
        b.push(-xp, -yp);
    }
    const h = solve8(A, b);
    return h ? [...h, 1] : null;
}

function applyH(h: number[], x: number, y: number): [number, number] {
    const w = h[6] * x + h[7] * y + h[8];
    return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w];
}

function sampleIndices(n: number, k: number): number[] {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i >= n - k; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(n - k);
}

interface InlierPt { sx: number; sy: number; dx: number; dy: number; }

// Returns RANSAC inliers in FINE pixel coords: sx/sy = new image, dx/dy = old image
function ransacInliers(
    matches: LightGlueMatch[],
    iterations = 500, threshold = 5,
): InlierPt[] | null {
    if (matches.length < 4) {
        console.log(`[AutoAlign] RANSAC skip: only ${matches.length} matches`);
        return null;
    }
    const pts: InlierPt[] = matches.map(m => ({
        sx: m.x1 * FINE, sy: m.y1 * FINE,
        dx: m.x0 * FINE, dy: m.y0 * FINE,
    }));

    let bestH: number[] | null = null;
    let bestCount = 0;

    for (let iter = 0; iter < iterations; iter++) {
        const idx = sampleIndices(pts.length, 4);
        const H = computeH(
            idx.map(i => [pts[i].sx, pts[i].sy] as [number, number]),
            idx.map(i => [pts[i].dx, pts[i].dy] as [number, number]),
        );
        if (!H) continue;
        let count = 0;
        for (const { sx, sy, dx, dy } of pts) {
            const [px, py] = applyH(H, sx, sy);
            if ((px - dx) ** 2 + (py - dy) ** 2 < threshold * threshold) count++;
        }
        if (count > bestCount) { bestCount = count; bestH = H; }
    }

    console.log(`[AutoAlign] RANSAC best inliers: ${bestCount}/${pts.length}`);
    if (!bestH || bestCount < 4) return null;

    const inliers = pts.filter(({ sx, sy, dx, dy }) => {
        const [px, py] = applyH(bestH!, sx, sy);
        return (px - dx) ** 2 + (py - dy) ** 2 < threshold * threshold;
    });
    return inliers.length >= 4 ? inliers : null;
}

// ── Thin Plate Spline ────────────────────────────────────────────────────────

// U(r²) = r² log(r²)
function tpsU(r2: number): number {
    return r2 < 1e-10 ? 0 : r2 * Math.log(r2);
}

// Solve n×n system (flat row-major Float64Array A) via Gaussian elimination
function solveN(A: Float64Array, b: Float64Array, n: number): Float64Array | null {
    const nc = n + 1;
    const M = new Float64Array(n * nc);
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) M[r * nc + c] = A[r * n + c];
        M[r * nc + n] = b[r];
    }
    for (let col = 0; col < n; col++) {
        let p = col;
        for (let r = col + 1; r < n; r++)
            if (Math.abs(M[r * nc + col]) > Math.abs(M[p * nc + col])) p = r;
        if (col !== p) {
            const ra = col * nc, rb = p * nc;
            for (let k = 0; k <= n; k++) {
                const t = M[ra + k]; M[ra + k] = M[rb + k]; M[rb + k] = t;
            }
        }
        const pivot = M[col * nc + col];
        if (Math.abs(pivot) < 1e-10) return null;
        const inv = 1 / pivot;
        for (let k = col; k <= n; k++) M[col * nc + k] *= inv;
        for (let r = 0; r < n; r++) {
            if (r === col) continue;
            const f = M[r * nc + col];
            if (Math.abs(f) < 1e-15) continue;
            const rc = col * nc;
            for (let k = col; k <= n; k++) M[r * nc + k] -= f * M[rc + k];
        }
    }
    const x = new Float64Array(n);
    for (let r = 0; r < n; r++) x[r] = M[r * nc + n];
    return x;
}

interface TpsModel {
    n: number;
    cx: Float64Array;  // domain control x (old FINE space)
    cy: Float64Array;  // domain control y
    wx: Float64Array;  // [w_0..w_{N-1}, a0, a1, a2] for x output
    wy: Float64Array;  // same for y output
}

// Small regularization to handle nearly-coincident control points
const TPS_LAMBDA = 1e-3;

// domX/domY: control points in old FINE space (where we query)
// rngX/rngY: corresponding points in new FINE space (what we sample)
function solveTps(
    domX: number[], domY: number[],
    rngX: number[], rngY: number[],
): TpsModel | null {
    const N = domX.length;
    const M = N + 3;
    const A = new Float64Array(M * M);

    // K block (N×N): pairwise kernel + regularization on diagonal
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            const dx = domX[i] - domX[j], dy = domY[i] - domY[j];
            A[i * M + j] = tpsU(dx * dx + dy * dy);
        }
        A[i * M + i] += TPS_LAMBDA;
    }
    // P block (N×3) and P' block (3×N)
    for (let i = 0; i < N; i++) {
        A[i * M + N]       = 1;  A[i * M + N + 1] = domX[i];  A[i * M + N + 2] = domY[i];
        A[N * M + i]       = 1;
        A[(N + 1) * M + i] = domX[i];
        A[(N + 2) * M + i] = domY[i];
    }
    // Bottom-right 3×3 stays zero

    const bx = new Float64Array(M), by = new Float64Array(M);
    for (let i = 0; i < N; i++) { bx[i] = rngX[i]; by[i] = rngY[i]; }

    const wx = solveN(A, bx, M);
    const wy = solveN(A, by, M);
    if (!wx || !wy) return null;

    return { n: N, cx: new Float64Array(domX), cy: new Float64Array(domY), wx, wy };
}

// Evaluate TPS at a single point in old FINE space → new FINE coords
function evalTps(m: TpsModel, x: number, y: number): [number, number] {
    const N = m.n;
    let fx = m.wx[N] + m.wx[N + 1] * x + m.wx[N + 2] * y;
    let fy = m.wy[N] + m.wy[N + 1] * x + m.wy[N + 2] * y;
    for (let i = 0; i < N; i++) {
        const dx = x - m.cx[i], dy = y - m.cy[i];
        const u = tpsU(dx * dx + dy * dy);
        fx += m.wx[i] * u;
        fy += m.wy[i] * u;
    }
    return [fx, fy];
}

function bilinearSample(
    rgba: Uint8Array, x: number, y: number, W: number, H: number,
): [number, number, number, number] {
    if (x < 0 || x >= W || y < 0 || y >= H) return [0, 0, 0, 0];
    const x0 = x | 0, y0 = y | 0;
    const x1 = Math.min(x0 + 1, W - 1), y1 = Math.min(y0 + 1, H - 1);
    const fx = x - x0, fy = y - y0;
    const i00 = (y0 * W + x0) * 4, i01 = (y0 * W + x1) * 4;
    const i10 = (y1 * W + x0) * 4, i11 = (y1 * W + x1) * 4;
    const w00 = (1 - fx) * (1 - fy), w01 = fx * (1 - fy);
    const w10 = (1 - fx) * fy,       w11 = fx * fy;
    return [
        rgba[i00] * w00 + rgba[i01] * w01 + rgba[i10] * w10 + rgba[i11] * w11,
        rgba[i00+1]*w00 + rgba[i01+1]*w01 + rgba[i10+1]*w10 + rgba[i11+1]*w11,
        rgba[i00+2]*w00 + rgba[i01+2]*w01 + rgba[i10+2]*w10 + rgba[i11+2]*w11,
        rgba[i00+3]*w00 + rgba[i01+3]*w01 + rgba[i10+3]*w10 + rgba[i11+3]*w11,
    ];
}

// ── Warp ─────────────────────────────────────────────────────────────────────

async function warpNewImage(
    newUri: string,
    inliers: InlierPt[],
    oldW: number, oldH: number,
): Promise<string | null> {
    try {
        // Cap control points to bound TPS solve + eval cost
        const MAX_CP = 64;
        const pts = inliers.length > MAX_CP
            ? sampleIndices(inliers.length, MAX_CP).map(i => inliers[i])
            : inliers;

        // TPS: domain = old FINE coords, range = new FINE coords
        const model = solveTps(
            pts.map(p => p.dx), pts.map(p => p.dy),
            pts.map(p => p.sx), pts.map(p => p.sy),
        );
        if (!model) { console.log('[AutoAlign] TPS solve failed'); return null; }
        console.log(`[AutoAlign] TPS solved with ${model.n} control points`);

        // Scale new image to WARP×WARP
        const imgData = await Skia.Data.fromURI(newUri);
        const imgSrc = Skia.Image.MakeImageFromEncoded(imgData);
        if (!imgSrc) return null;
        const rawW = imgSrc.width(), rawH = imgSrc.height();

        const fineSurf = Skia.Surface.Make(WARP, WARP);
        if (!fineSurf) return null;
        fineSurf.getCanvas().drawImageRect(
            imgSrc,
            { x: 0, y: 0, width: rawW, height: rawH },
            { x: 0, y: 0, width: WARP, height: WARP },
            Skia.Paint(),
        );
        fineSurf.flush();
        const fineRgba = fineSurf.makeImageSnapshot().readPixels(0, 0, {
            width: WARP, height: WARP,
            colorType: ColorType.RGBA_8888,
            alphaType: AlphaType.Unpremul,
        });
        if (!(fineRgba instanceof Uint8Array)) return null;

        // TPS warp: iterate WARP space, map to FINE for TPS query, map result back to WARP for sampling
        const fineToWarp = WARP / FINE;
        const warpedRgba = new Uint8Array(WARP * WARP * 4);
        for (let py = 0; py < WARP; py++) {
            for (let px = 0; px < WARP; px++) {
                const [nx, ny] = evalTps(model, (px + 0.5) / fineToWarp, (py + 0.5) / fineToWarp);
                const [r, g, b, a] = bilinearSample(fineRgba, nx * fineToWarp - 0.5, ny * fineToWarp - 0.5, WARP, WARP);
                const idx = (py * WARP + px) * 4;
                warpedRgba[idx] = r; warpedRgba[idx+1] = g; warpedRgba[idx+2] = b; warpedRgba[idx+3] = a;
            }
        }

        // Make Skia image and scale to oldW×oldH
        const warpedImg = Skia.Image.MakeImage(
            { width: WARP, height: WARP, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
            Skia.Data.fromBytes(warpedRgba),
            WARP * 4,
        );
        if (!warpedImg) return null;

        const outSurf = Skia.Surface.Make(oldW, oldH);
        if (!outSurf) return null;
        outSurf.getCanvas().drawImageRect(
            warpedImg,
            { x: 0, y: 0, width: WARP, height: WARP },
            { x: 0, y: 0, width: oldW, height: oldH },
            Skia.Paint(),
        );
        outSurf.flush();
        const b64 = outSurf.makeImageSnapshot().encodeToBase64();

        const path = `${FileSystem.documentDirectory}warped_${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(path, b64, { encoding: FileSystem.EncodingType.Base64 });
        return path;
    } catch (e) {
        console.error('[warpNewImage] error:', e);
        return null;
    }
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function autoAlignLightGlue(
    oldUri: string, newUri: string, cW: number, cH: number,
): Promise<string | null> {
    try {
        console.log(`[AutoAlign] autoAlignLightGlue start, canvas=${cW}x${cH}`);
        const t0 = Date.now();

        const [oldInfo, newInfo] = await Promise.all([loadGray(oldUri), loadGray(newUri)]);
        if (!oldInfo || !newInfo) {
            console.log('[AutoAlign] loadGray failed:', !oldInfo ? 'old' : 'new');
            return null;
        }
        console.log(`[AutoAlign] images loaded: old=${oldInfo.w}x${oldInfo.h} new=${newInfo.w}x${newInfo.h} (${Date.now()-t0}ms)`);

        const matches = await matchLightGlueLocal(oldInfo.gray, newInfo.gray, FINE);
        console.log(`[AutoAlign] matches: ${matches.length} (${Date.now()-t0}ms)`);
        if (matches.length < 4) {
            console.log('[AutoAlign] too few matches, aborting');
            return null;
        }

        const inliers = ransacInliers(matches);
        if (!inliers) {
            console.log('[AutoAlign] RANSAC failed, aborting');
            return null;
        }
        console.log(`[AutoAlign] RANSAC inliers: ${inliers.length} (${Date.now()-t0}ms)`);

        const warpedUri = await warpNewImage(newUri, inliers, oldInfo.w, oldInfo.h);
        console.log(`[AutoAlign] TPS warp done → ${warpedUri} (${Date.now()-t0}ms total)`);
        return warpedUri;
    } catch (e) {
        console.error('Error in autoAlignLightGlue:', e);
        return null;
    }
}
