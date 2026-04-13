import { useCallback, useEffect, useRef, useState } from 'react';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { Skia, ColorType, AlphaType } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system';
import { maskToSvgPath } from '@/utils/maskToSvgPath';

/**
 * Tensor contracts (from assets/ml/metadata.yaml):
 *
 * encoder.tflite
 *   in:  image             [1, 1024, 1024, 3]  float32
 *   out: image_embeddings  [1, 64, 64, 256]    float32
 *
 * decoder.tflite
 *   in:  image_embeddings  [1, 64, 64, 256]    float32
 *   in:  point_coords      [1, 1, 2]           float32  pixel coords 0–1024
 *   in:  point_labels      [1, 1]              float32  1.0 = foreground
 *   out: masks             [1, 256, 256, 1]    float32
 *   out: scores            [1, 1]              float32
 */

const ENCODER_INPUT_SIZE = 1024;
const MASK_SIZE           = 256;
const MASK_UPSCALE        = 4; // 256 → 1024 via nearest-neighbor before path tracing

// SAM logit scores for small holds can be slightly negative — don't reject them.
const MIN_SCORE = -2;

type Embedding = Float32Array;

export function useHoldDetection(imageUri: string | null, enabled = true) {
    const encoderRef = useRef<TensorflowModel | null>(null);
    const decoderRef = useRef<TensorflowModel | null>(null);
    const cachedEmbeddingRef = useRef<{ uri: string; embedding: Embedding } | null>(null);

    const [modelsReady, setModelsReady] = useState(false);
    const [isEncoding, setIsEncoding]   = useState(false);
    const [isReady,    setIsReady]      = useState(false);

    // ── Load models after the screen has had time to render ─────────────────
    // InteractionManager doesn't work with native stack navigation (no JS interactions
    // are registered), so we use a plain timeout to guarantee the screen is visible first.
    useEffect(() => {
        if (!enabled) return;
        const timer = setTimeout(() => {
            console.log('[HoldDetection] Loading models...');
            Promise.all([
                loadTensorflowModel(require('../assets/ml/encoder.tflite')),
                loadTensorflowModel(require('../assets/ml/decoder.tflite')),
            ])
                .then(([enc, dec]) => {
                    encoderRef.current = enc;
                    decoderRef.current = dec;
                    console.log('[HoldDetection] Models loaded ✓');
                    setModelsReady(true);
                })
                .catch(e => console.warn('[HoldDetection] Failed to load models:', e));
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    // ── Encode full image once when URI changes ──────────────────────────────
    // The encoder runs once per wall. All taps reuse this cached embedding.
    useEffect(() => {
        if (!modelsReady || !imageUri || !encoderRef.current) return;
        if (cachedEmbeddingRef.current?.uri === imageUri)     return;

        setIsReady(false);
        setIsEncoding(true);
        console.log('[HoldDetection] Encoding image...');

        imageUriToFloat32(imageUri, ENCODER_INPUT_SIZE)
            .then(pixels => encoderRef.current!.run([pixels]))
            .then(([embedding]) => {
                cachedEmbeddingRef.current = { uri: imageUri, embedding: embedding as Float32Array };
                console.log('[HoldDetection] Image encoded and ready ✓');
                setIsReady(true);
            })
            .catch(e => console.warn('[HoldDetection] Encoding failed:', e))
            .finally(() => setIsEncoding(false));
    }, [modelsReady, imageUri]);

    // ── detectHold ───────────────────────────────────────────────────────────
    // Runs only the decoder (~10ms) using the cached embedding.
    // No re-encoding per tap — always instant after the initial encode.
    const detectHold = useCallback(async (
        normalizedX: number,
        normalizedY: number,
        svgWidth: number,
        svgHeight: number,
    ): Promise<{ svgPath: string | null; mask: Float32Array | null; score: number }> => {
        const empty = { svgPath: null, mask: null, score: 0 };

        if (!decoderRef.current || !cachedEmbeddingRef.current) {
            console.warn('[HoldDetection] Not ready yet');
            return empty;
        }

        try {
            const tapX = normalizedX * ENCODER_INPUT_SIZE;
            const tapY = normalizedY * ENCODER_INPUT_SIZE;

            console.log(`[HoldDetection] Decoder tap at (${tapX.toFixed(0)}, ${tapY.toFixed(0)})`);

            const [rawMasks, rawScores] = await decoderRef.current.run([
                cachedEmbeddingRef.current.embedding,
                new Float32Array([tapX, tapY]),
                new Float32Array([1.0]),
            ]);

            const score   = (rawScores as Float32Array)[0];
            const mask    = rawMasks  as Float32Array;
            const fgCount = countFg(mask);

            console.log(`[HoldDetection] score=${score.toFixed(3)}  fg=${fgCount}/${mask.length} (${((fgCount / mask.length) * 100).toFixed(1)}%)`);

            if (score <= MIN_SCORE) {
                console.log('[HoldDetection] Score too low — fallback to circle');
                return { svgPath: null, mask, score };
            }

            const upscaledMask = nearestNeighborUpsample(mask, MASK_SIZE, MASK_SIZE, MASK_UPSCALE);
            const svgPath = maskToSvgPath(upscaledMask, MASK_SIZE * MASK_UPSCALE, MASK_SIZE * MASK_UPSCALE, svgWidth, svgHeight);
            return { svgPath, mask, score };
        } catch (e) {
            console.warn('[HoldDetection] Inference failed:', e);
            return empty;
        }
    }, []);

    return { detectHold, isEncoding, isReady };
}

// ─── Image helpers ────────────────────────────────────────────────────────────

async function imageUriToFloat32(uri: string, targetSize: number): Promise<Float32Array> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
    });

    const image = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(base64));
    if (!image) throw new Error('[HoldDetection] Failed to decode image');

    const surface = Skia.Surface.Make(targetSize, targetSize);
    if (!surface) throw new Error('[HoldDetection] Failed to create Skia surface');

    surface.getCanvas().drawImageRect(
        image,
        { x: 0, y: 0, width: image.width(), height: image.height() },
        { x: 0, y: 0, width: targetSize, height: targetSize },
        Skia.Paint(),
    );

    const pixelData = surface.makeImageSnapshot().readPixels(0, 0, {
        width:     targetSize,
        height:    targetSize,
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Unpremul,
    });
    if (!pixelData) throw new Error('[HoldDetection] Failed to read pixels');

    const rgba       = pixelData instanceof Uint8Array ? pixelData : new Uint8Array((pixelData as unknown as ArrayBuffer));
    const pixelCount = targetSize * targetSize;
    const float32    = new Float32Array(pixelCount * 3);
    const CHUNK      = 262144; // yield every 256 k pixels — 4 chunks for 1024×1024
    for (let i = 0; i < pixelCount; i++) {
        float32[i * 3]     = rgba[i * 4]     / 255;
        float32[i * 3 + 1] = rgba[i * 4 + 1] / 255;
        float32[i * 3 + 2] = rgba[i * 4 + 2] / 255;
        if (i > 0 && i % CHUNK === 0) {
            await new Promise<void>(r => setTimeout(r, 0));
        }
    }
    return float32;
}

function nearestNeighborUpsample(mask: Float32Array, w: number, h: number, scale: number): Float32Array {
    const newW = w * scale, newH = h * scale;
    const out = new Float32Array(newW * newH);
    for (let y = 0; y < newH; y++)
        for (let x = 0; x < newW; x++)
            out[y * newW + x] = mask[Math.floor(y / scale) * w + Math.floor(x / scale)];
    return out;
}

function countFg(mask: Float32Array): number {
    let n = 0;
    for (let i = 0; i < mask.length; i++) if (mask[i] > 0.5) n++;
    return n;
}
