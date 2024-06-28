import { ReactNativeZoomableView, ZoomableViewEvent } from "@openspacelabs/react-native-zoomable-view";
import React, { forwardRef, useCallback, useState } from "react";
import { View } from "react-native";
import { imageSize, zoomSize } from "./SizeContext";

const Zoomable: React.FC<React.ComponentProps<typeof ReactNativeZoomableView> & { disableMovement: boolean; }> = ({
    children,
    disableMovement,
    maxZoom,
    ...props
}, ref) => {
    const [zoom, setZoom] = useState(1);
    const disableGestureEvent: React.ComponentProps<typeof View>["onStartShouldSetResponder"] = () => { return disableMovement; };
    const onTransform: React.ComponentProps<typeof ReactNativeZoomableView>["onTransform"] = (zoomableViewEventObject: ZoomableViewEvent) => {
        setZoom(zoomableViewEventObject.zoomLevel);
        return props.onTransform?.(zoomableViewEventObject);
    };
    const disableGesturesCallback = useCallback(disableGestureEvent!, [disableMovement, zoom]);
    const dimensions = React.useContext(imageSize);
    return (

        <ReactNativeZoomableView
            {...props}
            contentWidth={dimensions?.width}
            contentHeight={dimensions?.height}
            maxZoom={maxZoom ?? 4}
            minZoom={1}
            zoomStep={2}
            bindToBorders
            onTransform={onTransform}
            ref={ref}
        >
            <zoomSize.Provider value={zoom}>
                <View onStartShouldSetResponder={disableGesturesCallback}>
                    {children}
                </View>
            </zoomSize.Provider>
        </ReactNativeZoomableView>
    );
};
export default forwardRef(Zoomable) as Zoomable;
