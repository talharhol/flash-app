import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import BasicModal from "./BasicModal";
import { Colors } from "@/constants/Colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IDAL } from "@/DAL/IDAL";

const BUILT_IN_TAGS = ["project", "sent"] as const;

const TAG_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    project: { icon: "flag", color: Colors.tickProject, label: "Project" },
    sent: { icon: "check-circle", color: Colors.tickSent, label: "Sent" },
};

const TickPickerModal: React.FC<{
    problemId: string;
    dal: IDAL;
    activeTags: string[];
    onToggleTag: (tag: string) => void;
    onClose: () => void;
}> = ({ problemId, dal, activeTags, onToggleTag, onClose }) => {
    const [newTagText, setNewTagText] = useState("");

    const customTags = dal.ticks.getUserCustomTags();
    const activeCustomTags = activeTags.filter(t => !(BUILT_IN_TAGS as readonly string[]).includes(t));
    const allCustomTags = [...new Set([...customTags, ...activeCustomTags])];

    const handleAddCustom = () => {
        const trimmed = newTagText.trim();
        if (!trimmed) return;
        onToggleTag(trimmed);
        setNewTagText("");
    };

    return (
        <BasicModal closeModal={onClose} style={styles.modal}>
            <Text style={styles.title}>Log Tick</Text>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {BUILT_IN_TAGS.map(tag => {
                    const active = activeTags.includes(tag);
                    const cfg = TAG_CONFIG[tag];
                    return (
                        <TouchableOpacity
                            key={tag}
                            style={[styles.row, active && styles.rowActive]}
                            onPress={() => onToggleTag(tag)}
                        >
                            <MaterialCommunityIcons
                                name={cfg.icon as any}
                                size={22}
                                color={active ? cfg.color : Colors.backgroundDark}
                            />
                            <Text style={[styles.rowLabel, active && { color: cfg.color, fontWeight: "600" }]}>
                                {cfg.label}
                            </Text>
                            {active && (
                                <MaterialCommunityIcons
                                    name="check"
                                    size={18}
                                    color={cfg.color}
                                    style={styles.checkmark}
                                />
                            )}
                        </TouchableOpacity>
                    );
                })}

                {allCustomTags.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>PAST TICKS</Text>
                        {allCustomTags.map(tag => {
                            const active = activeTags.includes(tag);
                            return (
                                <TouchableOpacity
                                    key={tag}
                                    style={[styles.row, active && styles.rowActive]}
                                    onPress={() => onToggleTag(tag)}
                                >
                                    <MaterialCommunityIcons
                                        name="label-outline"
                                        size={22}
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

                <Text style={styles.sectionLabel}>NEW TICK</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. flash, redpoint..."
                        placeholderTextColor={Colors.backgroundDark}
                        value={newTagText}
                        onChangeText={setNewTagText}
                        onSubmitEditing={handleAddCustom}
                        returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.addBtn} onPress={handleAddCustom}>
                        <MaterialCommunityIcons name="plus" size={22} color={Colors.textLite} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </BasicModal>
    );
};

export default TickPickerModal;

const styles = StyleSheet.create({
    modal: {
        width: "80%",
        maxHeight: "70%",
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.backgroundDeep,
        textAlign: "center",
        marginBottom: 16,
        fontFamily: "Nunito",
    },
    scroll: {
        flexGrow: 0,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.backgroundExtraDark,
        letterSpacing: 0.8,
        marginTop: 14,
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
        fontSize: 15,
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
    inputRow: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        marginTop: 4,
    },
    input: {
        flex: 1,
        height: 42,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.backgroundDark,
        paddingHorizontal: 12,
        fontSize: 14,
        color: Colors.textDark,
        backgroundColor: "white",
        fontFamily: "Nunito",
    },
    addBtn: {
        height: 42,
        width: 42,
        borderRadius: 10,
        backgroundColor: Colors.backgroundExtraDark,
        justifyContent: "center",
        alignItems: "center",
    },
});
