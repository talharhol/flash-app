import React, { useContext, useState } from 'react';
import { View } from "react-native";
import Svg, { Path } from 'react-native-svg';
import { HoldType } from '../../dataTypes/holds';
import { imageSize } from "./SizeContext";

const MAX_MOVEMENT_FOR_PRESS = 6;
const cirlceRadius = 10;

// For SOME REASON svg doesn't like being "position: absolute".... So I wrap it with a postiion:absolut element and everyhing works nice.
const DrawHold: React.FC<{ onFinishedDrawingShape?: (shape: string) => void; currentHoldType: HoldType; }> = ({ currentHoldType, onFinishedDrawingShape }) => {
    const dimensions = useContext(imageSize);
    const [currentPaths, setCurrentPath] = useState<{ x: number, y: number; }[]>([]);
    const onTouchMove: React.ComponentProps<(typeof Svg)>["onTouchMove"] = ({ nativeEvent: { locationX: x, locationY: y } }) => {
        const newPaths = [...currentPaths];

        newPaths.push({ x, y });

        setCurrentPath(newPaths);
    };
    const onTouchEnd: React.ComponentProps<(typeof Svg)>["onTouchEnd"] = ({ nativeEvent: { locationX: x, locationY: y } }) => {
        let pathToSend = "";
        if (
            Math.max(...currentPaths.map(({ x }) => x)) - Math.min(...currentPaths.map(({ x }) => x)) < MAX_MOVEMENT_FOR_PRESS &&
            Math.max(...currentPaths.map(({ y }) => y)) - Math.min(...currentPaths.map(({ y }) => y)) < MAX_MOVEMENT_FOR_PRESS
        )
            pathToSend = `M ${x - cirlceRadius}, ${y} a ${cirlceRadius},${cirlceRadius} 0 1,0 ${cirlceRadius * 2},0 a ${cirlceRadius},${cirlceRadius} 0 1,0 -${cirlceRadius * 2},0`;
        else
            pathToSend = `M${currentPaths.map(({ x, y }) => `${x.toFixed(0)},${y.toFixed(0)}`)} Z`;

        setCurrentPath([]);
        onFinishedDrawingShape?.(pathToSend);
    };

    return (
        <View style={{ zIndex: 2, position: "absolute" }}>
            <Svg
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                style={[dimensions, { position: "relative" }]}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {
                    currentPaths.length > 0 && <Path
                        d={`M${currentPaths.map(({ x, y }) => `${x.toFixed(0)},${y.toFixed(0)}`)}`}
                        stroke={currentHoldType.color}
                        fill='transparent'
                        strokeWidth={2}
                        strokeLinejoin='round'
                        strokeLinecap='round'
                    />
                }
                {/* {
                currentPaths.length > 0 && <Polygon
                    points={currentPaths.reduce((acc, ele) => acc + `${Math.ceil(ele.x)},${Math.ceil(ele.y)} `, "")}
                    stroke={currentHoldType.color}
                    fill='none'
                    strokeWidth={2}
                    strokeLinejoin='round'
                    strokeLinecap='round'
                />
            } */}
            </Svg >
        </View>
    );
};

export default DrawHold;
