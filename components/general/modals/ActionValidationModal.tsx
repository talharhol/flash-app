import { ThemedText } from "@/components/general/ThemedText";
import React from "react";
import { View } from "react-native";
import BasicModal from "./BasicModal";
import BasicButton from "../Buttom";

const ActionValidationModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    approveAction: () => void;
    text: string;
}> = ({ closeModal, approveAction, text }) => {
    return (
        <BasicModal closeModal={closeModal}>
            <ThemedText lightColor="black" darkColor="black" type="subtitle">{text}</ThemedText>
            <View style={{ flexDirection: "row" }}>
                <BasicButton text="cancel" color="red" onPress={closeModal} />
                <BasicButton text="ok" color="green" onPress={() => {approveAction(); closeModal()}} />
            </View>
        </BasicModal>
    );
};

export default ActionValidationModal;