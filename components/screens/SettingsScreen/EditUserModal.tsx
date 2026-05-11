import { ThemedText } from "@/components/general/ThemedText";
import React, { useState } from "react";
import { TextInput, View, StyleSheet, Text } from "react-native";
import { User } from "@/DAL/entities/user";
import BasicModal from "@/components/general/modals/BasicModal";
import BasicButton from "@/components/general/Button";
import { Colors } from "@/constants/Colors";

const EditUserModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    editUser: (user: User) => void;
    user: User;
}> = ({ editUser, user, closeModal, ...props }) => {
    const [userName, setUserName] = useState(user.name);
    return (
        <BasicModal closeModal={closeModal} {...props} style={styles.modal}>
            <View style={styles.header}>
                <ThemedText type="subtitle2" style={styles.title}>Edit Username</ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.body}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                    value={userName}
                    onChangeText={setUserName}
                    style={styles.input}
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={30}
                    placeholderTextColor={Colors.backgroundDark}
                />
            </View>
            <View style={styles.buttons}>
                <BasicButton
                    text="Cancel"
                    color={Colors.backgroundDark}
                    onPress={closeModal}
                    style={styles.button}
                />
                <BasicButton
                    text="Save"
                    color={Colors.confirm}
                    selected
                    onPress={() => {
                        user.name = userName;
                        editUser(user);
                    }}
                    style={styles.button}
                />
            </View>
        </BasicModal>
    );
};

const styles = StyleSheet.create({
    modal: {
        width: "85%",
        backgroundColor: Colors.surface,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.backgroundLite,
        overflow: "hidden",
        paddingBottom: 20,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 16,
        alignItems: "center",
    },
    title: {
        color: Colors.backgroundDeep,
    },
    divider: {
        height: 1.5,
        backgroundColor: Colors.backgroundLite,
        width: "100%",
    },
    body: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 8,
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.backgroundExtraDark,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    input: {
        fontSize: 16,
        height: 48,
        borderRadius: 10,
        borderWidth: 2,
        backgroundColor: Colors.backgroundExtraLite,
        paddingHorizontal: 14,
        borderColor: Colors.backgroundDark,
        fontWeight: "600",
        color: Colors.textDark,
    },
    buttons: {
        flexDirection: "row",
        paddingHorizontal: 24,
        paddingTop: 16,
        gap: 12,
    },
    button: {
        flex: 1,
        width: undefined,
    },
});

export default EditUserModal;
