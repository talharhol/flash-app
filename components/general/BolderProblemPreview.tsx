import BolderProblem, { BolderProblemComponent } from "@/components/general/BolderProblem";
import { ThemedText } from "@/components/general/ThemedText";
import ThemedView from "@/components/general/ThemedView";
import { grades } from "@/constants/consts";
import { Problem } from "@/DAL/entities/problem";
import { Wall } from "@/DAL/entities/wall";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Image, useWindowDimensions, View } from "react-native";
import * as Sharing from 'expo-sharing';
import { useDal } from "@/DAL/DALService";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { IDAL } from "@/DAL/IDAL";

import React from 'react';


function RightAction(h: number, w: number, problemRef: React.RefObject<BolderProblemComponent>, problem: Problem, dal: IDAL, deleteProblem?: (problem: Problem) => void) {

    return (
        <View style={{ height: h, width: w, backgroundColor: "grey" }}>
                <MaterialCommunityIcons name="share" onPress={async () => {
                         Sharing.shareAsync(await problemRef.current?.getProblemUrl()!);
                     }} size={50} color="white" style={{ position: "absolute", top: 0, right: 0, margin: 10 }} />

                 <MaterialCommunityIcons
                     onPress={() => problemRef.current?.exportProblem()}
                     name="download" size={50} color={"white"} style={{ position: "absolute", bottom: 0, right: 0, margin: 10 }} />
                 {
                     problem.setter === dal.currentUser.id &&
                     <MaterialCommunityIcons
                     onPress={() => deleteProblem?.(problem)}
                     name="delete" size={35} color={"white"} style={{ position: "absolute", top: 0, left: 0, margin: 10 }} />
                 }
        </View>
    );
}


const BolderProblemPreview: React.FC<{
    wall: Wall;
    problem: Problem;
    dal: IDAL;
    aspectRatio?: number;
    onPress?: () => void;
    deleteProblem?: (problem: Problem) => void;
}> = ({ wall, problem, dal, aspectRatio, onPress, deleteProblem }) => {
    const scale = 0.8;
    aspectRatio = aspectRatio ?? 1.5;
    const screenDimension = useWindowDimensions();
    const [height, setHeight] = useState(0);
    const [width, setWidth] = useState(0)
    useEffect(() => {
            Image.getSize(Image.resolveAssetSource(wall.image).uri, (w, h) => {
                let tmpWidth = screenDimension.width * scale;
                let tmpHeight = tmpWidth * aspectRatio;
                if (h / w <= aspectRatio) {
                  tmpHeight = tmpWidth / (w || 1) * h;
                } else {
                  tmpHeight = tmpWidth * aspectRatio;
                }
                setHeight(tmpHeight);
                setWidth(tmpWidth);
              });
        }, []);
        
    const problemRef = useRef<BolderProblemComponent>(null);

    return (
        <Swipeable
            containerStyle={{height: height, width: width, alignSelf: "center"}}
            renderRightActions={() => RightAction(height, width, problemRef, problem, dal, deleteProblem)}
        >
            <TouchableWithoutFeedback onPress={onPress}>
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
            </TouchableWithoutFeedback>
        </Swipeable>
    )
}

export default BolderProblemPreview;