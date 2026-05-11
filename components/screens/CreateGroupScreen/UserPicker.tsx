import React, { useState, useMemo, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    Image,
    Modal,
    FlatList,
    StyleSheet,
    SafeAreaView,
    ListRenderItem,
    TouchableOpacity,
} from "react-native";
import { TouchableOpacity as GHTouchableOpacity } from "react-native-gesture-handler";
import { User } from "@/DAL/entities/user";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

const ITEM_HEIGHT = 60;

type Props = {
    users: User[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
};

export const UserPicker: React.FC<Props> = ({ users, selectedIds, onChange }) => {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return users;
        return users.filter((u) => u.name.toLowerCase().includes(q));
    }, [users, search]);

    const selectedUsers = useMemo(
        () => users.filter((u) => selectedSet.has(u.id)),
        [users, selectedSet]
    );

    const toggle = useCallback(
        (id: string) => {
            if (selectedSet.has(id)) {
                onChange(selectedIds.filter((x) => x !== id));
            } else {
                onChange([...selectedIds, id]);
            }
        },
        [selectedIds, selectedSet, onChange]
    );

    const getItemLayout = useCallback(
        (_: ArrayLike<User> | null | undefined, index: number) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
        }),
        []
    );

    const renderItem: ListRenderItem<User> = useCallback(
        ({ item }) => {
            const selected = selectedSet.has(item.id);
            return (
                <TouchableOpacity
                    style={[styles.row, selected && styles.rowSelected]}
                    onPress={() => toggle(item.id)}
                >
                    <Image source={item.image} style={styles.avatar} />
                    <Text style={styles.rowName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    {selected && (
                        <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color={Colors.backgroundExtraDark}
                        />
                    )}
                </TouchableOpacity>
            );
        },
        [selectedSet, toggle]
    );

    return (
        <>
            <View style={styles.chipsContainer}>
                {selectedUsers.map((u) => (
                    <View key={u.id} style={styles.chip}>
                        <Image source={u.image} style={styles.chipAvatar} />
                        <Text style={styles.chipName} numberOfLines={1}>
                            {u.name}
                        </Text>
                        <GHTouchableOpacity
                            onPress={() => toggle(u.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons
                                name="close"
                                size={14}
                                color={Colors.backgroundExtraDark}
                            />
                        </GHTouchableOpacity>
                    </View>
                ))}
                <GHTouchableOpacity
                    style={styles.addChip}
                    onPress={() => setOpen(true)}
                >
                    <Ionicons
                        name="person-add-outline"
                        size={16}
                        color={Colors.backgroundExtraDark}
                    />
                    <Text style={styles.addChipText}>Add members</Text>
                </GHTouchableOpacity>
            </View>

            <Modal
                visible={open}
                animationType="slide"
                onRequestClose={() => setOpen(false)}
            >
                <SafeAreaView style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            Add Members{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
                        </Text>
                        <TouchableOpacity onPress={() => setOpen(false)}>
                            <Ionicons
                                name="checkmark-circle"
                                size={34}
                                color={Colors.backgroundExtraDark}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color="#888" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search climbers..."
                            placeholderTextColor="#888"
                            value={search}
                            onChangeText={setSearch}
                            autoFocus
                            returnKeyType="search"
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch("")}>
                                <Ionicons name="close-circle" size={18} color="#888" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <FlatList
                        data={filtered}
                        keyExtractor={(u) => u.id}
                        renderItem={renderItem}
                        getItemLayout={getItemLayout}
                        extraData={selectedIds}
                        keyboardShouldPersistTaps="handled"
                        maxToRenderPerBatch={20}
                        windowSize={10}
                        initialNumToRender={20}
                        removeClippedSubviews
                    />
                </SafeAreaView>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    chipsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        paddingVertical: 8,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.backgroundDark,
        borderRadius: 20,
        paddingVertical: 4,
        paddingLeft: 4,
        paddingRight: 10,
        gap: 6,
    },
    chipAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    chipName: {
        fontSize: 13,
        color: Colors.textLite,
    },
    addChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.backgroundDark,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 14,
        gap: 6,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: Colors.backgroundExtraDark,
    },
    addChipText: {
        fontSize: 13,
        color: Colors.backgroundExtraDark,
    },
    modal: {
        flex: 1,
        backgroundColor: Colors.backgroundLite,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: Colors.textDark,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        margin: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: Colors.backgroundDark,
        borderRadius: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.textDark,
    },
    row: {
        height: ITEM_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        gap: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.border,
    },
    rowSelected: {
        backgroundColor: Colors.backgroundDark,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    rowName: {
        flex: 1,
        fontSize: 16,
        color: Colors.textDark,
    },
});
