import React, { useCallback, useState } from "react";
import {
    Button,
    Platform,
    StatusBar,
    StyleSheet,
    View,
} from "react-native";
import { Hold, HoldInterface, HoldType, HoldTypes, holdTypeToHoldColor } from "../../../DAL/hold";
import BolderProblem from "@/components/general/BolderProblem";
import { Notifier, Easing } from "react-native-notifier";
import WithCancelNotification from "@/components/general/notifications/WithCancelNotification";
import ActionValidationModal from "@/components/general/modals/ActionValidationModal";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import ThemedView from "@/components/general/ThemedView";
import { ThemedText } from "@/components/general/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { useDal } from "@/DAL/DALService";
import BasicButton from "@/components/general/Button";
import { Colors } from "@/constants/Colors";


const CreateWallHoldsScreen: React.FC = ({ }) => {
    const dal = useDal();
    const wall = dal.walls.Get({ id: useLocalSearchParams().id as string });
    const [isDrawingHold, setIsDrawingHold] = useState(false);
    const [isExitRequest, setIsExitRequest] = useState(false);
    const [holdToDelete, setHoldToDelete] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState(1.5);
    const [holds, setHolds] = useState<HoldInterface[]>(wall?.configuredHolds.map((h) => ({ ...h, color: holdTypeToHoldColor[HoldTypes.route] })));
    useFocusEffect(
        useCallback(
            () => {
                setIsDrawingHold(false);
                setHoldToDelete(null);
                setHolds(wall.configuredHolds.map(h => ({ ...h, color: holdTypeToHoldColor[HoldTypes.route] })));
            }, []
        )
    );
    const startDrawingHold = () => {
        Notifier.showNotification({
            duration: 3000,
            showAnimationDuration: 300,
            showEasing: Easing.linear,
            hideOnPress: true,
            Component: WithCancelNotification.bind(this, {
                title: 'Create new hold',
                description: 'you can tap or draw a new hold now',
                onCancel: () => { setIsDrawingHold(false); Notifier.hideNotification(); },
            })
        });
        setIsDrawingHold(true);
    };
    const onDrawHoldFinish = (hold: HoldInterface) => {
        setHolds(holds => holds.concat([hold]));
        setIsDrawingHold(false);
    };
    const editHold = (id: string) => {
        setHolds(holds.filter(h => h.id !== id));
        setHoldToDelete(null);
    };
    const SaveHolds = () => {
        wall.configuredHolds = holds;
        dal.walls.Update(wall);
        router.push("/");
    }

    return (
        <View style={[styles.container]}>
            <ThemedView style={styles.headerContainer}>
                <Ionicons
                    onPress={() => setIsExitRequest(true)}
                    name='close-circle-outline' size={35} color={Colors.backgroundExtraLite} style={{ position: "absolute", left: 0, padding: 10 }} />
                <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Create Holds</ThemedText>
                <Ionicons
                    onPress={SaveHolds}
                    name='checkmark-circle-outline' size={35} color={Colors.backgroundExtraLite} style={{ position: "absolute", right: 0, padding: 10 }} />
            </ThemedView>
            {
                holdToDelete && <ActionValidationModal
                    text="Delete this hold?"
                    closeModal={setHoldToDelete.bind(this, null)}
                    approveAction={editHold.bind(this, holdToDelete)} />
            }
            {
                isExitRequest && <ActionValidationModal
                    text="Are you sure?"
                    subText="changes might not be saved"
                    closeModal={() => setIsExitRequest(false)}
                    approveAction={() => router.push("/")} />
            }
            <View
                onLayout={(event) => {
                    const { height, width } = event.nativeEvent.layout;
                    setAspectRatio(height / width);
                }}

                style={{ flex: 1, width: "100%", backgroundColor: Colors.backgroundDark }}>
                <BolderProblem
                    wallImage={wall.image}
                    existingHolds={isDrawingHold ? [] : holds}
                    onHoldClick={setHoldToDelete}
                    onDrawHoldFinish={onDrawHoldFinish}
                    onDrawHoldCancel={() => setIsDrawingHold(false)}
                    drawingHoldType={isDrawingHold ? new HoldType(HoldTypes.route) : null}
                    aspectRatio={aspectRatio}
                />
            </View>
            <View style={styles.buttonContainer}>
                <BasicButton text="New Hold" color={Colors.backgroundExtraDark} selected onPress={startDrawingHold} />
            </View>
        </View>
    );
};

export default CreateWallHoldsScreen;

const styles = StyleSheet.create({
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.backgroundExtraDark,
        width: "100%",
        flexDirection: "row",
        paddingTop: Platform.OS === 'ios' ? 50 : 0,
        height: 100,
    },
    buttonContainer: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginTop: "auto",
        marginBottom: "auto",

    },
    container: {
        width: "100%",
        backgroundColor: Colors.backgroundDark,
        flex: 1,
    },
});
