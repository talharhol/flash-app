import { ThemedText } from "@/components/general/ThemedText";
import { Colors } from "@/constants/Colors";
import React from "react";
import { StyleSheet, View } from "react-native";
import BasicModal from "./BasicModal";
import BasicButton from "../Button";
import { Ionicons } from "@expo/vector-icons";

const TooManyPublicWallsModal: React.FC<{
    closeModal: () => void;
    onMakePrivate: () => void;
}> = ({ closeModal, onMakePrivate }) => {
    return (
        <BasicModal closeModal={closeModal} style={styles.modal}>
            <Ionicons name="warning-outline" size={40} color={Colors.danger} />
            <ThemedText type="subtitle2" style={{ color: Colors.backgroundDeep, textAlign: "center", paddingHorizontal: 16 }}>
                Too Many Public Walls
            </ThemedText>
            <ThemedText type="default1" style={{ color: Colors.backgroundExtraDark, textAlign: "center", paddingHorizontal: 16 }}>
                You've reached the limit of 3 public walls. Delete a public wall or make this one private.
            </ThemedText>
            <View style={styles.divider} />
            <View style={styles.buttonsContainer}>
                <BasicButton text="Cancel" color={Colors.backgroundExtraDark} onPress={closeModal} style={styles.actionButton} />
                <BasicButton text="Make Private" color={Colors.backgroundDeep} selected onPress={onMakePrivate} style={styles.actionButton} />
            </View>
        </BasicModal>
    );
};

export default TooManyPublicWallsModal;

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
