import { ThemedText } from "@/components/general/ThemedText";
import { Colors } from "@/constants/Colors";
import React from "react";
import { StyleSheet, View } from "react-native";
import BasicModal from "./BasicModal";
import BasicButton from "../Button";

const ActionValidationModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    approveAction: () => void;
    cancelAction?: () => void;
    text: string;
    subText?: string;
}> = ({ closeModal, approveAction, cancelAction, text, subText }) => {
    cancelAction = cancelAction ? cancelAction : closeModal;
    return (
        <BasicModal closeModal={closeModal} style={styles.modal}>
            <ThemedText type="subtitle2" style={{ color: Colors.backgroundDeep, textAlign: "center", paddingHorizontal: 16 }}>{text}</ThemedText>
            {subText &&
                <ThemedText type="default1" style={{ color: Colors.backgroundExtraDark, textAlign: "center", paddingHorizontal: 16 }}>{subText}</ThemedText>
            }
            <View style={styles.divider} />
            <View style={styles.buttonsContainer}>
                <BasicButton text="Cancel" color={Colors.backgroundExtraDark} onPress={cancelAction} style={styles.actionButton} />
                <BasicButton text="OK" color={Colors.backgroundDeep} selected onPress={() => { approveAction(); closeModal(); }} style={styles.actionButton} />
            </View>
        </BasicModal>
    );
};

export default ActionValidationModal;

const styles = StyleSheet.create({
    modal: {
        width: "80%",
        paddingVertical: 28,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    divider: {
        height: 1,
        width: "85%",
        backgroundColor: Colors.backgroundLite,
        borderRadius: 1,
    },
    buttonsContainer: { flexDirection: "row", justifyContent: "space-around", width: "100%" },
    actionButton: {
        height: 44,
        width: "40%",
        borderRadius: 12,
    },
});