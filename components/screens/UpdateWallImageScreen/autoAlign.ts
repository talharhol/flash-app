import { AlphaType, ColorType, Skia } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system';
import {
    ColorConversionCodes,
    DataTypes,
    InterpolationFlags,
    ObjectType,
    OpenCV,
} from 'react-native-fast-opencv';
import { type LightGlueMatch, matchLightGlueLocal } from './lightGlueLocal';

const FINE = 512;
const WARP = 2048;
const FLOW_GRID = 128;

async function loadGray(
    uri: string,
): Promise<{ gray: Uint8Array; w: number; h: number } | null> {
    try {
        const data = await Skia.Data.fromURI(uri);
        const src = Skia.Image.MakeImageFromEncoded(data);
        if (!src) return null;

        const w = src.width();
        const h = src.height();

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

        const rgba = snap.readPixels(0, 0, {
            width: FINE,
            height: FINE,
            colorType: ColorType.RGBA_8888,
            alphaType: AlphaType.Unpremul,
        });

        if (!(rgba instanceof Uint8Array)) return null;

        const gray = new Uint8Array(FINE * FINE);

        for (let i = 0; i < FINE * FINE; i++) {
            gray[i] =
                (
                    0.299 * rgba[i * 4] +
                    0.587 * rgba[i * 4 + 1] +
                    0.114 * rgba[i * 4 + 2]
                ) | 0;
        }

        return { gray, w, h };
    } catch {
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RANSAC
// ─────────────────────────────────────────────────────────────────────────────

function solve8(A: number[][], b: number[]): number[] | null {
    const n = 8;
    const M = A.map((row, i) => [...row, b[i]]);

    for (let col = 0; col < n; col++) {
        let p = col;

        for (let r = col + 1; r < n; r++) {
            if (Math.abs(M[r][col]) > Math.abs(M[p][col])) p = r;
        }

        if (col !== p) [M[col], M[p]] = [M[p], M[col]];

        if (Math.abs(M[col][col]) < 1e-10) return null;

        const d = M[col][col];

        for (let k = col; k <= n; k++) M[col][k] /= d;

        for (let r = 0; r < n; r++) {
            if (r === col) continue;

            const f = M[r][col];

            for (let k = col; k <= n; k++) {
                M[r][k] -= f * M[col][k];
            }
        }
    }

    return M.map(row => row[n]);
}

function computeH(
    src: [number, number][],
    dst: [number, number][],
): number[] | null {
    const A: number[][] = [];
    const b: number[] = [];

    for (let i = 0; i < 4; i++) {
        const [x, y] = src[i];
        const [xp, yp] = dst[i];

        A.push([-x, -y, -1, 0, 0, 0, x * xp, y * xp]);
        A.push([0, 0, 0, -x, -y, -1, x * yp, y * yp]);

        b.push(-xp, -yp);
    }

    const h = solve8(A, b);

    return h ? [...h, 1] : null;
}

function applyH(
    h: number[],
    x: number,
    y: number,
): [number, number] {
    const w = h[6] * x + h[7] * y + h[8];

    return [
        (h[0] * x + h[1] * y + h[2]) / w,
        (h[3] * x + h[4] * y + h[5]) / w,
    ];
}

function sampleIndicesSpatial(
    pts: InlierPt[],
    k: number,
    grid = 8,
): InlierPt[] {
    if (pts.length <= k) {
        return pts;
    }

    // buckets
    const cells: number[][] = Array.from(
        { length: grid * grid },
        () => [],
    );

    for (let i = 0; i < pts.length; i++) {
        const p = pts[i];

        const gx = Math.min(
            grid - 1,
            Math.max(0, ((p.dx / FINE) * grid) | 0),
        );

        const gy = Math.min(
            grid - 1,
            Math.max(0, ((p.dy / FINE) * grid) | 0),
        );

        cells[gy * grid + gx].push(i);
    }

    // shuffle each bucket
    for (const bucket of cells) {
        for (let i = bucket.length - 1; i > 0; i--) {
            const j = (Math.random() * (i + 1)) | 0;
            [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
        }
    }

    const result: InlierPt[] = [];

    // round-robin sampling across cells
    let added = true;

    while (result.length < k && added) {
        added = false;

        for (const bucket of cells) {
            if (bucket.length > 0 && result.length < k) {
                result.push(pts[bucket.pop()!]);
                added = true;
            }
        }
    }

    return result;
}

function sampleIndices(n: number, k: number): number[] {
    const arr = Array.from({ length: n }, (_, i) => i);

    for (let i = n - 1; i >= n - k; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr.slice(n - k);
}

interface InlierPt {
    sx: number;
    sy: number;
    dx: number;
    dy: number;
}

function ransacInliers(
    matches: LightGlueMatch[],
    iterations = 500,
    threshold = 5,
): InlierPt[] | null {
    if (matches.length < 4) return null;

    const pts: InlierPt[] = matches.map(m => ({
        sx: m.x1 * FINE,
        sy: m.y1 * FINE,
        dx: m.x0 * FINE,
        dy: m.y0 * FINE,
    }));

    let bestH: number[] | null = null;
    let bestCount = 0;

    for (let iter = 0; iter < iterations; iter++) {
        const idx = sampleIndices(pts.length, 4);

        const H = computeH(
            idx.map(i => [pts[i].sx, pts[i].sy]),
            idx.map(i => [pts[i].dx, pts[i].dy]),
        );

        if (!H) continue;

        let count = 0;

        for (const { sx, sy, dx, dy } of pts) {
            const [px, py] = applyH(H, sx, sy);

            if ((px - dx) ** 2 + (py - dy) ** 2 < threshold * threshold) {
                count++;
            }
        }

        if (count > bestCount) {
            bestCount = count;
            bestH = H;
        }
    }

    if (!bestH || bestCount < 4) return null;

    return pts.filter(({ sx, sy, dx, dy }) => {
        const [px, py] = applyH(bestH!, sx, sy);

        return (px - dx) ** 2 + (py - dy) ** 2 < threshold * threshold;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// TPS
// ─────────────────────────────────────────────────────────────────────────────

function tpsU(r2: number): number {
    return r2 < 1e-10 ? 0 : r2 * Math.log(r2);
}

function solveN(
    A: Float64Array,
    b: Float64Array,
    n: number,
): Float64Array | null {
    const nc = n + 1;

    const M = new Float64Array(n * nc);

    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            M[r * nc + c] = A[r * n + c];
        }

        M[r * nc + n] = b[r];
    }

    for (let col = 0; col < n; col++) {
        let p = col;

        for (let r = col + 1; r < n; r++) {
            if (Math.abs(M[r * nc + col]) > Math.abs(M[p * nc + col])) {
                p = r;
            }
        }

        if (col !== p) {
            const ra = col * nc;
            const rb = p * nc;

            for (let k = 0; k <= n; k++) {
                const t = M[ra + k];
                M[ra + k] = M[rb + k];
                M[rb + k] = t;
            }
        }

        const pivot = M[col * nc + col];

        if (Math.abs(pivot) < 1e-10) return null;

        const inv = 1 / pivot;

        for (let k = col; k <= n; k++) {
            M[col * nc + k] *= inv;
        }

        for (let r = 0; r < n; r++) {
            if (r === col) continue;

            const f = M[r * nc + col];

            if (Math.abs(f) < 1e-15) continue;

            const rc = col * nc;

            for (let k = col; k <= n; k++) {
                M[r * nc + k] -= f * M[rc + k];
            }
        }
    }

    const x = new Float64Array(n);

    for (let r = 0; r < n; r++) {
        x[r] = M[r * nc + n];
    }

    return x;
}

interface TpsModel {
    n: number;
    cx: Float64Array;
    cy: Float64Array;
    wx: Float64Array;
    wy: Float64Array;
}

const TPS_LAMBDA = 1e-3;

function solveTps(
    domX: number[],
    domY: number[],
    rngX: number[],
    rngY: number[],
): TpsModel | null {
    const N = domX.length;
    const M = N + 3;

    const A = new Float64Array(M * M);

    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            const dx = domX[i] - domX[j];
            const dy = domY[i] - domY[j];

            A[i * M + j] = tpsU(dx * dx + dy * dy);
        }

        A[i * M + i] += TPS_LAMBDA;
    }

    for (let i = 0; i < N; i++) {
        A[i * M + N] = 1;
        A[i * M + N + 1] = domX[i];
        A[i * M + N + 2] = domY[i];

        A[N * M + i] = 1;
        A[(N + 1) * M + i] = domX[i];
        A[(N + 2) * M + i] = domY[i];
    }

    const bx = new Float64Array(M);
    const by = new Float64Array(M);

    for (let i = 0; i < N; i++) {
        bx[i] = rngX[i];
        by[i] = rngY[i];
    }

    const wx = solveN(A, bx, M);
    const wy = solveN(A, by, M);

    if (!wx || !wy) return null;

    return {
        n: N,
        cx: new Float64Array(domX),
        cy: new Float64Array(domY),
        wx,
        wy,
    };
}

function evalTps(
    m: TpsModel,
    x: number,
    y: number,
): [number, number] {
    const N = m.n;

    let fx = m.wx[N] + m.wx[N + 1] * x + m.wx[N + 2] * y;
    let fy = m.wy[N] + m.wy[N + 1] * x + m.wy[N + 2] * y;

    for (let i = 0; i < N; i++) {
        const dx = x - m.cx[i];
        const dy = y - m.cy[i];

        const u = tpsU(dx * dx + dy * dy);

        fx += m.wx[i] * u;
        fy += m.wy[i] * u;
    }

    return [fx, fy];
}

function bilinearSample(
    rgba: Uint8Array,
    x: number,
    y: number,
    W: number,
    H: number,
): [number, number, number, number] {
    if (x < 0 || x >= W || y < 0 || y >= H) {
        return [0, 0, 0, 0];
    }

    const x0 = x | 0;
    const y0 = y | 0;

    const x1 = Math.min(x0 + 1, W - 1);
    const y1 = Math.min(y0 + 1, H - 1);

    const fx = x - x0;
    const fy = y - y0;

    const i00 = (y0 * W + x0) * 4;
    const i01 = (y0 * W + x1) * 4;
    const i10 = (y1 * W + x0) * 4;
    const i11 = (y1 * W + x1) * 4;

    const w00 = (1 - fx) * (1 - fy);
    const w01 = fx * (1 - fy);
    const w10 = (1 - fx) * fy;
    const w11 = fx * fy;

    return [
        rgba[i00] * w00 + rgba[i01] * w01 + rgba[i10] * w10 + rgba[i11] * w11,
        rgba[i00 + 1] * w00 + rgba[i01 + 1] * w01 + rgba[i10 + 1] * w10 + rgba[i11 + 1] * w11,
        rgba[i00 + 2] * w00 + rgba[i01 + 2] * w01 + rgba[i10 + 2] * w10 + rgba[i11 + 2] * w11,
        rgba[i00 + 3] * w00 + rgba[i01 + 3] * w01 + rgba[i10 + 3] * w10 + rgba[i11 + 3] * w11,
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// WARP
// ─────────────────────────────────────────────────────────────────────────────

async function warpNewImage(
    newUri: string,
    inliers: InlierPt[],
    oldW: number,
    oldH: number,
): Promise<string | null> {
    const matIds: string[] = [];
    const t0 = Date.now();
    try {
        const MAX_CP = 256;

        const pts = sampleIndicesSpatial(inliers, MAX_CP, 10);

        console.log(`Using ${pts.length} control points for TPS warp {${Date.now() - t0}ms}`);
        const model = solveTps(
            pts.map(p => p.dx),
            pts.map(p => p.dy),
            pts.map(p => p.sx),
            pts.map(p => p.sy),
        );
        console.log(`TPS model solved in {${Date.now() - t0}ms}`);

        if (!model) return null;

        const b64src = await FileSystem.readAsStringAsync(newUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        console.log(`New image loaded and converted to base64 {${Date.now() - t0}ms}`);

        const srcMat = OpenCV.base64ToMat(b64src);
        console.log(`Source matrix created in {${Date.now() - t0}ms}`);
        matIds.push(srcMat.id);

        const warpSize = OpenCV.createObject(
            ObjectType.Size,
            WARP,
            WARP,
        );

        const bgrSmall = OpenCV.createObject(
            ObjectType.Mat,
            WARP,
            WARP,
            DataTypes.CV_8UC3,
        );

        matIds.push(bgrSmall.id);

        OpenCV.invoke(
            'resize',
            srcMat,
            bgrSmall,
            warpSize,
            0,
            0,
            InterpolationFlags.INTER_LINEAR,
        );

        const bgraMat = OpenCV.createObject(
            ObjectType.Mat,
            WARP,
            WARP,
            DataTypes.CV_8UC4,
        );

        matIds.push(bgraMat.id);

        OpenCV.invoke(
            'cvtColor',
            bgrSmall,
            bgraMat,
            ColorConversionCodes.COLOR_BGR2BGRA,
        );

        const { buffer: fineBgra } = OpenCV.matToBuffer(
            bgraMat,
            'uint8',
        );

        const fineToWarp = WARP / FINE;

        // ─────────────────────────────────────────────────────────
        // Build coarse flow field
        // ─────────────────────────────────────────────────────────

        const flowX = new Float32Array(FLOW_GRID * FLOW_GRID);
        const flowY = new Float32Array(FLOW_GRID * FLOW_GRID);
        console.log(`Computing flow field {${Date.now() - t0}ms}`);
        for (let gy = 0; gy < FLOW_GRID; gy++) {
            const py = (gy / (FLOW_GRID - 1)) * (WARP - 1);

            for (let gx = 0; gx < FLOW_GRID; gx++) {
                const px = (gx / (FLOW_GRID - 1)) * (WARP - 1);

                const [nx, ny] = evalTps(
                    model,
                    (px + 0.5) / fineToWarp,
                    (py + 0.5) / fineToWarp,
                );

                const idx = gy * FLOW_GRID + gx;

                flowX[idx] = nx * fineToWarp - 0.5;
                flowY[idx] = ny * fineToWarp - 0.5;
            }
        }
        console.log(`Flow field computed {${Date.now() - t0}ms}`);

        // ─────────────────────────────────────────────────────────
        // Warp image using interpolated flow
        // ─────────────────────────────────────────────────────────

        const warpedBgra = new Uint8Array(WARP * WARP * 4);

        const gridScaleX = (FLOW_GRID - 1) / (WARP - 1);
        const gridScaleY = (FLOW_GRID - 1) / (WARP - 1);

        for (let py = 0; py < WARP; py++) {
            const gyf = py * gridScaleY;

            const gy0 = Math.floor(gyf);
            const gy1 = Math.min(gy0 + 1, FLOW_GRID - 1);

            const ty = gyf - gy0;

            for (let px = 0; px < WARP; px++) {
                const gxf = px * gridScaleX;

                const gx0 = Math.floor(gxf);
                const gx1 = Math.min(gx0 + 1, FLOW_GRID - 1);

                const tx = gxf - gx0;

                const i00 = gy0 * FLOW_GRID + gx0;
                const i01 = gy0 * FLOW_GRID + gx1;
                const i10 = gy1 * FLOW_GRID + gx0;
                const i11 = gy1 * FLOW_GRID + gx1;

                const srcX =
                    flowX[i00] * (1 - tx) * (1 - ty) +
                    flowX[i01] * tx * (1 - ty) +
                    flowX[i10] * (1 - tx) * ty +
                    flowX[i11] * tx * ty;

                const srcY =
                    flowY[i00] * (1 - tx) * (1 - ty) +
                    flowY[i01] * tx * (1 - ty) +
                    flowY[i10] * (1 - tx) * ty +
                    flowY[i11] * tx * ty;

                const [b, g, r, a] = bilinearSample(
                    fineBgra,
                    srcX,
                    srcY,
                    WARP,
                    WARP,
                );

                const idx = (py * WARP + px) * 4;

                warpedBgra[idx] = b;
                warpedBgra[idx + 1] = g;
                warpedBgra[idx + 2] = r;
                warpedBgra[idx + 3] = a;
            }
        }
        console.log(`Image warped {${Date.now() - t0}ms}`);
        const warpedMat = OpenCV.bufferToMat(
            'uint8',
            WARP,
            WARP,
            4,
            warpedBgra,
        );
        console.log(`Warped matrix created {${Date.now() - t0}ms}`);

        matIds.push(warpedMat.id);

        const outSize = OpenCV.createObject(
            ObjectType.Size,
            oldW,
            oldH,
        );

        const outMat = OpenCV.createObject(
            ObjectType.Mat,
            oldH,
            oldW,
            DataTypes.CV_8UC4,
        );

        matIds.push(outMat.id);

        OpenCV.invoke(
            'resize',
            warpedMat,
            outMat,
            outSize,
            0,
            0,
            InterpolationFlags.INTER_LINEAR,
        );
        console.log(`Image resized {${Date.now() - t0}ms}`);

        const path =
            `${FileSystem.documentDirectory}warped_${Date.now()}.png`;

        OpenCV.saveMatToFile(
            outMat,
            path.replace(/^file:\/\//, ''),
            'jpeg',
            0.9,
        );
        console.log(`Image saved {${Date.now() - t0}ms}`);
        return path;
    } catch (e) {
        console.error('[warpNewImage] error:', e);
        return null;
    } finally {
        OpenCV.releaseBuffers(matIds);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRY
// ─────────────────────────────────────────────────────────────────────────────

export async function autoAlignLightGlue(
    oldUri: string,
    newUri: string,
    cW: number,
    cH: number,
): Promise<string | null> {
    try {
        console.log(
            `[AutoAlign] autoAlignLightGlue start, canvas=${cW}x${cH}`,
        );

        const t0 = Date.now();

        const [oldInfo, newInfo] = await Promise.all([
            loadGray(oldUri),
            loadGray(newUri),
        ]);

        if (!oldInfo || !newInfo) return null;

        console.log(
            `[AutoAlign] images loaded (${Date.now() - t0}ms)`,
        );

        const matches = await matchLightGlueLocal(
            oldInfo.gray,
            newInfo.gray,
            FINE,
        );

        console.log(
            `[AutoAlign] matches=${matches.length} (${Date.now() - t0}ms)`,
        );

        if (matches.length < 4) return null;

        const inliers = ransacInliers(matches);

        if (!inliers) return null;

        console.log(
            `[AutoAlign] inliers=${inliers.length} (${Date.now() - t0}ms)`,
        );

        const warpedUri = await warpNewImage(
            newUri,
            inliers,
            oldInfo.w,
            oldInfo.h,
        );

        console.log(
            `[AutoAlign] done (${Date.now() - t0}ms total)`,
        );

        return warpedUri;
    } catch (e) {
        console.error('Error in autoAlignLightGlue:', e);
        return null;
    }
}