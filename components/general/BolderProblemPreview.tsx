import BolderProblem, { BolderProblemComponent } from "@/components/general/BolderProblem";
import { ThemedText } from "@/components/general/ThemedText";
import ThemedView from "@/components/general/ThemedView";
import { getGradeMap } from "@/constants/consts";
import { useGrades } from "@/hooks/useGrades";
import { Problem } from "@/DAL/entities/problem";
import { Wall } from "@/DAL/entities/wall";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, useWindowDimensions, View } from "react-native";
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
    const iconSize = compact ? 22 : 30;
    const fontSize = compact ? 9 : 12;
    const btnPad = compact ? 6 : 10;
    const btnGap = compact ? 6 : 10;

    const ActionBtn = ({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color?: string }) => (
        <TouchableWithoutFeedback onPress={onPress}>
            <View style={{
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.25)",
                borderRadius: 10,
                paddingVertical: btnPad,
                paddingHorizontal: btnPad * 1.5,
                gap: 4,
                minWidth: compact ? 52 : 68,
            }}>
                <MaterialCommunityIcons name={icon as any} size={iconSize} color={color ?? Colors.backgroundExtraLite} />
                {!compact && <ThemedText lite style={{ fontSize, fontWeight: "600", letterSpacing: 0.3 }}>{label}</ThemedText>}
            </View>
        </TouchableWithoutFeedback>
    );

    return (
        <View style={{
            height: h,
            width: w,
            backgroundColor: Colors.backgroundExtraDark,
            borderRadius: 8,
        }}>
            <Image source={require("../../assets/images/loggo.png")} style={{ position: "absolute", alignSelf: "center", top: h / 2 - (compact ? 30 : 50), height: compact ? 60 : 100, width: compact ? 60 : 100 }} />

            {/* top-left: delete (setter only) */}
            {problem.setter === dal.currentUser.id &&
                <View style={{ position: "absolute", top: btnGap, left: btnGap }}>
                    <ActionBtn icon="delete" label="Delete" onPress={() => deleteProblem?.(problem)} color={Colors.danger} />
                </View>
            }

            {/* top-right: share */}
            <View style={{ position: "absolute", top: btnGap, right: btnGap }}>
                <ActionBtn icon="share" label="Share" onPress={async () => {
                    const imageUri = await problemRef.current?.getProblemUrl()!;
                    const shareUrl = `https://flash-b9950.web.app/?wallId=${wall.id}&problemId=${problem.id}`;
                    await Share.open({
                        title: problem.name,
                        message: `Check out "${problem.name}" (${getGradeMap(dal.currentUser.gradingSystem)[problem.grade]}) on Flash App!\n${shareUrl}`,
                        url: imageUri,
                        failOnCancel: false,
                    });
                }} />
            </View>

            {/* bottom-left: tick */}
            <View style={{ position: "absolute", bottom: btnGap, left: btnGap }}>
                <ActionBtn icon="ticket-confirmation-outline" label="Tick" onPress={onOpenTickPicker} />
            </View>

            {/* bottom-right: save */}
            <View style={{ position: "absolute", bottom: btnGap, right: btnGap }}>
                <ActionBtn icon="download" label="Save" onPress={() => problemRef.current?.exportProblem()} />
            </View>
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
    const gradeMap = useGrades();
    const [height, setHeight] = useState(0);
    const [width, setWidth] = useState(0);
    const [tags, setTags] = useState<string[]>(dal.currentUser.getProblemTags(problem.id));
    const [tickModalVisible, setTickModalVisible] = useState(false);
    const bumpAnim = useRef(new Animated.Value(0)).current;
    const hasBumped = useRef(false);

    useEffect(() => {
        if (height > 0 && !hasBumped.current && dal.currentUser.loginCount <= 10) {
            hasBumped.current = true;
            const timer = setTimeout(() => {
                Animated.sequence([
                    Animated.timing(bumpAnim, { toValue: -35, duration: 250, useNativeDriver: true }),
                    Animated.timing(bumpAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
                ]).start();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [height]);

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
            backgroundColor: Colors.backgroundExtraDark,
        }}>
        <Swipeable
            containerStyle={{ height: height, width: width, alignSelf: "center" }}
            renderRightActions={() => RightAction(height, width, problemRef, problem, wall, dal, () => setTickModalVisible(true), deleteProblem, compact)}
        >
            <Animated.View style={{ transform: [{ translateX: bumpAnim }] }}>
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
                        <ThemedText lite style={{ fontSize: compact ? 10 : 16 }}>{gradeMap[problem.grade]}</ThemedText>
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
            </Animated.View>
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
