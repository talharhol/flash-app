import BolderProblem, { BolderProblemComponent } from "@/components/general/BolderProblem";
import { ThemedText } from "@/components/general/ThemedText";
import ThemedView from "@/components/general/ThemedView";
import { grades } from "@/constants/consts";
import { Problem } from "@/DAL/entities/problem";
import { Wall } from "@/DAL/entities/wall";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Image, useWindowDimensions, View } from "react-native";
import Share from 'react-native-share';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { IDAL } from "@/DAL/IDAL";
import TickPickerModal from "@/components/general/modals/TickPickerModal";

import React from 'react';
import { Colors } from "@/constants/Colors";


function RightAction(
    h: number,
    w: number,
    problemRef: React.RefObject<BolderProblemComponent>,
    problem: Problem,
    wall: Wall,
    dal: IDAL,
    onOpenTickPicker: () => void,
    deleteProblem?: (problem: Problem) => void,
    compact?: boolean,
) {
    const iconLg = compact ? 30 : 50;
    const iconMd = compact ? 25 : 40;
    const iconSm = compact ? 20 : 35;
    const margin = compact ? 5 : 10;
    const logoSize = compact ? 75 : 150;

    return (
        <View style={{ height: h, width: w, backgroundColor: Colors.backgroundExtraDark, borderRadius: 8, alignItems: "center", justifyContent: "center" }}>
            <Image source={require("../../assets/images/loggo.png")} style={{ height: logoSize, width: logoSize }} />
            <MaterialCommunityIcons name="share" onPress={async () => {
                const imageUri = await problemRef.current?.getProblemUrl()!;
                const shareUrl = `https://flash-b9950.web.app/?wallId=${wall.id}&problemId=${problem.id}`;
                await Share.open({
                    title: problem.name,
                    message: `Check out "${problem.name}" (${grades[problem.grade]}) on Flash App!\n${shareUrl}`,
                    url: imageUri,
                    failOnCancel: false,
                });
            }} size={iconLg} color={Colors.backgroundExtraLite} style={{ position: "absolute", top: 0, right: 0, margin }} />

            <MaterialCommunityIcons
                onPress={() => problemRef.current?.exportProblem()}
                name="download" size={iconLg} color={Colors.backgroundExtraLite} style={{ position: "absolute", bottom: 0, right: 0, margin }} />

            {problem.setter === dal.currentUser.id &&
                <MaterialCommunityIcons
                    onPress={() => deleteProblem?.(problem)}
                    name="delete" size={iconSm} color={Colors.backgroundExtraLite} style={{ position: "absolute", top: 0, left: 0, margin }} />
            }

            <MaterialCommunityIcons
                name="ticket-confirmation-outline"
                size={iconMd}
                color={Colors.backgroundExtraLite}
                onPress={onOpenTickPicker}
                style={{ position: "absolute", bottom: 0, left: 0, margin }}
            />
        </View>
    );
}


const BolderProblemPreview: React.FC<{
    wall: Wall;
    problem: Problem;
    dal: IDAL;
    aspectRatio?: number;
    compact?: boolean;
    onPress?: () => void;
    deleteProblem?: (problem: Problem) => void;
}> = ({ wall, problem, dal, aspectRatio, compact, onPress, deleteProblem }) => {
    const scale = compact ? 0.38 : 0.8;
    aspectRatio = aspectRatio ?? 1.5;
    const screenDimension = useWindowDimensions();
    const [height, setHeight] = useState(0);
    const [width, setWidth] = useState(0);
    const [tags, setTags] = useState<string[]>(dal.currentUser.getProblemTags(problem.id));
    const [tickModalVisible, setTickModalVisible] = useState(false);

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
    }, [scale]);

    const problemRef = useRef<BolderProblemComponent>(null);

    const handleToggleTag = (tag: string) => {
        dal.currentUser.toggleProblemTag(problem.id, tag);
        setTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const customTagCount = tags.filter(t => t !== "project" && t !== "sent").length;

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
            renderRightActions={() => RightAction(height, width, problemRef, problem, wall, dal, () => setTickModalVisible(true), deleteProblem, compact)}
        >
            <TouchableWithoutFeedback onPress={onPress}>
                <ThemedView style={{ backgroundColor: "rgba(50, 50, 50, 0.5)", flexDirection: "row", justifyContent: 'space-between', alignItems: "center", position: "absolute", width: "100%", paddingLeft: compact ? 3 : 5, paddingRight: compact ? 3 : 5, zIndex: 1, borderTopRightRadius: 8, borderTopLeftRadius: 8 }}>
                    <ThemedText lite style={{ fontSize: compact ? 10 : 16 }}>{compact && problem.name.length > 16 ? problem.name.slice(0, 16) + '…' : problem.name}</ThemedText>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: compact ? 3 : 6 }}>
                        {tags.includes("project") &&
                            <MaterialCommunityIcons name="flag" size={compact ? 10 : 16} color={Colors.tickProject} />
                        }
                        {tags.includes("sent") &&
                            <MaterialCommunityIcons name="check-circle" size={compact ? 10 : 16} color={Colors.tickSent} />
                        }
                        {customTagCount > 0 &&
                            <MaterialCommunityIcons name="label" size={compact ? 10 : 16} color={Colors.backgroundExtraLite} />
                        }
                        <ThemedText lite style={{ fontSize: compact ? 10 : 16 }}>{grades[problem.grade]}</ThemedText>
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
        {tickModalVisible && (
            <TickPickerModal
                problemId={problem.id}
                dal={dal}
                activeTags={tags}
                onToggleTag={handleToggleTag}
                onClose={() => setTickModalVisible(false)}
            />
        )}
        </View>
    )
}

export default BolderProblemPreview;
