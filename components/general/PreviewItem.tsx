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
        <ThemedView
            {...props}
            style={[
                {
                    flexDirection: 'row',
                    backgroundColor: Colors.backgroundDark,
                    height: 120,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: Colors.backgroundExtraDark,
                },
                props.style,
            ]}>
            <TouchableWithoutFeedback onPress={onImagePress}>
                <Image source={image} style={{ height: "100%", width: 110, borderBottomLeftRadius: 7, borderTopLeftRadius: 7 }} />
            </TouchableWithoutFeedback>
            <ThemedView style={{ backgroundColor: 'transparent', flexDirection: 'column', justifyContent: "center", flex: 1, paddingHorizontal: 12, gap: 4 }}>
                <ThemedText type="subtitle2" style={{ alignSelf: "center", color: Colors.textLite }}>{title}</ThemedText>
                {subTitle && <ThemedText type="default1" style={{ alignSelf: "center", color: Colors.backgroundExtraLite }}>{subTitle}</ThemedText>}
                {descriprion && <ThemedText type="default1" style={{ alignSelf: "center", color: Colors.backgroundExtraLite }}>{descriprion}</ThemedText>}
            </ThemedView>
        </ThemedView>
    )
}

export default PreviewItem;