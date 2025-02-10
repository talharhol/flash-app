import { Image, ImageSourcePropType, Text, View } from "react-native"
import { ThemedText } from "./ThemedText"
import ThemedView from "./ThemedView";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { Colors } from "@/constants/Colors";

const PreviewItem: React.FC<React.ComponentProps<typeof View> & {
    image: ImageSourcePropType;
    title: string;
    subTitle?: string;
    descriprion?: string;
    onImagePress?: () => void;
}> = ({ image, title, subTitle, descriprion, onImagePress, ...props }) => {
    return (
        <ThemedView {...props} style={[{ flexDirection: 'row', backgroundColor: Colors.backgroundDark, height: 120, borderRadius: 8 }, props.style]}>
            <TouchableWithoutFeedback onPress={onImagePress}>
                <Image source={image} style={{ height: "100%", width: 100, borderBottomLeftRadius: 8, borderTopLeftRadius: 8 }} />
            </TouchableWithoutFeedback>
            <ThemedView style={{ backgroundColor: 'transparent', flexDirection: 'column', justifyContent: "center", flex: 1 }}>
                <ThemedText type="subtitle" style={{ alignSelf: "center" }}>{title}</ThemedText> 
                {subTitle && <ThemedText type="subtitle3" style={{ alignSelf: "center" }}>{subTitle}</ThemedText> }
                {descriprion && <ThemedText type="default1" style={{ alignSelf: "center" }}>{descriprion}</ThemedText>}
            </ThemedView>
        </ThemedView>
    )
}

export default PreviewItem;