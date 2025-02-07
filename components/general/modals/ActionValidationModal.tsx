import { ThemedText } from "@/components/general/ThemedText";
import React from "react";
import { StyleSheet, View } from "react-native";
import BasicModal from "./BasicModal";
import BasicButton from "../Buttom";
import { ColorPallet } from "@/constants/Colors";

const ActionValidationModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    approveAction: () => void;
    text: string;
}> = ({ closeModal, approveAction, text }) => {
    return (
        <BasicModal closeModal={closeModal}>
            <ThemedText lightColor={ColorPallet.light.text} darkColor={ColorPallet.light.text} type="subtitle">{text}</ThemedText>
            <View style={styles.buttonsContainer}>
                <BasicButton text="cancel" color="#555" onPress={closeModal} style={styles.actionButton}/>
                <BasicButton text="ok" color="#0056B3" onPress={() => {approveAction(); closeModal()}} style={styles.actionButton} />
            </View>
        </BasicModal>
    );
};

export default ActionValidationModal;

const styles = StyleSheet.create({
    buttonsContainer: {flexDirection: "row", justifyContent: "space-around", width: "100%"},
    actionButton: {
        height: 40,
        width: "40%",
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    }
});