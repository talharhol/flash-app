import { ThemedText } from "@/components/general/ThemedText";
import React from "react";
import { View } from "react-native";
import BasicModal from "./BasicModal";
import BasicButton from "../Buttom";

interface filtersType {

}

const FilterBoldersModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    filters: filtersType,
    onFiltersChange: (filters: filtersType) => void;
}> = ({ ...props  }) => {
    return (
        <BasicModal {...props}>
            <ThemedText lightColor="black" darkColor="black" type="subtitle">bla bla</ThemedText>
            <View style={{ flexDirection: "row" }}>
                <BasicButton text="cancel" color="red" onPress={props.closeModal} />
                <BasicButton text="ok" color="green" onPress={() => {props.closeModal()}} />
            </View>
        </BasicModal>
    );
};

export default FilterBoldersModal;