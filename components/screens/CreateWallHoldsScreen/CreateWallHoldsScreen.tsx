import React, { useState } from "react";
import {
    Button,
    Platform,
    StatusBar,
    StyleSheet,
    View,
} from "react-native";
import { Hold, HoldType, HoldTypes } from "../../../dataTypes/hold";
import BolderProblem from "@/components/general/BolderProblem";
import { Notifier, Easing } from "react-native-notifier";
import WithCancelNotification from "@/components/general/notifications/WithCancelNotification";
import ActionValidationModal from "@/components/general/modals/ActionValidationModal";
import { useLocalSearchParams } from "expo-router";
import { GetWall } from "@/scripts/utils";


const CreateWallHoldsScreen: React.FC = ({ }) => {
    const wall = GetWall(useLocalSearchParams());
    const [isDrawingHold, setIsDrawingHold] = useState(false);
    const [editedHold, setEditedHold] = useState<string | null>(null);
    const [holds, setHolds] = useState<Hold[]>(wall?.configuredHolds.map((h) => new Hold({ id: h.id, svgPath: h.svgPath, type: new HoldType(HoldTypes.route) })));
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
    const onDrawHoldFinish = (hold: Hold) => {
        setHolds(holds => holds.concat([hold]));
        setIsDrawingHold(false);
    };
    const editHold = (id: string) => {
        setHolds(holds.filter(h => h.id !== id));
        setEditedHold(null);
    }

    return (
        <View style={[styles.container]}>
            {
                editedHold && <ActionValidationModal
                    text="Delete this hold?"
                    closeModal={setEditedHold.bind(this, null)}
                    approveAction={editHold.bind(this, editedHold)} />
            }
            <BolderProblem
                wallImage={wall.image}
                existingHolds={holds}
                onHoldClick={setEditedHold}
                onDrawHoldFinish={onDrawHoldFinish}
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
