import React, { useState } from "react";
import {
    Button,
    Platform,
    StatusBar,
    StyleSheet,
    View,
} from "react-native";
import { Hold, HoldInterface, HoldType, HoldTypes } from "../../../DAL/hold";
import BolderProblem from "@/components/general/BolderProblem";
import { Notifier, Easing } from "react-native-notifier";
import WithCancelNotification from "@/components/general/notifications/WithCancelNotification";
import ActionValidationModal from "@/components/general/modals/ActionValidationModal";
import { router, useLocalSearchParams } from "expo-router";
import ThemedView from "@/components/general/ThemedView";
import { ThemedText } from "@/components/general/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { useDal } from "@/DAL/DALService";


const CreateWallHoldsScreen: React.FC = ({ }) => {
    const dal = useDal();
    const wall = dal.walls.Get({ id: useLocalSearchParams().id as string });
    const [isDrawingHold, setIsDrawingHold] = useState(false);
    const [editedHold, setEditedHold] = useState<string | null>(null);
    const [holds, setHolds] = useState<HoldInterface[]>(wall?.configuredHolds.map((h) => ({ id: h.id, svgPath: h.svgPath, color: new HoldType(HoldTypes.route).color })));
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
        setEditedHold(null);
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
                    onPress={() => router.push("/")}
                    name='close-circle-outline' size={35} color={'#A1CEDC'} style={{ right: 0, padding: 10 }} />
                <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Config Holds</ThemedText>
                <Ionicons
                    onPress={SaveHolds}
                    name='checkmark-circle-outline' size={35} color={'#A1CEDC'} style={{ right: 0, padding: 10 }} />
            </ThemedView>
            {
                editedHold && <ActionValidationModal
                    text="Delete this hold?"
                    closeModal={setEditedHold.bind(this, null)}
                    approveAction={editHold.bind(this, editedHold)} />
            }
            <BolderProblem
                wallImage={wall.image}
                existingHolds={isDrawingHold ? [] : holds}
                onHoldClick={setEditedHold}
                onDrawHoldFinish={onDrawHoldFinish}
                onDrawHoldCancel={() => setIsDrawingHold(false)}
                drawingHoldType={isDrawingHold ? new HoldType(HoldTypes.route) : null}
            />
            <View style={styles.buttonContainer}>
                <Button title="New Hold" onPress={startDrawingHold} />
            </View>
        </View>
    );
};

export default CreateWallHoldsScreen;

const styles = StyleSheet.create({
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        width: "100%",
        flexDirection: "row",
        paddingTop: StatusBar.currentHeight
    },
    problemImage: {
        resizeMode: "center"
    },
    buttonContainer: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginTop: "auto",
        marginBottom: "auto"
    },
    zoomedContainer: {
        maxHeight: "75%",
        overflow: "hidden",
        flex: 1,
    },
    zoomedContent: {
        flex: 1,
        position: "relative",
        display: "flex"
    },
    saveHoldButton: {
        height: 40,
        width: "50%",
        backgroundColor: "green",
        justifyContent: "center",
        alignItems: "center",
    },
    discardHoldButton: {
        height: 40,
        width: "50%",
        backgroundColor: "red",
        justifyContent: "center",
        alignItems: "center",
    },
    sliderLable: { alignSelf: "center" },
    sliderContainer: {
        marginLeft: 10,
        marginRight: 10,
        justifyContent: "center",
    },
    next: { color: "#FF0101" },
    modal: {
        width: "80%",
        height: 260,
        backgroundColor: "#E8E8E8",
        borderRadius: 20,
        opacity: 0.8,
        justifyContent: "space-around",
        alignItems: "center",
    },
    modalContainer: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    addHoldText: { fontWeight: "bold" },
    addHoldTextTitle: { color: "white" },
    addHoldButton: {
        height: 40,
        width: "50%",
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "100%",
        marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        flex: 1,
    },
    problemHeader: {
        height: 50 + (StatusBar.currentHeight ?? 0),
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingLeft: 15,
        paddingRight: 15,
        alignItems: "center",
        backgroundColor: "black",
        opacity: 0.5,
        position: "absolute",
        paddingTop: StatusBar.currentHeight,
        zIndex: 10,
        top: -(StatusBar.currentHeight ?? 0),
    },
    headerText: {
        color: "white",
    },
    problemImageContainer: {
        backgroundColor: "black",
        zIndex: 0,
    },
    problemData: {
        width: "100%",
    },
});
