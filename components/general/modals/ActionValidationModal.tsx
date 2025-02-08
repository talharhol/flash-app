import { ThemedText } from "@/components/general/ThemedText";
import React from "react";
import { StyleSheet, View } from "react-native";
import BasicModal from "./BasicModal";
import BasicButton from "../Button";
import { ColorPallet } from "@/constants/Colors";

const ActionValidationModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    approveAction: () => void;
    text: string;
    subText?: string;
}> = ({ closeModal, approveAction, text, subText }) => {
    return (
        <BasicModal closeModal={closeModal} style={styles.modal}>
            <ThemedText lightColor={ColorPallet.light.text} darkColor={ColorPallet.light.text} type="subtitle">{text}</ThemedText>
            {subText && 
            <ThemedText lightColor={ColorPallet.light.text} darkColor={ColorPallet.light.text} type="default">{subText}</ThemedText>
}
            <View style={styles.buttonsContainer}>
                <BasicButton text="cancel" color="#555" onPress={closeModal} style={styles.actionButton}/>
                <BasicButton text="ok" color="#0056B3" onPress={() => {approveAction(); closeModal()}} style={styles.actionButton} />
            </View>
        </BasicModal>
    );
};

export default ActionValidationModal;

const styles = StyleSheet.create({
    modal: {
        width: "80%",
        height: 260,
        backgroundColor: "#E8E8E8",
        borderRadius: 20,
        opacity: 0.97,
        justifyContent: "space-around",
        alignItems: "center",
    },
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