import React, { useContext, useState } from 'react';
import { View, useWindowDimensions } from "react-native";
import Svg, { Path } from 'react-native-svg';
import { imageSize } from './SizeContext';
import { HoldType } from '@/dataTypes/hold';
import SetRadiusModal from '../screens/CreateBolderProblemScreen/SelectRadiusModal';


const MAX_MOVEMENT_FOR_PRESS = 6;
/*
    Renders an svg which the user draws on it hold markings, "returning" the drawn shape using the `OnFinishedDrawingShape`.
    
    For SOME REASON svg doesn't like being "position: absolute".... So I wrap it with a postiion:absolut element and everyhing works nice.
*/
const DrawHold: React.FC<{
     onFinishedDrawingShape?: (shape: string) => void; 
     currentHoldType: HoldType; 
    }> = ({ currentHoldType, onFinishedDrawingShape }) => {
    const dimensions = useContext(imageSize);
    const [currentPaths, setCurrentPath] = useState<{ x: number, y: number; }[]>([]);
    const [centerShift, setCenterShift] = useState({ x: 0, y: 0 });
    const [showRadiusModal, setShowRadiusModal] = useState(false);
    const screenDimension = useWindowDimensions();
    const defaultRadius = screenDimension.width / 25;

    const [holdRadius, setHoldRedius] = useState(defaultRadius);
    const onTouchMove: React.ComponentProps<typeof Svg>["onTouchMove"] = ({ nativeEvent: { locationX: x, locationY: y, touches: touches } }) => {
        let lastPath = currentPaths[currentPaths.length - 1]
        if (touches.length !== 1)
            return;
        if (currentPaths.length && !(Math.abs(lastPath.x - x) > 2 || Math.abs(lastPath.y - y) > 2 ))
            return;
        const newPaths = [...currentPaths];
        newPaths.push({ x, y });
        setCurrentPath(newPaths);
    };
    const setCenter = () => {
        let newPath = {x: currentPaths[currentPaths.length - 1].x + centerShift.x, y: currentPaths[currentPaths.length - 1].y + centerShift.y};
        setCenterShift({x: 0, y: 0});
        setCurrentPath(currentPaths.concat([newPath]));
    };
    const onRadiusSet = () => {
        setShowRadiusModal(false);
        onFinishedDrawingShape?.(`M ${currentPaths[currentPaths.length - 1].x + centerShift.x - holdRadius}, ${currentPaths[currentPaths.length - 1].y + centerShift.y} a ${holdRadius},${holdRadius} 0 1,0 ${holdRadius * 2},0 a ${holdRadius},${holdRadius} 0 1,0 -${holdRadius * 2},0`);
        setCurrentPath([]);
        setCenterShift({x:0, y: 0});
        setHoldRedius(defaultRadius);
    };
    const moveCenter = (dx: number, dy: number) => {
        setCenterShift({ x: dx, y: dy });
    };
    const onTouchEnd: React.ComponentProps<(typeof Svg)>["onTouchEnd"] = ({ nativeEvent: { locationX: x, locationY: y, touches: touches } }) => {
        let pathToSend = "";
        if (touches.length !== 0) return;
        // Check if it's a tap by measuring the distance the finger did.
        if (
            Math.max(...currentPaths.map(({ x }) => x)) - Math.min(...currentPaths.map(({ x }) => x)) < MAX_MOVEMENT_FOR_PRESS &&
            Math.max(...currentPaths.map(({ y }) => y)) - Math.min(...currentPaths.map(({ y }) => y)) < MAX_MOVEMENT_FOR_PRESS
        ) {
            setShowRadiusModal(true);
            return;
        }
        pathToSend = `M${currentPaths.map(({ x, y }) => `${x.toFixed(0)},${y.toFixed(0)}`)} Z`;
        setCurrentPath([]);
        onFinishedDrawingShape?.(pathToSend);
    };
    return (
        <View style={{ zIndex: 2, position: "absolute", height: dimensions.height, width: dimensions.width }}>
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
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                style={[dimensions, { position: "relative" }]}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {
                    currentPaths.length > 0 && !showRadiusModal && <Path
                        d={`M${currentPaths.map(({ x, y }) => `${x.toFixed(0)},${y.toFixed(0)}`)}`}
                        stroke={currentHoldType.color}
                        fill='transparent'
                        strokeWidth={2}
                        strokeLinejoin='round'
                        strokeLinecap='round'
                    />
                }
                {
                    showRadiusModal && <Path
                        d={`M ${currentPaths[currentPaths.length - 1].x + centerShift.x - holdRadius}, ${currentPaths[currentPaths.length - 1].y + centerShift.y} a ${holdRadius},${holdRadius} 0 1,0 ${holdRadius * 2},0 a ${holdRadius},${holdRadius} 0 1,0 -${holdRadius * 2},0`}
                        stroke={currentHoldType.color}
                        fill='transparent'
                        strokeWidth={2}
                        strokeLinejoin='round'
                        strokeLinecap='round'
                    />
                }
            </Svg >

        </View>
    );
};

export default DrawHold;
