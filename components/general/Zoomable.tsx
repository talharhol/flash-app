import { ReactNativeZoomableView, ReactNativeZoomableViewProps, ZoomableViewEvent } from "@openspacelabs/react-native-zoomable-view";
import React, { forwardRef, useCallback, useState } from "react";
import { View } from "react-native";
import { imageSize, zoomSize } from "./SizeContext";

const Zoomable = forwardRef<ReactNativeZoomableView, ReactNativeZoomableViewProps & { disableMovement: boolean; }>(({
    children,
    disableMovement,
    maxZoom,
    ...props
}, ref) => {
    const [zoomState, setZoomStat] = useState<ZoomableViewEvent | null>(null);
    const onTransform: React.ComponentProps<typeof ReactNativeZoomableView>["onTransform"] = (zoomableViewEventObject: ZoomableViewEvent) => {
        setZoomStat(zoomableViewEventObject);
        return props.onTransform?.(zoomableViewEventObject);
    };
    const dimensions = React.useContext(imageSize);
    if (disableMovement) {
        return <View
         style={{
            width: dimensions?.width,
            height: dimensions?.height,
            transform: [{ scale: zoomState === null ? 1 : zoomState.zoomLevel }, { translateX: zoomState === null ? 0 : zoomState.offsetX }, { translateY: zoomState === null ? 0 : zoomState.offsetY }]
        }}>
            <zoomSize.Provider value={zoomState === null ? 1 : zoomState.zoomLevel}>
                {children}
            </zoomSize.Provider>
        </View>
    }
    return (
        <ReactNativeZoomableView
            {...props}
            contentWidth={dimensions?.width}
            contentHeight={dimensions?.height}
            maxZoom={maxZoom ?? 4}
            initialOffsetX={zoomState === null ? 0 : zoomState.offsetX}
            initialOffsetY={zoomState === null ? 0 : zoomState.offsetY}
            initialZoom={zoomState === null ? 1 : zoomState.zoomLevel}
            minZoom={1}
            zoomStep={2}
            bindToBorders
            onTransform={onTransform}
            ref={ref}
        >
            <zoomSize.Provider value={zoomState === null ? 1 : zoomState.zoomLevel}>
                {children}
            </zoomSize.Provider>
        </ReactNativeZoomableView>
    );
});
export default Zoomable;
