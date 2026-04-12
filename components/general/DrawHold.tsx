import React, { useContext, useMemo, useState } from 'react';
import { GestureResponderEvent, View } from "react-native";
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { imageSize, zoomSize } from './SizeContext';
import { HoldType } from '@/DAL/hold';
import SetRadiusModal from './SelectRadiusModal';


/*
    Renders a canvas which the user draws on it hold markings, "returning" the drawn shape using the `OnFinishedDrawingShape`.

    For SOME REASON svg doesn't like being "position: absolute".... So I wrap it with a postiion:absolut element and everyhing works nice.
*/
const DrawHold: React.FC<{
    onFinishedDrawingShape?: (shape: string) => void;
    onCancel?: () => void;
    minimalMovingDistance?: number;
    currentHoldType: HoldType;
}> = ({ currentHoldType, onFinishedDrawingShape, onCancel, minimalMovingDistance }) => {
    const zoom = useContext(zoomSize);
    minimalMovingDistance = (minimalMovingDistance || 10) / zoom;
    const dimensions = useContext(imageSize);
    const [currentPaths, setCurrentPath] = useState<{ x: number, y: number; }[]>([]);
    const [centerShift, setCenterShift] = useState({ x: 0, y: 0 });
    const [showRadiusModal, setShowRadiusModal] = useState(false);
    const defaultRadius = 1000 / 25;
    const [isDrawing, setIsDrawing] = useState(false);
    const [holdRadius, setHoldRedius] = useState(defaultRadius);
    const scaleRatio = dimensions.width / 1000;
    const strokeWidth = 2 / Math.max(1, zoom / 8);

    const isMoved = (x1: number, x2: number, y1: number, y2: number) => {
        return (Math.abs(x1 - x2) > minimalMovingDistance || Math.abs(y1 - y2) > minimalMovingDistance);
    };

    const onTouchStart = (e: GestureResponderEvent) => {
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
        if (!isDrawing || currentPaths.length <= 4) {
            setShowRadiusModal(true);
            return;
        }
        const pathToSend = `M${currentPaths.map(({ x, y }) => `${x.toFixed(0)},${y.toFixed(0)}`)} Z`;
        setCurrentPath([]);
        onFinishedDrawingShape?.(pathToSend);
        setIsDrawing(false);
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
            <Canvas style={[dimensions, { position: "relative" }]}>
                <Group transform={[{ scale: scaleRatio }]}>
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
