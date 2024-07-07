import { ThemedText } from "@/components/general/ThemedText";
import React from "react";
import { View } from "react-native";
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
            <View style={{ flexDirection: "row" }}>
                <BasicButton text="cancel" color="red" onPress={closeModal} />
                <BasicButton text="ok" color="green" onPress={() => {approveAction(); closeModal()}} />
            </View>
        </BasicModal>
    );
};

export default ActionValidationModal;