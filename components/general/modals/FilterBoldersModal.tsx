import { ThemedText } from "@/components/general/ThemedText";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import BasicModal from "./BasicModal";
import BasicButton from "../Buttom";
import { Picker } from "@react-native-picker/picker";
import MultiSelect from "react-native-multiple-select";
import { ProblemFilter } from "@/DAL/problem";
import { grades } from "@/constants/consts";
import { useDal } from "@/DAL/DALService";


const FilterProblemssModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    initialFilters: ProblemFilter,
    onFiltersChange: (filters: ProblemFilter) => void;
}> = ({ initialFilters, onFiltersChange, ...props }) => {
    const dal = useDal();
    const [minGrade, setMinGrade] = useState(initialFilters.minGrade);
    const [maxGrade, setMaxGrade] = useState(initialFilters.maxGrade);
    const [name, setName] = useState(initialFilters.name);
    const [setters, setSetters] = useState<string[]>([]);
    useEffect(() => setSetters(initialFilters.setters), [])
    const usersMultiSelect = useRef<MultiSelect>()
    const Submit = () => {
        onFiltersChange(
            {
                minGrade,
                maxGrade,
                name,
                setters,
                isPublic: initialFilters.isPublic
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
                opacity: 0.8,
                justifyContent: "space-around",
                alignItems: "center",
            }, props.style]} >
            <ThemedText lightColor="black" darkColor="black" type="subtitle">Filter Problems</ThemedText>
            <View style={{ flex: 1, height: 500, width: "100%", padding: 10, justifyContent: "space-around" }}>
                <View style={styles.filterContainer}>
                    <Text>Min grade</Text>
                    <Picker
                        style={{ paddingLeft: 20, height: 30, width: "90%", borderColor: "black", overflow: "hidden", borderWidth: 2, borderRadius: 8, marginTop: -20, marginBottom: 20 }}
                        selectedValue={minGrade}
                        onValueChange={(itemValue, itemIndex) => {
                            setMinGrade(itemValue);
                        }
                        }>
                        {
                            Object.keys(grades).map((key) => (
                                <Picker.Item
                                    key={key}
                                    label={grades[parseInt(key)]}
                                    value={parseInt(key)}
                                />
                            ))
                        }
                    </Picker>
                </View>
                <View style={styles.filterContainer}>
                    <Text>Max grade</Text>
                    <Picker
                        style={{ paddingLeft: 20, height: 30, width: "90%", borderColor: "black", overflow: "hidden", borderWidth: 2, borderRadius: 8, marginTop: -20, marginBottom: 20 }}
                        selectedValue={maxGrade}
                        onValueChange={(itemValue, itemIndex) => {
                            setMaxGrade(itemValue);
                        }
                        }>
                        {
                            Object.keys(grades).map((key) => (
                                <Picker.Item
                                    style={{ height: 20 }}
                                    key={key}
                                    label={grades[parseInt(key)]}
                                    value={parseInt(key)}
                                />
                            ))
                        }
                    </Picker>
                </View>
                <View style={styles.filterContainer}>
                    <Text>Problem's name</Text>
                    <TextInput
                        style={{ borderRadius: 8, height: 40, borderWidth: 2, borderColor: "black", width: "90%", padding: 10, fontSize: 18, margin: 5 }}
                        placeholder="name" value={name} onChangeText={(text) => {
                            setName(text)
                        }} />
                </View>
                <View style={styles.filterContainer}>
                    <Text>Setters</Text>
                    <View>
                        {usersMultiSelect.current?.getSelectedItemsExt(setters)}
                    </View>
                    <View style={{ width: "100%" }}>
                        <MultiSelect
                            fixedHeight
                            hideTags
                            ref={(component) => { usersMultiSelect.current = component || undefined }}
                            items={dal.getUsers({})}
                            uniqueKey="id"
                            onSelectedItemsChange={(v) => {
                                setSetters(v);
                            }}
                            selectedItems={setters}
                            selectText="Pick setters"
                            searchInputPlaceholderText="Search Setters..."
                            onChangeInput={(text) => console.log(text)}
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
        backgroundColor: "gray",
        alignItems: "center",
        borderRadius: 8,
        margin: 5,
    }
})