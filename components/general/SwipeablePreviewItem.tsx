import { View } from "react-native"
import PreviewItem from "./PreviewItem";
import React from "react";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { Colors } from "@/constants/Colors";


function RightAction(hiddenComponent?: () => React.JSX.Element) {
    return (
        <View style={{ height: 120, width: "100%", borderRadius: 8, backgroundColor: Colors.backgroundExtraDark, flexDirection: "row" }}>
            <View style={{ position: "absolute", right: 0, width: 120, height: 120 }}>
                {hiddenComponent?.()}
            </View>
        </View>
    )
}

const SwipablePreviewItem: React.FC<React.ComponentProps<typeof PreviewItem> & {
    hiddenComponent?: () => React.JSX.Element;
    onPress?: () => void;
}> = ({ hiddenComponent, onPress, ...props }) => {
    return (
        <Swipeable
            renderRightActions={() => RightAction(hiddenComponent)}
        >
            <TouchableWithoutFeedback onPress={onPress}>
                <PreviewItem
                    {...props}
                    style={{ height: 120, borderRadius: 8 }}
                    onImagePress={onPress}
                />
            </TouchableWithoutFeedback>
        </Swipeable>
    )
}

export default SwipablePreviewItem;