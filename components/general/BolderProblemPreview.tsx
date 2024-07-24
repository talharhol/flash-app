import BolderProblem, { BolderProblemComponent } from "@/components/general/BolderProblem";
import { ThemedText } from "@/components/general/ThemedText";
import ThemedView from "@/components/general/ThemedView";
import { grades } from "@/constants/consts";
import { Problem } from "@/DAL/problem";
import { Wall } from "@/DAL/entities/wall";
import { Ionicons } from "@expo/vector-icons";
import { createRef, useEffect, useRef, useState } from "react";
import { Image, useWindowDimensions, View } from "react-native";
import * as Sharing from 'expo-sharing';
import { SwipeRow } from "react-native-swipe-list-view";


const BolderProblemPreview: React.FC<React.ComponentProps<typeof ThemedView> & {
    wall: Wall;
    problem: Problem;
    onPress?: () => void;
}> = ({ wall, problem, onPress, ...props }) => {
    const scale = 0.8;
    const screenDimension = useWindowDimensions();
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    useEffect(() => {
        Image.getSize(Image.resolveAssetSource(wall.image).uri, (w, h) => {
            let tmpWidth = screenDimension.width * scale;
            let tmpHeight = tmpWidth * 1.5;
            if (h / w <= 1.5) {
              tmpHeight = tmpWidth / (w || 1) * h;
            } else {
              tmpHeight = tmpWidth * 1.5;
            }
            setHeight(tmpHeight);
            setWidth(tmpWidth);
          });
    }, []);
    const problemRef = useRef<BolderProblemComponent>(null);

    const swipeRow = createRef<SwipeRow<typeof ThemedView>>();
    const [isOpen, setIsOpen] = useState(false);
    const OnPressWrapper = () => {
        if (isOpen) swipeRow.current?.closeRow();
        else onPress?.();
    };

    return (
        <SwipeRow style={props.style} ref={swipeRow} rightOpenValue={- 250} onRowPress={OnPressWrapper} onRowOpen={() => setIsOpen(true)} onRowClose={() => setIsOpen(false)}>
            <ThemedView {...props} style={[{ backgroundColor: "gray", overflow: "hidden", borderRadius: 8, width: width, height: height }]}>
                <Ionicons
                    onPress={async () => {
                        Sharing.shareAsync(await problemRef.current?.getProblemUrl()!);
                    }}
                    name="share-outline" size={100} color={"white"} style={{ position: "absolute", top: 0, right: 0, marginRight: 5 }} />
                <Ionicons
                    onPress={() => problemRef.current?.exportProblem()}
                    name="code-download-outline" size={100} color={"white"} style={{ position: "absolute", bottom: 0, right: 0, marginRight: 5 }} />
            </ThemedView>
            <ThemedView {...props} style={[{ overflow: "hidden", flexDirection: "column", borderRadius: 8, width: width, height: height }]}>
                <ThemedView style={{ backgroundColor: "rgba(50, 50, 50, 0.4)", flexDirection: "row", justifyContent: 'space-between', position: "absolute", width: "100%", paddingLeft: 5, paddingRight: 5, zIndex: 1 }}>
                    <ThemedText>{problem.name}</ThemedText>
                    <ThemedText>{grades[problem.grade]}</ThemedText>
                </ThemedView>
                <BolderProblem
                    ref={problemRef}
                    scale={scale}
                    wallImage={wall.image}
                    existingHolds={problem.holds}
                    disableMovment
                    bindToImage
                />
                <View style={{ position: 'absolute', right: 0, height: height, justifyContent: "center" }}>
                    <Ionicons size={20} style={{ paddingLeft: 10, paddingBottom: 10, paddingTop: 10 }} name='arrow-back' onPress={() => isOpen ? swipeRow.current?.closeRow() : swipeRow.current?.manuallySwipeRow(-250)} />
                </View>
            </ThemedView>
        </ SwipeRow>
    )
}

export default BolderProblemPreview;