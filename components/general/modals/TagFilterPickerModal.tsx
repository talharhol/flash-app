import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BasicModal from "./BasicModal";
import { Colors } from "@/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IDAL } from "@/DAL/IDAL";

const BUILT_IN_FILTER_TAGS = [
    { tag: "unsent", icon: "close-circle-outline", label: "Unsent" },
    { tag: "project", icon: "flag", label: "Project" },
    { tag: "sent", icon: "check-circle", label: "Sent" },
] as const;

const TagFilterPickerModal: React.FC<{
    dal: IDAL;
    selectedTags: string[];
    onToggleTag: (tag: string) => void;
    onClose: () => void;
}> = ({ dal, selectedTags, onToggleTag, onClose }) => {
    const customTags = dal.ticks.getUserCustomTags();

    return (
        <BasicModal closeModal={onClose} style={styles.modal}>
            <Text style={styles.title}>Filter by Status</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
                {BUILT_IN_FILTER_TAGS.map(({ tag, icon, label }) => {
                    const active = selectedTags.includes(tag);
                    return (
                        <TouchableOpacity
                            key={tag}
                            style={[styles.row, active && styles.rowActive]}
                            onPress={() => onToggleTag(tag)}
                        >
                            <MaterialCommunityIcons
                                name={icon as any}
                                size={20}
                                color={active ? Colors.backgroundDeep : Colors.backgroundDark}
                            />
                            <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>{label}</Text>
                            {active && (
                                <MaterialCommunityIcons
                                    name="check"
                                    size={18}
                                    color={Colors.backgroundDeep}
                                    style={styles.checkmark}
                                />
                            )}
                        </TouchableOpacity>
                    );
                })}

                {customTags.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>CUSTOM TICKS</Text>
                        {customTags.map(tag => {
                            const active = selectedTags.includes(tag);
                            return (
                                <TouchableOpacity
                                    key={tag}
                                    style={[styles.row, active && styles.rowActive]}
                                    onPress={() => onToggleTag(tag)}
                                >
                                    <MaterialCommunityIcons
                                        name="label-outline"
                                        size={20}
                                        color={active ? Colors.backgroundDeep : Colors.backgroundDark}
                                    />
                                    <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>{tag}</Text>
                                    {active && (
                                        <MaterialCommunityIcons
                                            name="check"
                                            size={18}
                                            color={Colors.backgroundDeep}
                                            style={styles.checkmark}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </>
                )}
            </ScrollView>
        </BasicModal>
    );
};

export default TagFilterPickerModal;

const styles = StyleSheet.create({
    modal: {
        width: "78%",
        maxHeight: "65%",
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 20,
    },
    title: {
        fontSize: 17,
        fontWeight: "700",
        color: Colors.backgroundDeep,
        textAlign: "center",
        marginBottom: 14,
        fontFamily: "Nunito",
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.backgroundExtraDark,
        letterSpacing: 0.8,
        marginTop: 12,
        marginBottom: 6,
        fontFamily: "Nunito",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        marginBottom: 4,
        backgroundColor: "white",
        borderWidth: 1.5,
        borderColor: Colors.backgroundLite,
    },
    rowActive: {
        borderColor: Colors.backgroundDark,
        backgroundColor: Colors.backgroundExtraLite,
    },
    rowLabel: {
        fontSize: 14,
        color: Colors.backgroundDark,
        fontFamily: "Nunito",
    },
    rowLabelActive: {
        color: Colors.backgroundDeep,
        fontWeight: "600",
    },
    checkmark: {
        marginLeft: "auto" as any,
    },
});
