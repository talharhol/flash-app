import { View } from "react-native"
import PreviewItem from "./PreviewItem";
import { Ionicons } from "@expo/vector-icons";
import { SwipeRow } from "react-native-swipe-list-view";
import React, { createRef, useState } from "react";

const SwipablePreviewItem: React.FC<React.ComponentProps<typeof PreviewItem> & {
    hiddenComponent?: () => React.JSX.Element;
    onPress?: () => void;
}> = ({ hiddenComponent, onPress, ...props }) => {
    const swipeRow = createRef<SwipeRow<View>>();
    const [isOpen, setIsOpen]= useState(false);
    const OnPressWrapper = () => {
        if (isOpen) swipeRow.current?.closeRow();
        else onPress?.();
    };
    return (
        <SwipeRow ref={swipeRow} rightOpenValue={- 120} onRowPress={OnPressWrapper} onRowOpen={() => setIsOpen(true)} onRowClose={() => setIsOpen(false)}>
            <View style={{ height: 120, borderRadius: 8, backgroundColor: "blue", flexDirection: "row" }}>
                <View style={{ position: "absolute", right: 0, width: 120, height: 120 }}>
                    {hiddenComponent?.()}
                </View>
            </View>
            <View>
                <PreviewItem
                    {...props}
                    style={{ height: 120, borderRadius: 8 }}
                />
                <View style={{ position: 'absolute', right: 0, height: 120, justifyContent: "center" }}>
                    <Ionicons size={20} style={{ paddingLeft: 10, paddingBottom: 10, paddingTop: 10 }} name='arrow-back' onPress={() => isOpen ? swipeRow.current?.closeRow() : swipeRow.current?.manuallySwipeRow(-120)} />
                </View>
            </View>
        </SwipeRow>
    )
}

export default SwipablePreviewItem;