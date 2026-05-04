import React, { forwardRef, useImperativeHandle, useRef } from 'react';
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

export type CornerPoint = { x: number; y: number };

// corners order: [TL, TR, BL, BR]
// Letterboxes the image inside the canvas maintaining aspect ratio.
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

interface Props {
    oldImageUri: string;
    newImageUri: string;
    width: number;
    height: number;
    corners: CornerPoint[];
    onCornersChange: (corners: CornerPoint[]) => void;
    showOverlay?: boolean;
}

export interface CornerAdjustRef {
    capture: () => Promise<string | null>;
}

const SNAP_RADIUS = 52;
const HANDLE_R = 14;
const HANDLE_COLORS = ['#FF5252', '#4CAF50', '#2196F3', '#FF9800'] as const;

const CornerAdjustCanvas = forwardRef<CornerAdjustRef, Props>(({
    oldImageUri, newImageUri, width, height, corners, onCornersChange, showOverlay = true,
}, ref) => {
    const oldImage = useImage(oldImageUri);
    const newImage = useImage(newImageUri);
    const canvasRef = useCanvasRef();
    const activeRef = useRef<number | null>(null);
    const cornersRef = useRef(corners);
    cornersRef.current = corners;

    useImperativeHandle(ref, () => ({
        async capture() {
            if (!newImage || !oldImage) return null;

            const oldW = oldImage.width();
            const oldH = oldImage.height();
            const iW = newImage.width();
            const iH = newImage.height();

            // Old image display rect on canvas (same as defaultCorners logic)
            const maxW = width * DISPLAY_SCALE;
            const maxH = height * DISPLAY_SCALE;
            const dispScale = Math.min(maxW / oldW, maxH / oldH);
            const fw = oldW * dispScale;
            const fh = oldH * dispScale;
            const ox = (width - fw) / 2;
            const oy = (height - fh) / 2;

            // Off-screen surface at old image pixel dimensions
            const surface = Skia.Surface.Make(oldW, oldH);
            if (!surface) return null;
            const skCanvas = surface.getCanvas();

            // Transform corners: canvas display space -> old image pixel space
            const positions = cornersRef.current.map(c =>
                vec((c.x - ox) / fw * oldW, (c.y - oy) / fh * oldH)
            );
            const texCoords = [vec(0, 0), vec(iW, 0), vec(0, iH), vec(iW, iH)];
            const vertices = Skia.MakeVertices(
                VertexMode.Triangles,
                positions,
                texCoords,
                undefined,
                [0, 1, 2, 1, 3, 2],
            );
            if (!vertices) return null;

            const paint = Skia.Paint();
            const shader = newImage.makeShaderOptions(
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

    // 4-point quad: [TL, TR, BL, BR]
    const verts = [
        vec(corners[0].x, corners[0].y),
        vec(corners[1].x, corners[1].y),
        vec(corners[2].x, corners[2].y),
        vec(corners[3].x, corners[3].y),
    ];
    const tex = [
        vec(0, 0),
        vec(iW, 0),
        vec(0, iH),
        vec(iW, iH),
    ];
    // Two triangles: (TL,TR,BL) and (TR,BR,BL)
    const indices = [0, 1, 2, 1, 3, 2];

    const nearest = (x: number, y: number): number | null => {
        let best = -1, bestD = SNAP_RADIUS;
        cornersRef.current.forEach((c, i) => {
            const d = Math.hypot(c.x - x, c.y - y);
            if (d < bestD) { best = i; bestD = d; }
        });
        return best === -1 ? null : best;
    };

    const pan = Gesture.Pan()
        .runOnJS(true)
        .onBegin((e) => { activeRef.current = nearest(e.x, e.y); })
        .onUpdate((e) => {
            const i = activeRef.current;
            if (i === null) return;
            onCornersChange(cornersRef.current.map((c, j) =>
                j === i
                    ? { x: Math.max(0, Math.min(width, e.x)), y: Math.max(0, Math.min(height, e.y)) }
                    : c
            ));
        })
        .onEnd(() => { activeRef.current = null; });

    return (
        <GestureDetector gesture={pan}>
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
                        <Vertices vertices={verts} textures={tex} indices={indices} mode="triangles">
                            <ImageShader image={newImage} fit="fill" rect={rect(0, 0, iW, iH)} />
                        </Vertices>
                    </Group>
                    {showOverlay && corners.map((c, i) => (
                        <React.Fragment key={i}>
                            <Circle cx={c.x} cy={c.y} r={HANDLE_R + 4} color="rgba(255,255,255,0.85)" />
                            <Circle cx={c.x} cy={c.y} r={HANDLE_R} color={HANDLE_COLORS[i]} />
                        </React.Fragment>
                    ))}
                </Canvas>
            </View>
        </GestureDetector>
    );
});

export default CornerAdjustCanvas;
