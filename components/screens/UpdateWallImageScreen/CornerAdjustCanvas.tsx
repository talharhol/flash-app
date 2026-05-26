import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
    Canvas, Circle, Fill, Group,
    Image as SkiaImage, ImageFormat,
    ImageShader, Vertices, vec, useImage, rect,
    Skia, BlendMode, TileMode, FilterMode, MipmapMode, VertexMode,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as FileSystem from 'expo-file-system';
import { useCanvasRef } from '@shopify/react-native-skia';
import { Colors } from '@/constants/Colors';

export type CornerPoint = { x: number; y: number };
export type AnchorPoint = { x: number; y: number; tx: number; ty: number };

const MAX_DISPLAY_PX = 1024;

function useResizedImage(uri: string): ReturnType<typeof useImage> {
    const [image, setImage] = useState<ReturnType<typeof useImage>>(null);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const data = await Skia.Data.fromURI(uri);
            if (cancelled) return;
            const src = Skia.Image.MakeImageFromEncoded(data);
            if (!src || cancelled) return;
            const w = src.width(), h = src.height();
            const scale = Math.min(1, MAX_DISPLAY_PX / Math.max(w, h));
            if (scale >= 1) { if (!cancelled) setImage(src); return; }
            const dw = Math.round(w * scale), dh = Math.round(h * scale);
            const surf = Skia.Surface.Make(dw, dh);
            if (!surf || cancelled) { if (!cancelled) setImage(src); return; }
            surf.getCanvas().drawImageRect(src, { x: 0, y: 0, width: w, height: h }, { x: 0, y: 0, width: dw, height: dh }, Skia.Paint());
            surf.flush();
            if (!cancelled) setImage(surf.makeImageSnapshot());
        })();
        return () => { cancelled = true; };
    }, [uri]);
    return image;
}

// corners order: [TL, TR, BL, BR]
const DISPLAY_SCALE = 0.75;

export function defaultCorners(canvasW: number, canvasH: number, imgW?: number, imgH?: number): CornerPoint[] {
    const maxW = canvasW * DISPLAY_SCALE;
    const maxH = canvasH * DISPLAY_SCALE;
    const srcW = imgW || canvasW;
    const srcH = imgH || canvasH;
    const scale = Math.min(maxW / srcW, maxH / srcH);
    const fw = srcW * scale;
    const fh = srcH * scale;
    const ox = (canvasW - fw) / 2;
    const oy = (canvasH - fh) / 2;
    return [
        { x: ox, y: oy },
        { x: ox + fw, y: oy },
        { x: ox, y: oy + fh },
        { x: ox + fw, y: oy + fh },
    ];
}

// Returns barycentric coords [wa, wb, wc] of point P in triangle ABC
function baryCoords(
    px: number, py: number,
    ax: number, ay: number,
    bx: number, by: number,
    cx: number, cy: number,
): [number, number, number] {
    const denom = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (Math.abs(denom) < 1e-10) return [1 / 3, 1 / 3, 1 / 3];
    const wa = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / denom;
    const wb = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / denom;
    return [wa, wb, 1 - wa - wb];
}

function pointInTriangle(
    px: number, py: number,
    ax: number, ay: number,
    bx: number, by: number,
    cx: number, cy: number,
): boolean {
    const [wa, wb, wc] = baryCoords(px, py, ax, ay, bx, by, cx, cy);
    return wa >= -1e-6 && wb >= -1e-6 && wc >= -1e-6;
}

type Vec2 = { x: number; y: number };
type TexCoord = { tx: number; ty: number };

function buildMesh(corners: CornerPoint[], anchors: AnchorPoint[]): {
    positions: Vec2[];
    texCoords: TexCoord[];
    indices: number[];
} {
    const positions: Vec2[] = [
        ...corners.map(c => ({ x: c.x, y: c.y })),
        ...anchors.map(a => ({ x: a.x, y: a.y })),
    ];
    // Tex coords for corners are placeholders — caller fills iW/iH ratios
    // We store raw values; corners use 0/1 normalized, anchors use stored tx/ty
    // Actually we store raw pixel coords: corners = (0,0),(iW,0),(0,iH),(iW,iH)
    // but we don't know iW/iH here, so return anchors tex and let caller supply corners
    const texCoords: TexCoord[] = [
        { tx: 0, ty: 0 },   // TL — caller overwrites with iW/iH
        { tx: 1, ty: 0 },   // TR
        { tx: 0, ty: 1 },   // BL
        { tx: 1, ty: 1 },   // BR
        ...anchors.map(a => ({ tx: a.tx, ty: a.ty })),
    ];

    // Start with quad's 2 triangles: TL=0,TR=1,BL=2,BR=3
    let triangles: [number, number, number][] = [[0, 1, 2], [1, 3, 2]];

    // Insert each anchor via triangle subdivision
    for (let ai = 0; ai < anchors.length; ai++) {
        const vi = 4 + ai;
        const px = anchors[ai].x;
        const py = anchors[ai].y;

        let found = -1;
        for (let ti = 0; ti < triangles.length; ti++) {
            const [i0, i1, i2] = triangles[ti];
            if (pointInTriangle(
                px, py,
                positions[i0].x, positions[i0].y,
                positions[i1].x, positions[i1].y,
                positions[i2].x, positions[i2].y,
            )) {
                found = ti;
                break;
            }
        }
        if (found === -1) continue;
        const [i0, i1, i2] = triangles[found];
        triangles.splice(found, 1, [i0, i1, vi], [i1, i2, vi], [i2, i0, vi]);
    }

    const indices: number[] = [];
    for (const [a, b, c] of triangles) indices.push(a, b, c);

    return { positions, texCoords, indices };
}

