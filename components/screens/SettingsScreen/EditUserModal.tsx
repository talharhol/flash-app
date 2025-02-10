import { ThemedText } from "@/components/general/ThemedText";
import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { User } from "@/DAL/entities/user";
import BasicModal from "@/components/general/modals/BasicModal";
import BasicButton from "@/components/general/Button";

const EditUserModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    editUser: (user: User) => void;
    user: User;
}> = ({ editUser, user, ...props }) => {
    const [userName, setUserName] = useState(user.name);
    return (
        <BasicModal {...props}>
            <View style={{ width: "100%", alignItems: "center" }}>
                <ThemedText type="defaultSemiBold">edit username</ThemedText>
                <TextInput value={userName} onChangeText={setUserName} style={{ fontSize: 16, height: 40, width: "80%", borderRadius: 8, borderWidth: 2, backgroundColor: "grey", padding: 10 }} />
            </View>
            <View style={{ flexDirection: "row" }}>
                <BasicButton text="save" color="blue"
                    onPress={() => {
                        user.name = userName;
                        editUser(user)
                    }
                    } />
            </View>
        </BasicModal>
    );
};

export default EditUserModal;