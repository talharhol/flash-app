import { Image, ImageSourcePropType, View } from "react-native"
import { ThemedText } from "./ThemedText"
import ThemedView from "./ThemedView";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

const PreviewItem: React.FC<React.ComponentProps<typeof View> & {
    onRemove?: () => void;
    image: ImageSourcePropType;
    title: string;
    subTitle?: string;
    descriprion?: string;
    onImagePress?: () => void;
}> = ({ onRemove, image, title, subTitle, descriprion, onImagePress, ...props }) => {
    return (
        <ThemedView {...props} style={[{ flexDirection: 'row', backgroundColor: 'gray', height: 120, borderRadius: 8 }, props.style]}>
            <TouchableWithoutFeedback onPress={onImagePress}>
                <Image source={image} style={{ height: "100%", width: 100, borderBottomLeftRadius: 8, borderTopLeftRadius: 8 }} />
            </TouchableWithoutFeedback>
            <ThemedView style={{ backgroundColor: 'transparent', flexDirection: 'column' }}>
                <ThemedText type="title" style={{ marginLeft: 10 }}>{title}</ThemedText>
                {subTitle && <ThemedText type="subtitle" style={{ marginLeft: 10 }}>{subTitle}</ThemedText>}
                {descriprion && <ThemedText style={{ marginLeft: 10 }}>{descriprion}</ThemedText>}
            </ThemedView>
            {onRemove && <ThemedText style={{ padding: 10, position: 'absolute', flexDirection: 'row', right: 0, top: 0 }} onPress={onRemove}>X</ThemedText>}
        </ThemedView>
    )
}

export default PreviewItem;