import { ThemedText } from "@/components/general/ThemedText";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import BasicModal from "./BasicModal";
import BasicButton from "../Button";
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
    const [setters, setSetters] = useState<string[]>(initialFilters.setters ?? []);
    const [problemType, setProblemType] = useState(initialFilters.type);
    const [tag, setTag] = useState(initialFilters.tag);
    const [setterSearch, setSetterSearch] = useState("");

    const users = dal.users.List({ groupId, wallId });
    const selectedUsers = users.filter(u => setters.includes(u.id));
    const filteredUsers = users.filter(u =>
        !setters.includes(u.id) &&
        u.name.toLowerCase().includes(setterSearch.toLowerCase())
    );

    const toggleSetter = (id: string) =>
        setSetters(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

    const Submit = () => {
        onFiltersChange({ minGrade, maxGrade, name, setters, isPublic: initialFilters.isPublic, type: problemType, tag });
        props.closeModal();
    };

    return (
        <BasicModal
            {...props}
            closeModal={() => {}}
            onRequestClose={props.closeModal}
            style={[{
                width: "88%",
                backgroundColor: Colors.surface,
                borderRadius: 20,
                padding: 18,
                maxHeight: "90%",
            }, props.style]}
        >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <ThemedText type="subtitle" style={styles.title}>Filter Problems</ThemedText>

                <View style={styles.section}>
                    <Text style={styles.label}>GRADE RANGE</Text>
                    <RangeSlider
                        maxValue={24}
                        minValue={0}
                        maxInitialValue={isNaN(Number(initialFilters.maxGrade)) ? 24 : initialFilters.maxGrade}
                        minInitialValue={isNaN(Number(initialFilters.minGrade)) ? 0 : initialFilters.minGrade}
                        valueToLable={v => grades[v]}
                        onMaxValueChange={setMaxGrade}
                        onMinValueChange={setMinGrade}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>TYPE</Text>
                    <SwitchSelector
                        initial={initialFilters.type === "bolder" ? 0 : (initialFilters.type === "cycle" ? 2 : 1)}
                        textColor={Colors.backgroundDeep}
                        selectedColor={Colors.textLite}
                        buttonColor={Colors.backgroundDark}
                        borderColor={Colors.backgroundDark}
                        backgroundColor={Colors.backgroundExtraLite}
                        onPress={(value: string | undefined) => setProblemType(value)}
                        options={[
                            { label: "Boulder", value: "bolder" },
                            { label: "Both", value: undefined },
                            { label: "Route", value: "cycle" },
                        ]}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>STATUS</Text>
                    <SwitchSelector
                        initial={initialFilters.tag === "project" ? 1 : (initialFilters.tag === "sent" ? 2 : (initialFilters.tag === "unsent" ? 3 : 0))}
                        textColor={Colors.backgroundDeep}
                        selectedColor={Colors.textLite}
                        buttonColor={Colors.backgroundDark}
                        borderColor={Colors.backgroundDark}
                        backgroundColor={Colors.backgroundExtraLite}
                        onPress={(value: string | undefined) => setTag(value)}
                        options={[
                            { label: "All", value: undefined },
                            { label: "Project", value: "project" },
                            { label: "Sent", value: "sent" },
                            { label: "Unsent", value: "unsent" },
                        ]}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>NAME</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Search by name..."
                        placeholderTextColor={Colors.backgroundDark}
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {users.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.label}>SETTERS</Text>
                        {selectedUsers.length > 0 && (
                            <View style={[styles.chipsContainer, { marginBottom: 8 }]}>
                                {selectedUsers.map(user => (
                                    <TouchableOpacity
                                        key={user.id}
                                        style={[styles.chip, styles.chipSelected]}
                                        onPress={() => toggleSetter(user.id)}
                                    >
                                        <Text style={[styles.chipText, styles.chipTextSelected]}>
                                            {user.name} ✕
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        <TextInput
                            style={styles.textInput}
                            placeholder="Search setters..."
                            placeholderTextColor={Colors.backgroundDark}
                            value={setterSearch}
                            onChangeText={setSetterSearch}
                        />
                        {filteredUsers.length > 0 && (
                            <View style={[styles.chipsContainer, { marginTop: 8 }]}>
                                {filteredUsers.map(user => (
                                    <TouchableOpacity
                                        key={user.id}
                                        style={styles.chip}
                                        onPress={() => toggleSetter(user.id)}
                                    >
                                        <Text style={styles.chipText}>{user.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            <BasicButton text="Apply Filters" color="green" style={styles.submitBtn} onPress={Submit} />
        </BasicModal>
    );
};

export default FilterProblemssModal;

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: 4,
    },
    title: {
        textAlign: "center",
        marginBottom: 18,
    },
    section: {
        marginBottom: 16,
    },
    label: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.backgroundExtraDark,
        marginBottom: 7,
        letterSpacing: 0.8,
        fontFamily: "Nunito",
    },
    textInput: {
        borderRadius: 10,
        height: 44,
        borderWidth: 1.5,
        borderColor: Colors.backgroundDark,
        paddingHorizontal: 12,
        fontSize: 15,
        color: Colors.textDark,
        backgroundColor: "white",
        fontFamily: "Nunito",
    },
    chipsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.backgroundDark,
        backgroundColor: "white",
    },
    chipSelected: {
        backgroundColor: Colors.backgroundDark,
        borderColor: Colors.backgroundDark,
    },
    chipText: {
        fontSize: 13,
        color: Colors.backgroundExtraDark,
        fontFamily: "Nunito",
    },
    chipTextSelected: {
        color: Colors.textLite,
        fontWeight: "600",
    },
    submitBtn: {
        marginTop: 10,
        alignSelf: "center",
    },
});
