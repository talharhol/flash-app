import { ThemedText } from "@/components/general/ThemedText";
import React, { useState } from "react";
import { TextInput, View, StyleSheet } from "react-native";
import { User } from "@/DAL/entities/user";
import BasicModal from "@/components/general/modals/BasicModal";
import BasicButton from "@/components/general/Button";
import { Colors } from "@/constants/Colors";

const EditUserModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    editUser: (user: User) => void;
    user: User;
}> = ({ editUser, user, ...props }) => {
    const [userName, setUserName] = useState(user.name);
    return (
        <BasicModal {...props}>
            <View style={{ width: "100%", alignItems: "center", gap: 20 }}>
                <ThemedText type="subtitle2">edit username</ThemedText>
                <TextInput value={userName} onChangeText={setUserName} style={styles.usernameInput} />
            </View>
            <View style={{ flexDirection: "row" }}>
                <BasicButton text="save" color={Colors.backgroundDark}
                selected
                    onPress={() => {
                        user.name = userName;
                        editUser(user)
                    }
                    } />
            </View>
        </BasicModal>
    );
};

const styles = StyleSheet.create(
    {
        usernameInput: { fontSize: 16, height: 45, width: "80%", borderRadius: 8, borderWidth: 2, backgroundColor: Colors.backgroundExtraLite, padding: 10, borderColor: Colors.backgroundExtraDark, fontWeight: "bold" }
    }
)

export default EditUserModal;