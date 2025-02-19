import React, { useContext, useState } from 'react';
import { View } from "react-native";
import Svg, { Path } from 'react-native-svg';
import { imageSize, zoomSize } from './SizeContext';
import { HoldType } from '@/DAL/hold';
import SetRadiusModal from './SelectRadiusModal';


/*
    Renders an svg which the user draws on it hold markings, "returning" the drawn shape using the `OnFinishedDrawingShape`.
    
    For SOME REASON svg doesn't like being "position: absolute".... So I wrap it with a postiion:absolut element and everyhing works nice.
*/
const DrawHold: React.FC<{
    onFinishedDrawingShape?: (shape: string) => void;
    onCancel?: () => void;
    minimalMovingDistance?: number;
    currentHoldType: HoldType;
}> = ({ currentHoldType, onFinishedDrawingShape, onCancel, minimalMovingDistance }) => {
    minimalMovingDistance = minimalMovingDistance || 10;
    const dimensions = useContext(imageSize);
    const [currentPaths, setCurrentPath] = useState<{ x: number, y: number; }[]>([]);
    const [centerShift, setCenterShift] = useState({ x: 0, y: 0 });
    const [showRadiusModal, setShowRadiusModal] = useState(false);
    const defaultRadius = 1000 / 25 ;
    const [isDrawing, setIsDrawing] = useState(false);
    const [holdRadius, setHoldRedius] = useState(defaultRadius);
    const aspectRatio = dimensions.height / dimensions.width;
    const scaleRatio = dimensions.width / 1000;
    const isMoved = (x1: number, x2: number, y1: number, y2: number) => {
        return  (Math.abs(x1 - x2) > minimalMovingDistance || Math.abs(y1 - y2) > minimalMovingDistance)
    }
    const onTouchStart: React.ComponentProps<typeof Svg>["onTouchStart"] = ({ nativeEvent: { locationX: x, locationY: y } }) => {
        x = x / scaleRatio;
        y = y / scaleRatio;
        setCurrentPath(currentPaths.concat([{ x, y }]));
    };
    const onTouchMove: React.ComponentProps<typeof Svg>["onTouchMove"] = ({ nativeEvent: { locationX: x, locationY: y, touches: touches } }) => {
        x = x / scaleRatio;
        y = y / scaleRatio;
        let lastPath = currentPaths[currentPaths.length - 1]
        if (touches.length !== 1) {
            onCancel?.();
            return;
        }
        if (currentPaths.length === 0) {
            setCurrentPath(currentPaths.concat([{ x, y }]));
            return;
        }
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
        dx = dx  / scaleRatio;
        dy = dy  / scaleRatio;
        setCenterShift({ x: dx, y: dy });
    };
    const onTouchEnd: React.ComponentProps<(typeof Svg)>["onTouchEnd"] = ({ nativeEvent: { locationX: x, locationY: y, touches: touches } }) => {
        let pathToSend = "";
        if (touches.length !== 0) return;
        // Check if it's a tap by measuring the distance the finger did.
        if (!isDrawing) {
            setShowRadiusModal(true);
            return;
        }
        pathToSend = `M${currentPaths.map(({ x, y }) => `${x.toFixed(0)},${y.toFixed(0)}`)} Z`;
        setCurrentPath([]);
        onFinishedDrawingShape?.(pathToSend);
        setIsDrawing(false);
    };
    const zoom = useContext(zoomSize);

    return (
        <View style={[dimensions, { zIndex: 2, position: "absolute"} ]}>
            {
                showRadiusModal &&
                <SetRadiusModal
                    closeModal={onRadiusSet}
                    setRadius={setHoldRedius}
                    radius={holdRadius}
                    moveCenter={moveCenter}
                    setCenter={setCenter}
                />
            }
            <Svg
                viewBox={`0 0 1000 ${1000 * aspectRatio}`}
                style={[dimensions, { position: "relative" }]}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onTouchStart={onTouchStart}
            >
                {
                    currentPaths.length > 0 && !showRadiusModal && <Path
                        d={`M${currentPaths.map(({ x, y }) => `${x.toFixed(0)},${y.toFixed(0)}`)}`}
                        stroke={currentHoldType.color}
                        fill='transparent'
                        strokeWidth={2  / (Math.max(1, zoom / 2))}
                        strokeLinejoin='round'
                        strokeLinecap='round'
                    />
                }
                {
                    showRadiusModal && <Path
                        d={`M ${currentPaths[currentPaths.length - 1].x + centerShift.x - holdRadius}, ${currentPaths[currentPaths.length - 1].y + centerShift.y} a ${holdRadius},${holdRadius} 0 1,0 ${holdRadius * 2},0 a ${holdRadius},${holdRadius} 0 1,0 -${holdRadius * 2},0`}
                        stroke={currentHoldType.color}
                        fill='transparent'
                        strokeWidth={2  / (Math.max(1, zoom / 2))}
                        strokeLinejoin='round'
                        strokeLinecap='round'
                    />
                }
            </Svg >

        </View>
    );
};

export default DrawHold;
