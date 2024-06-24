import { Image, ImageSourcePropType, View } from "react-native"
import { ThemedText } from "./ThemedText"
import ThemedView from "./ThemedView";

const PreviewItem: React.FC<React.ComponentProps<typeof View> & {
    onRemove?: () => void;
    image: ImageSourcePropType;
    title: string;
    subTitle?: string;
    descriprion?: string;
}> = ({ onRemove, image, title, subTitle, descriprion, ...props }) => {
    return (
        <ThemedView {...props} style={{ flexDirection: 'row', backgroundColor: 'red', height: 120, borderRadius: 8 }}>
            <Image source={image} style={{ height: 120, width: 100, borderBottomLeftRadius: 8, borderTopLeftRadius: 8 }} />
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