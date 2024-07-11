import { Image, ImageSourcePropType, Text, View } from "react-native"
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
                <Text style={{ marginLeft: 10, color: "white", fontSize: 18, fontWeight: "bold" }}>{title}</Text> 
                
                {subTitle && <Text style={{ marginLeft: 10, color: "white", fontSize: 14, }}>{subTitle}</Text> }
                {descriprion && <Text style={{ marginLeft: 10, color: "white", fontSize: 12}}>{descriprion}</Text>}
            </ThemedView>
            {onRemove && <ThemedText style={{ padding: 10, position: 'absolute', flexDirection: 'row', right: 0, top: 0 }} onPress={onRemove}>X</ThemedText>}
        </ThemedView>
    )
}

export default PreviewItem;