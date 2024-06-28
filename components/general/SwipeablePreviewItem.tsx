import { Image, ImageSourcePropType, View } from "react-native"
import { ThemedText } from "./ThemedText"
import ThemedView from "./ThemedView";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import PreviewItem from "./PreviewItem";
import SwipeableComponent from "./Swipeable";
import { Ionicons } from "@expo/vector-icons";

const SwipablePreviewItem: React.FC<React.ComponentProps<typeof PreviewItem> & {
    hiddenComponent?: () => React.JSX.Element
}> = ({ hiddenComponent, ...props }) => {
    return (
        <SwipeableComponent
            frontComponent={() => {
                return (
                    <View>
                        <PreviewItem
                            {...props}
                            style={{ height: 120, borderRadius: 8 }}
                        />
                        <View style={{ position: 'absolute', right: 0, height: 120, justifyContent: "center" }}>
                            <Ionicons size={15} name='arrow-back' />
                        </View>
                    </View>

                )
            }
            }
            hiddenComponent={() => {
                return (
                    <View style={{ height: 120, borderRadius: 8, backgroundColor: "blue", flexDirection: "row" }}>
                        <View style={{ position: "absolute", right: 0, width: 120, height: 120}}>
                            {hiddenComponent?.()}
                        </View>
                    </View>
                )
            }}
            rightOpenValue={-120} />
    )
}

export default SwipablePreviewItem;