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
        <View style={{
                borderRadius: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
            }}>
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
            </View>

    )
}

export default SwipablePreviewItem;