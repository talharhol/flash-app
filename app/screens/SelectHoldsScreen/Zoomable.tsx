import { ReactNativeZoomableView } from "@openspacelabs/react-native-zoomable-view";
import React, { useCallback } from "react";
import { View } from "react-native";
import { imageSize } from "./SizeContext";

const Zoomable: React.FC<React.ComponentProps<typeof View> & { disableMovement?: boolean; }> = ({
    children,
    disableMovement,
    ...props
}) => {
    const disableGesturesCallback = useCallback(() => { return disableMovement; }, [disableMovement]);
    const dimensions = React.useContext(imageSize);
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
