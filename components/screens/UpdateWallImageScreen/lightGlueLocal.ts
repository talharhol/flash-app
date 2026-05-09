import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// .ort.onnx = ORT mobile format (op-restricted). Full .onnx may use ops missing from
// onnxruntime-react-native and silently emit empty matcher output.
const MODEL_URL =
    'https://github.com/fabio-sim/LightGlue-ONNX/releases/download/v2.0/superpoint_lightglue_pipeline.ort.onnx';
const MODEL_PATH = FileSystem.documentDirectory + 'superpoint_lightglue_pipeline.ort.onnx';

const SCORE_THRESHOLD = 0.9; // drop matches below this confidence

export interface LightGlueMatch {
    x0: number; // normalized [0,1] in old image
    y0: number;
    x1: number; // normalized [0,1] in new image
    y1: number;
}

let cachedSession: InferenceSession | null = null;
let pendingSession: Promise<InferenceSession> | null = null;

export async function isModelDownloaded(): Promise<boolean> {
    const info = await FileSystem.getInfoAsync(MODEL_PATH);
    return info.exists;
}

export async function downloadModel(onProgress?: (fraction: number) => void): Promise<void> {
    const dl = FileSystem.createDownloadResumable(
        MODEL_URL,
        MODEL_PATH,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
            if (onProgress && totalBytesExpectedToWrite > 0)
                onProgress(totalBytesWritten / totalBytesExpectedToWrite);
        },
    );
    const result = await dl.downloadAsync();
    if (!result || result.status !== 200) {
        await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
        throw new Error(`Model download failed (HTTP ${result?.status})`);
    }
}

async function getSession(): Promise<InferenceSession> {
    if (cachedSession) { console.log('[LightGlue] session cache hit'); return cachedSession; }
    if (pendingSession) { console.log('[LightGlue] session load in progress, awaiting'); return pendingSession; }
    const info = await FileSystem.getInfoAsync(MODEL_PATH);
    // @ts-ignore - size field exists when exists=true
    const t0 = Date.now();
    pendingSession = InferenceSession.create(MODEL_PATH, {
        executionProviders: Platform.OS === 'ios' ? ['coreml', 'cpu'] : ['cpu'],
    }).then(s => {
        console.log(`[LightGlue] session loaded in ${Date.now() - t0}ms`);
        cachedSession = s;
        pendingSession = null;
        return s;
    });
    return pendingSession;
}

export async function matchLightGlueLocal(
    oldGray: Uint8Array,
    newGray: Uint8Array,
    size: number, // must be multiple of 8 — FINE (256) works
): Promise<LightGlueMatch[]> {
    const session = await getSession();
    console.log(oldGray.slice(0, 20));
    // Batch both images: [2, 1, size, size]
    const float = new Float32Array(2 * size * size);
    for (let i = 0; i < size * size; i++) {
        float[i]               = oldGray[i] / 255.0;
        float[size * size + i] = newGray[i] / 255.0;
    }
    const results = await session.run({
        images: new Tensor('float32', float, [2, 1, size, size]),
    });

    // keypoints: [2, N, 2]  — pixel coords per image
    // matches:   [M, 3] or [M, 2] int64
    // mscores:   [M]
    const kpData    = results['keypoints'].data as Float32Array;
    const matchData = results['matches'].data;
    const mscores   = results['mscores'].data as Float32Array;

    const N          = Number(results['keypoints'].dims[1]); // keypoints per image
    const numMatches = Number(results['matches'].dims[0]);
    const matchCols  = Number(results['matches'].dims[1]); // 3 = [pair, kp0, kp1]; 2 = [kp0, kp1]

    // Diagnostic: dims + score distribution
    let smin = Infinity, smax = -Infinity, sAvg = 0;
    for (let i = 0; i < mscores.length; i++) {
        if (mscores[i] < smin) smin = mscores[i];
        if (mscores[i] > smax) smax = mscores[i];
        sAvg += mscores[i];
    }
    sAvg = mscores.length ? sAvg / mscores.length : 0;
    console.log(
        `[LightGlue] kpDims=${JSON.stringify(results['keypoints'].dims)} ` +
        `matchDims=${JSON.stringify(results['matches'].dims)} ` +
        `mscoreLen=${mscores.length} ` +
        `scoreMin=${smin.toFixed(3)} max=${smax.toFixed(3)} avg=${sAvg.toFixed(3)} ` +
        `threshold=${SCORE_THRESHOLD}`,
    );

    const out: LightGlueMatch[] = [];
    try {
        for (let i = 0; i < numMatches; i++) {
            if (mscores[i] < SCORE_THRESHOLD) continue;

            const kp0 = Number(matchCols === 2 ? matchData[i * 2]     : matchData[i * 3 + 1]);
            const kp1 = Number(matchCols === 2 ? matchData[i * 2 + 1] : matchData[i * 3 + 2]);

            // Guard against invalid indices
            if (kp0 < 0 || kp0 >= N || kp1 < 0 || kp1 >= N) continue;

            const raw_x0 = Number(kpData[kp0 * 2]),       raw_y0 = Number(kpData[kp0 * 2 + 1]);
            const raw_x1 = Number(kpData[N * 2 + kp1 * 2]), raw_y1 = Number(kpData[N * 2 + kp1 * 2 + 1]);

            // Keypoints are in pixel space [0, size-1]; normalize to [0, 1]
            out.push({
                x0: raw_x0 / (size - 1),
                y0: raw_y0 / (size - 1),
                x1: raw_x1 / (size - 1),
                y1: raw_y1 / (size - 1),
            });
        }
    } catch (e) {
        console.error('Error processing LightGlue output:', e);
    }
    return out;
}
