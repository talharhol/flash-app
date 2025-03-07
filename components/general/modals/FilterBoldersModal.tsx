import { ThemedText } from "@/components/general/ThemedText";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import BasicModal from "./BasicModal";
import BasicButton from "../Button";
import MultiSelect from "react-native-multiple-select";
import SwitchSelector from "react-native-switch-selector";
import { grades } from "@/constants/consts";
import { RangeSlider } from "../RangeSlider";
import { IDAL, ProblemFilter } from "@/DAL/IDAL";
import { Colors } from "@/constants/Colors";


const FilterProblemssModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    initialFilters: ProblemFilter;
    dal: IDAL;
    groupId?: string;
    wallId?: string;
    onFiltersChange: (filters: ProblemFilter) => void;
}> = ({ initialFilters, dal, groupId, wallId, onFiltersChange, ...props }) => {
    const [minGrade, setMinGrade] = useState(initialFilters.minGrade);
    const [maxGrade, setMaxGrade] = useState(initialFilters.maxGrade);
    const [name, setName] = useState(initialFilters.name);
    const [setters, setSetters] = useState<string[]>([]);
    const [problemType, setProblemType] = useState(initialFilters.type);

    useEffect(() => setSetters(initialFilters.setters ?? []), []); // in order to load selected setters
    const usersMultiSelect = useRef<MultiSelect>()
    const Submit = () => {
        onFiltersChange(
            {
                minGrade,
                maxGrade,
                name,
                setters,
                isPublic: initialFilters.isPublic,
                type: problemType,
            }
        );
        props.closeModal();
    }

    return (
        <BasicModal
            {...props}
            closeModal={() => { }}
            onRequestClose={props.closeModal}
            style={[{
                width: "80%",
                height: 600,
                backgroundColor: "#E8E8E8",
                borderRadius: 20,
                opacity: 0.97,
                justifyContent: "space-around",
                alignItems: "center",
            }, props.style]} >
            <ThemedText type="subtitle">Filter Problems</ThemedText>

            <View style={{ flex: 1, width: "100%", padding: 10, justifyContent: "space-around" }}>
                <RangeSlider
                    maxValue={24}
                    minValue={0}
                    maxInitialValue={isNaN(Number(initialFilters.maxGrade)) ? 24 : initialFilters.maxGrade}
                    minInitialValue={isNaN(Number(initialFilters.minGrade)) ? 0 : initialFilters.minGrade}
                    valueToLable={v => grades[v]}
                    onMaxValueChange={setMaxGrade}
                    onMinValueChange={setMinGrade}
                />
                <View style={styles.filterContainer}>
                    <SwitchSelector
                        initial={initialFilters.type === "bolder" ? 0 : (initialFilters.type === "cycle" ? 2 : 1)}
                        textColor={Colors.backgroundDark}
                        selectedColor={Colors.backgroundExtraLite}
                        buttonColor={Colors.backgroundDark}
                        borderColor={Colors.backgroundDark}
                        backgroundColor={Colors.backgroundExtraLite}
                        onPress={(value: string | undefined) => setProblemType(value)}
                        options={[
                            { label: "Bolder", value: "bolder" },
                            { label: "Both", value: undefined },
                            { label: "Cycle", value: "cycle" },
                        ]}
                    />
                </View>
                <View style={styles.filterContainer}>
                    <TextInput
                        style={{ borderRadius: 8, height: 45, borderWidth: 2, borderColor: "#555", width: "90%", fontSize: 16, margin: 5 }}
                        placeholder="Problem's name" value={name} onChangeText={(text) => {
                            setName(text)
                        }} />
                </View>
                <View style={styles.filterContainer}>
                    <View>
                        {usersMultiSelect.current?.getSelectedItemsExt(setters)}
                    </View>
                    <View style={{ width: "100%" }}>
                        <MultiSelect
                            fixedHeight
                            hideTags
                            ref={(component) => { usersMultiSelect.current = component || undefined }}
                            items={dal.users.List({ groupId, wallId })}
                            uniqueKey="id"
                            onSelectedItemsChange={(v) => {
                                setSetters(v);
                            }}
                            selectedItems={setters}
                            selectText="Pick setters"
                            searchInputPlaceholderText="Search Setters..."
                            altFontFamily="ProximaNova-Light"
                            tagRemoveIconColor="black"
                            tagBorderColor="black"
                            tagTextColor="black"
                            selectedItemTextColor="#CCC"
                            selectedItemIconColor="#CCC"
                            itemTextColor="black"
                            displayKey="name"
                            searchInputStyle={{ color: '#CCC' }}
                            submitButtonColor="black"
                            styleDropdownMenu={{ margin: 5, borderRadius: 8, overflow: "hidden" }}
                            styleSelectorContainer={{ margin: 5, borderRadius: 8, overflow: "hidden" }}
                            submitButtonText="Submit"
                        />
                    </View>

                </View>
            </View>
            <BasicButton text="Submit" color="green" style={{ margin: 10 }} onPress={Submit} />

        </BasicModal>
    );
};

export default FilterProblemssModal;

const styles = StyleSheet.create({
    filterContainer: {
        // backgroundColor: Colors.backgroundLite,
        alignItems: "center",
        borderRadius: 8,
        margin: 5,
    }
})