interface Props {
    oldImageUri: string;
    newImageUri: string;
    width: number;
    height: number;
    corners: CornerPoint[];
    onCornersChange: (corners: CornerPoint[]) => void;
    anchors?: AnchorPoint[];
    onAnchorsChange?: (anchors: AnchorPoint[]) => void;
    showOverlay?: boolean;
}

export interface CornerAdjustRef {
    capture: () => Promise<string | null>;
}

const SNAP_RADIUS = 52;
const HANDLE_R = 14;
const CORNER_COLORS = [Colors.backgroundDark, Colors.backgroundDark, Colors.backgroundDark, Colors.backgroundDark] as const;
const ANCHOR_COLOR = Colors.backgroundExtraDark;

const CornerAdjustCanvas = forwardRef<CornerAdjustRef, Props>(({
    oldImageUri, newImageUri, width, height, corners, onCornersChange,
    anchors = [], onAnchorsChange, showOverlay = true,
}, ref) => {
    const oldImage = useImage(oldImageUri);
    const newImage = useResizedImage(newImageUri);
    const canvasRef = useCanvasRef();
    const activeRef = useRef<number | null>(null);
    const cornersRef = useRef(corners);
    cornersRef.current = corners;
    const anchorsRef = useRef(anchors);
    anchorsRef.current = anchors;

    useImperativeHandle(ref, () => ({
        async capture() {
            if (!newImage || !oldImage) return null;

            const oldW = oldImage.width();
            const oldH = oldImage.height();

            const captureData = await Skia.Data.fromURI(newImageUri);
            const captureImg = captureData ? Skia.Image.MakeImageFromEncoded(captureData) : newImage;
            if (!captureImg) return null;

            const iW = captureImg.width();
            const iH = captureImg.height();
            const texScale = captureImg.width() / newImage.width();

            const maxW = width * DISPLAY_SCALE;
            const maxH = height * DISPLAY_SCALE;
            const dispScale = Math.min(maxW / oldW, maxH / oldH);
            const fw = oldW * dispScale;
            const fh = oldH * dispScale;
            const ox = (width - fw) / 2;
            const oy = (height - fh) / 2;

            const surface = Skia.Surface.Make(oldW, oldH);
            if (!surface) return null;
            const skCanvas = surface.getCanvas();

            const cur = cornersRef.current;
            const anc = anchorsRef.current;
            const { positions, texCoords, indices } = buildMesh(cur, anc);

            const skPositions = positions.map(p =>
                vec((p.x - ox) / fw * oldW, (p.y - oy) / fh * oldH)
            );
            const skTex = texCoords.map((t, i) =>
                i < 4
                    ? vec([0, iW, 0, iW][i], [0, 0, iH, iH][i])
                    : vec(t.tx * texScale, t.ty * texScale)
            );

            const vertices = Skia.MakeVertices(
                VertexMode.Triangles,
                skPositions,
                skTex,
                undefined,
                indices,
            );
            if (!vertices) return null;

            const paint = Skia.Paint();
            const shader = captureImg.makeShaderOptions(
                TileMode.Clamp, TileMode.Clamp,
                FilterMode.Linear, MipmapMode.None,
            );
            paint.setShader(shader);
            skCanvas.drawVertices(vertices, BlendMode.SrcOver, paint);
            surface.flush();

            const img = surface.makeImageSnapshot();
            const b64 = img.encodeToBase64(ImageFormat.JPEG, 90);
            const uri = `${FileSystem.documentDirectory}wall_update_${Date.now()}.jpg`;
            await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
            return uri;
        },
    }));

    if (!newImage || width === 0) return null;

    const iW = newImage.width();
    const iH = newImage.height();

    const { positions, texCoords, indices } = buildMesh(corners, anchors);

    const skPositions = positions.map(p => vec(p.x, p.y));
    const skTex = texCoords.map((t, i) =>
        i < 4
            ? vec([0, iW, 0, iW][i], [0, 0, iH, iH][i])
            : vec(t.tx, t.ty)
    );

    const nearest = (x: number, y: number): number | null => {
        let best = -1, bestD = SNAP_RADIUS;
        cornersRef.current.forEach((c, i) => {
            const d = Math.hypot(c.x - x, c.y - y);
            if (d < bestD) { best = i; bestD = d; }
        });
        anchorsRef.current.forEach((a, i) => {
            const d = Math.hypot(a.x - x, a.y - y);
            if (d < bestD) { best = 4 + i; bestD = d; }
        });
        return best === -1 ? null : best;
    };

    const pan = Gesture.Pan()
        .runOnJS(true)
        .onBegin((e) => { activeRef.current = nearest(e.x, e.y); })
        .onUpdate((e) => {
            const active = activeRef.current;
            if (active === null) return;
            if (active < 4) {
                const x = Math.max(0, Math.min(width, e.x));
                const y = Math.max(0, Math.min(height, e.y));
                onCornersChange(cornersRef.current.map((c, j) =>
                    j === active ? { x, y } : c
                ));
            } else {
                const cs = cornersRef.current;
                const minX = Math.min(...cs.map(c => c.x));
                const maxX = Math.max(...cs.map(c => c.x));
                const minY = Math.min(...cs.map(c => c.y));
                const maxY = Math.max(...cs.map(c => c.y));
                const x = Math.max(minX + 1, Math.min(maxX - 1, e.x));
                const y = Math.max(minY + 1, Math.min(maxY - 1, e.y));
                const ai = active - 4;
                onAnchorsChange?.(anchorsRef.current.map((a, j) =>
                    j === ai ? { ...a, x, y } : a
                ));
            }
        })
        .onEnd(() => { activeRef.current = null; });

    const longPress = Gesture.LongPress()
        .runOnJS(true)
        .minDuration(450)
        .onStart((e) => {
            if (nearest(e.x, e.y) !== null) return;

            const cur = cornersRef.current;
            const anc = anchorsRef.current;
            const { positions: pts, texCoords: tcs, indices: idx } = buildMesh(cur, anc);
            const skTcs = tcs.map((t, i) =>
                i < 4
                    ? { tx: [0, iW, 0, iW][i], ty: [0, 0, iH, iH][i] }
                    : t
            );

            for (let i = 0; i < idx.length; i += 3) {
                const i0 = idx[i], i1 = idx[i + 1], i2 = idx[i + 2];
                if (pointInTriangle(
                    e.x, e.y,
                    pts[i0].x, pts[i0].y,
                    pts[i1].x, pts[i1].y,
                    pts[i2].x, pts[i2].y,
                )) {
                    const [wa, wb, wc] = baryCoords(
                        e.x, e.y,
                        pts[i0].x, pts[i0].y,
                        pts[i1].x, pts[i1].y,
                        pts[i2].x, pts[i2].y,
                    );
                    const tx = wa * skTcs[i0].tx + wb * skTcs[i1].tx + wc * skTcs[i2].tx;
                    const ty = wa * skTcs[i0].ty + wb * skTcs[i1].ty + wc * skTcs[i2].ty;
                    onAnchorsChange?.([...anc, { x: e.x, y: e.y, tx, ty }]);
                    break;
                }
            }
        });

    const gesture = Gesture.Race(longPress, pan);

    return (
        <GestureDetector gesture={gesture}>
            <View style={{ width, height }}>
                <Canvas ref={canvasRef} style={StyleSheet.absoluteFill}>
                    <Fill color="#000" />
                    {showOverlay && oldImage && (
                        <SkiaImage
                            image={oldImage}
                            x={(width - width * DISPLAY_SCALE) / 2}
                            y={(height - height * DISPLAY_SCALE) / 2}
                            width={width * DISPLAY_SCALE}
                            height={height * DISPLAY_SCALE}
                            fit="contain"
                            opacity={0.8}
                        />
                    )}
                    <Group opacity={0.5}>
                        <Vertices vertices={skPositions} textures={skTex} indices={indices} mode="triangles">
                            <ImageShader image={newImage} fit="fill" rect={rect(0, 0, iW, iH)} />
                        </Vertices>
                    </Group>
                    {showOverlay && corners.map((c, i) => (
                        <React.Fragment key={i}>
                            <Circle cx={c.x} cy={c.y} r={HANDLE_R + 4} color="rgba(255,255,255,0.85)" />
                            <Circle cx={c.x} cy={c.y} r={HANDLE_R} color={CORNER_COLORS[i]} />
                        </React.Fragment>
                    ))}
                    {showOverlay && anchors.map((a, i) => (
                        <React.Fragment key={`anchor-${i}`}>
                            <Circle cx={a.x} cy={a.y} r={HANDLE_R + 4} color="rgba(255,255,255,0.85)" />
                            <Circle cx={a.x} cy={a.y} r={HANDLE_R} color={ANCHOR_COLOR} />
                        </React.Fragment>
                    ))}
                </Canvas>
            </View>
        </GestureDetector>
    );
});

export default CornerAdjustCanvas;
