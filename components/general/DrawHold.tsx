import React, { useContext, useMemo, useState } from 'react';
import { ActivityIndicator, GestureResponderEvent, Text, View } from "react-native";
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { imageSize, zoomSize } from './SizeContext';
import { HoldType } from '@/DAL/hold';
import SetRadiusModal from './SelectRadiusModal';
import { useHoldDetection } from '@/hooks/useHoldDetection';
import { Notifier } from 'react-native-notifier';
type DetectHold = ReturnType<typeof useHoldDetection>['detectHold'];


/*
    Renders a canvas which the user draws on it hold markings, "returning" the drawn shape using the `OnFinishedDrawingShape`.

    For SOME REASON svg doesn't like being "position: absolute".... So I wrap it with a postiion:absolut element and everyhing works nice.
*/
const DrawHold: React.FC<{
    onFinishedDrawingShape?: (shape: string) => void;
    onCancel?: () => void;
    minimalMovingDistance?: number;
    currentHoldType: HoldType;
    detectHold?: DetectHold;
    isEncoding?: boolean;
    isReady?: boolean;
}> = ({ currentHoldType, onFinishedDrawingShape, onCancel, minimalMovingDistance, detectHold, isEncoding = false, isReady = false }) => {
    const zoom = useContext(zoomSize);
    minimalMovingDistance = (minimalMovingDistance || 10) / zoom;
    const dimensions = useContext(imageSize);
    const [currentPaths, setCurrentPath] = useState<{ x: number, y: number; }[]>([]);
    const [centerShift, setCenterShift] = useState({ x: 0, y: 0 });
    const [showRadiusModal, setShowRadiusModal] = useState(false);
    const defaultRadius = 1000 / 25;
    const [isDrawing, setIsDrawing] = useState(false);
    const [holdRadius, setHoldRedius] = useState(defaultRadius);
    const [isDetecting, setIsDetecting] = useState(false);
    const [lastTapSvg, setLastTapSvg] = useState<{ x: number; y: number } | null>(null);
    const scaleRatio = dimensions.width / 1000;
    const strokeWidth = 2 / Math.max(1, zoom / 8);

    const isMoved = (x1: number, x2: number, y1: number, y2: number) => {
        return (Math.abs(x1 - x2) > minimalMovingDistance || Math.abs(y1 - y2) > minimalMovingDistance);
    };

    const onTouchStart = (e: GestureResponderEvent) => {
        Notifier.hideNotification();
        let x = e.nativeEvent.locationX / scaleRatio;
        let y = e.nativeEvent.locationY / scaleRatio;
        setCurrentPath(currentPaths.concat([{ x, y }]));
    };

    const onTouchMove = (e: GestureResponderEvent) => {
        let x = e.nativeEvent.locationX / scaleRatio;
        let y = e.nativeEvent.locationY / scaleRatio;
        if (e.nativeEvent.touches.length !== 1) {
            onCancel?.();
            return;
        }
        if (currentPaths.length === 0) {
            setCurrentPath(currentPaths.concat([{ x, y }]));
            return;
        }
        let lastPath = currentPaths[currentPaths.length - 1];
        if (!isMoved(x, lastPath.x, y, lastPath.y)) {
            return;
        }
        setIsDrawing(true);
        setCurrentPath(currentPaths.concat([{ x, y }]));
    };

    const setCenter = () => {
        let newPath = { x: currentPaths[currentPaths.length - 1].x + centerShift.x, y: currentPaths[currentPaths.length - 1].y + centerShift.y };
        setCenterShift({ x: 0, y: 0 });
        setCurrentPath(currentPaths.concat([newPath]));
    };

    const onRadiusSet = () => {
        setShowRadiusModal(false);
        onFinishedDrawingShape?.(`M ${currentPaths[currentPaths.length - 1].x + centerShift.x - holdRadius}, ${currentPaths[currentPaths.length - 1].y + centerShift.y} a ${holdRadius},${holdRadius} 0 1,0 ${holdRadius * 2},0 a ${holdRadius},${holdRadius} 0 1,0 -${holdRadius * 2},0`);
        setCurrentPath([]);
        setCenterShift({ x: 0, y: 0 });
        setHoldRedius(defaultRadius);
    };

    const moveCenter = (dx: number, dy: number) => {
        setCenterShift({ x: dx / scaleRatio, y: dy / scaleRatio });
    };

    const onTouchEnd = (e: GestureResponderEvent) => {
        if (e.nativeEvent.touches.length !== 0) return;

        // User drew a shape — use it directly, no detection needed
        if (isDrawing && currentPaths.length > 4) {
            const pathToSend = `M${currentPaths.map(({ x, y }) => `${x.toFixed(0)},${y.toFixed(0)}`)} Z`;
            setCurrentPath([]);
            onFinishedDrawingShape?.(pathToSend);
            setIsDrawing(false);
            return;
        }

        // User tapped — try auto-detection, fall back to original circle modal
        if (detectHold) {
            const tapX = e.nativeEvent.locationX / dimensions.width;
            const tapY = e.nativeEvent.locationY / dimensions.height;
            const svgWidth = 1000;
            const svgHeight = 1000 * (dimensions.height / dimensions.width);

            setLastTapSvg({ x: e.nativeEvent.locationX / scaleRatio, y: e.nativeEvent.locationY / scaleRatio });
            setIsDetecting(true);
            detectHold(tapX, tapY, svgWidth, svgHeight)
                .then(({ svgPath }) => {
                    if (svgPath) {
                        setCurrentPath([]);
                        onFinishedDrawingShape?.(svgPath);
                    } else {
                        setShowRadiusModal(true);
                    }
                })
                .finally(() => setIsDetecting(false));
        } else {
            setShowRadiusModal(true);
        }
    };

    const drawingPath = useMemo(() => {
        if (currentPaths.length === 0) return null;
        const p = Skia.Path.Make();
        p.moveTo(currentPaths[0].x, currentPaths[0].y);
        for (let i = 1; i < currentPaths.length; i++) {
            p.lineTo(currentPaths[i].x, currentPaths[i].y);
        }
        return p;
    }, [currentPaths]);

    const tapCrosshairPath = useMemo(() => {
        if (!lastTapSvg) return null;
        const { x, y } = lastTapSvg;
        const arm = 20;
        const p = Skia.Path.Make();
        p.moveTo(x - arm, y); p.lineTo(x + arm, y);
        p.moveTo(x, y - arm); p.lineTo(x, y + arm);
        return p;
    }, [lastTapSvg]);

    const circlePath = useMemo(() => {
        if (!showRadiusModal || currentPaths.length === 0) return null;
        const last = currentPaths[currentPaths.length - 1];
        const cx = last.x + centerShift.x;
        const cy = last.y + centerShift.y;
        const p = Skia.Path.Make();
        p.addOval(Skia.XYWHRect(cx - holdRadius, cy - holdRadius, holdRadius * 2, holdRadius * 2));
        return p;
    }, [showRadiusModal, currentPaths, centerShift, holdRadius]);

    return (
        <View
            style={[dimensions, { zIndex: 2, position: "absolute" }]}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {showRadiusModal && (
                <SetRadiusModal
                    closeModal={onRadiusSet}
                    setRadius={setHoldRedius}
                    radius={holdRadius}
                    moveCenter={moveCenter}
                    setCenter={setCenter}
                />
            )}
            {/* Model status banner — visible until encoding is done */}
            {(isEncoding || !isReady) && detectHold && (
                <View style={{
                    position: 'absolute', top: 8, alignSelf: 'center', zIndex: 10,
                    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8,
                    paddingHorizontal: 12, paddingVertical: 4,
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                }}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12 }}>
                        {isEncoding ? 'Preparing wall...' : 'Loading model...'}
                    </Text>
                </View>
            )}

            {/* Detecting spinner */}
            {isDetecting && (
                <View style={{
                    position: 'absolute', zIndex: 10,
                    width: '100%', height: '100%',
                    justifyContent: 'center', alignItems: 'center',
                }}>
                    <ActivityIndicator size="large" color={currentHoldType.color} />
                    <Text style={{ color: '#fff', fontSize: 13, marginTop: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, borderRadius: 6 }}>
                        Detecting hold...
                    </Text>
                </View>
            )}
            <Canvas style={[dimensions, { position: "relative" }]}>
                <Group transform={[{ scale: scaleRatio }]}>
                    {tapCrosshairPath && (
                        <Path
                            path={tapCrosshairPath}
                            color="yellow"
                            style="stroke"
                            strokeWidth={3 / scaleRatio}
                        />
                    )}
                    {drawingPath && !showRadiusModal && (
                        <Path
                            path={drawingPath}
                            color={currentHoldType.color}
                            style="stroke"
                            strokeWidth={strokeWidth}
                            strokeJoin="round"
                            strokeCap="round"
                        />
                    )}
                    {showRadiusModal && circlePath && (
                        <Path
                            path={circlePath}
                            color={currentHoldType.color}
                            style="stroke"
                            strokeWidth={strokeWidth}
                            strokeJoin="round"
                            strokeCap="round"
                        />
                    )}
                </Group>
            </Canvas>
        </View>
    );
};

export default DrawHold;
