import BolderProblem, { BolderProblemComponent } from "@/components/general/BolderProblem";
import { ThemedText } from "@/components/general/ThemedText";
import ThemedView from "@/components/general/ThemedView";
import { grades } from "@/constants/consts";
import { Problem } from "@/DAL/entities/problem";
import { TickTag } from "@/DAL/entities/userTick";
import { Wall } from "@/DAL/entities/wall";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Image, useWindowDimensions, View } from "react-native";
import Share from 'react-native-share';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { IDAL } from "@/DAL/IDAL";

import React from 'react';
import { Colors } from "@/constants/Colors";


function RightAction(
    h: number,
    w: number,
    problemRef: React.RefObject<BolderProblemComponent>,
    problem: Problem,
    wall: Wall,
    dal: IDAL,
    tag: TickTag | undefined,
    onSetTag: (tag: TickTag | undefined) => void,
    deleteProblem?: (problem: Problem) => void,
) {
    return (
        <View style={{ height: h, width: w, backgroundColor: Colors.backgroundExtraDark, borderRadius: 8, alignItems: "center", justifyContent: "center" }}>
            <MaterialCommunityIcons name="share" onPress={async () => {
                const imageUri = await problemRef.current?.getProblemUrl()!;
                const shareUrl = `https://flash-b9950.web.app/?wallId=${wall.id}&problemId=${problem.id}`;
                await Share.open({
                    title: problem.name,
                    message: `Check out "${problem.name}" (${grades[problem.grade]}) on Flash App!\n${shareUrl}`,
                    url: imageUri,
                    failOnCancel: false,
                });
            }} size={50} color={Colors.backgroundExtraLite} style={{ position: "absolute", top: 0, right: 0, margin: 10 }} />

            <MaterialCommunityIcons
                onPress={() => problemRef.current?.exportProblem()}
                name="download" size={50} color={Colors.backgroundExtraLite} style={{ position: "absolute", bottom: 0, right: 0, margin: 10 }} />

            {problem.setter === dal.currentUser.id &&
                <MaterialCommunityIcons
                    onPress={() => deleteProblem?.(problem)}
                    name="delete" size={35} color={Colors.backgroundExtraLite} style={{ position: "absolute", top: 0, left: 0, margin: 10 }} />
            }

            <MaterialCommunityIcons
                name={tag === "project" ? "flag" : "flag-outline"}
                size={40}
                color={tag === "project" ? Colors.tickProject : Colors.backgroundExtraLite}
                onPress={() => onSetTag(tag === "project" ? undefined : "project")}
                style={{ position: "absolute", bottom: 0, left: 0, margin: 10 }}
            />

            <MaterialCommunityIcons
                name={tag === "sent" ? "check-circle" : "check-circle-outline"}
                size={40}
                color={tag === "sent" ? Colors.tickSent : Colors.backgroundExtraLite}
                onPress={() => onSetTag(tag === "sent" ? undefined : "sent")}
                style={{ position: "absolute", bottom: 0, left: 60, margin: 10 }}
            />

            <Image source={require("../../assets/images/loggo.png")} style={{ height: 150, width: 150 }} />
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
    const [width, setWidth] = useState(0);
    const [tag, setTag] = useState<TickTag | undefined>(dal.currentUser.getProblemStatus(problem.id));

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

    const handleSetTag = (newTag: TickTag | undefined) => {
        dal.currentUser.setProblemStatus(problem.id, newTag);
        setTag(newTag);
    };

    return (
        <View style={{
            height: height,
            width: width,
            alignSelf: "center",
            borderRadius: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 16,
        }}>
        <Swipeable
            containerStyle={{ height: height, width: width, alignSelf: "center" }}
            renderRightActions={() => RightAction(height, width, problemRef, problem, wall, dal, tag, handleSetTag, deleteProblem)}
        >
            <TouchableWithoutFeedback onPress={onPress}>
                <ThemedView style={{ backgroundColor: "rgba(50, 50, 50, 0.5)", flexDirection: "row", justifyContent: 'space-between', alignItems: "center", position: "absolute", width: "100%", paddingLeft: 5, paddingRight: 5, zIndex: 1, borderTopRightRadius: 8, borderTopLeftRadius: 8 }}>
                    <ThemedText lite>{problem.name}</ThemedText>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {tag === "project" &&
                            <MaterialCommunityIcons name="flag" size={16} color={Colors.tickProject} />
                        }
                        {tag === "sent" &&
                            <MaterialCommunityIcons name="check-circle" size={16} color={Colors.tickSent} />
                        }
                        <ThemedText lite>{grades[problem.grade]}</ThemedText>
                    </View>
                </ThemedView>
                <BolderProblem
                    ref={problemRef}
                    scale={scale}
                    wallImage={wall.image}
                    existingHolds={problem.holds}
                    cycle={problem.type === "cycle"}
                    disableMovment
                    bindToImage
                />
            </TouchableWithoutFeedback>
        </Swipeable>
        </View>
    )
}

export default BolderProblemPreview;
