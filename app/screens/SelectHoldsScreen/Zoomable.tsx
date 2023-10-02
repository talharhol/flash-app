import { ReactNativeZoomableView, ReactNativeZoomableViewProps } from "@openspacelabs/react-native-zoomable-view";
import React, { useCallback } from "react";
import { PanResponder, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

const Zoomable: React.FC<React.ComponentProps<typeof View> & { dimensions?: { height: number, width: number; }; disableMovement?: boolean; }> = ({
    children,
    dimensions,
    disableMovement,
    ...props
}) => {
    const disableGesturesCallback = useCallback(() => { return disableMovement; }, [disableMovement]);
    return (
        <ReactNativeZoomableView
            {...props}
            contentWidth={dimensions?.width}
            contentHeight={dimensions?.height}
            maxZoom={4}
            minZoom={0.6}
            doubleTapDelay={0}
            bindToBorders
        >
            <View onStartShouldSetResponder={disableGesturesCallback}>
                {children}
            </View>
        </ReactNativeZoomableView>
    );
};
export default Zoomable;
