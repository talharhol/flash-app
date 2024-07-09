import BolderProblem, { BolderProblemComponent } from "@/components/general/BolderProblem";
import { ThemedText } from "@/components/general/ThemedText";
import ThemedView from "@/components/general/ThemedView";
import { grades } from "@/constants/consts";
import { Problem } from "@/DAL/problem";
import { Wall } from "@/DAL/wall";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Image, useWindowDimensions } from "react-native";
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';


const BolderProblemPreview: React.FC<React.ComponentProps<typeof ThemedView> & {
    wall: Wall;
    problem: Problem;
}> = ({ wall, problem, ...props }) => {
    const scale = 0.8;
    const screenDimension = useWindowDimensions();
    const width = screenDimension.width * scale;
    const [height, setHeight] = useState(0);
    useEffect(() => {
        Image.getSize(Image.resolveAssetSource(wall.image).uri, (w, h) => setHeight(width / (w || 1) * h));
    }, []);
    const problemRef = useRef<BolderProblemComponent>(null);

    return (
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
            />
            <TouchableWithoutFeedback
                onPress={() => problemRef.current?.exportProblem()}>
                <Ionicons
                    name="code-download-outline" size={50} color={"white"} style={{ zIndex: 1, position: "absolute", bottom: 0, right: 0, marginRight: 5 }} />
            </TouchableWithoutFeedback>

        </ThemedView>
    )
}

export default BolderProblemPreview;