import React from "react";
import { View } from "react-native";
import BasicModal from "./BasicModal";
import BasicButton from "../Button";

export interface ManagmentModalProps {
    edit?: () => void;
    deleteObj?: () => void;
    leave?: () => void;
    remove?: () => void;
    extraActions?: {[key: string]: () => void;};
}

const ManagmantModal: React.FC<
React.ComponentProps<typeof BasicModal> & ManagmentModalProps
> = ({ closeModal, edit, deleteObj, leave, remove, extraActions }) => {
    return (
        <BasicModal closeModal={closeModal}>
            <View style={{ flexDirection: "column", width: "100%", alignItems: "center"}}>
                {
                    !!edit &&
                    <BasicButton text="Edit" color="gray" onPress={() => {edit(); closeModal()}} style={{width: "50%", margin: 10}}/>
                }
                {
                    !!leave &&
                    <BasicButton text="Leave" color="gray" onPress={() => {leave(); closeModal()}} style={{width: "50%", margin: 10}}/>
                }
                {
                    !!remove &&
                    <BasicButton text="Remove" color="gray" onPress={() => {remove(); closeModal()}} style={{width: "50%", margin: 10}}/>
                }
                {
                    !!deleteObj &&
                    <BasicButton text="Delete" color="red" onPress={() => {deleteObj(); closeModal()}} style={{width: "50%", margin: 10}}/>
                }
                {
                    !!extraActions &&
                    Object.keys(extraActions).map(
                        k => <BasicButton text={k} color="gray" onPress={() => {extraActions[k](); closeModal()}} style={{width: "50%", margin: 10}}/>
                    )
                }
            </View>
        </BasicModal>
    );
};

export default ManagmantModal;