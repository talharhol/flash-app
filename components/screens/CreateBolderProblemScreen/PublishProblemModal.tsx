import React, { useState } from "react";
import { HoldType, HoldTypes } from "../../../dataTypes/hold";
import BasicModal from "@/components/general/modals/BasicModal";
import { Picker } from '@react-native-picker/picker';
import { TextInput } from "react-native";
import { grades } from "@/app/debugData";
import BasicButton from "@/components/general/Buttom";

const PublishProblemModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    publishProblem: ({ name, grade }: { name: string, grade: number }) => void;
}> = ({ publishProblem, ...props }) => {
    const [selectedGrade, setSelectedGrade] = useState<number>(9);
    const [name, setName] = useState<string>('');
    const onPublish = () => {
        publishProblem({ name, grade: selectedGrade });
        props.closeModal();
    }

    return (
        <BasicModal {...props}>
            <TextInput
                style={{ paddingLeft: 20, height: 50, width: "90%", borderColor: "black", borderWidth: 2, borderRadius: 8 }}
                placeholder="Enter name"
                value={name}
                onChangeText={setName}
            />
            <Picker
                style={{ paddingLeft: 20, height: 50, width: "90%", borderColor: "black", borderWidth: 2, borderRadius: 8, backgroundColor: "gray" }}
                selectedValue={selectedGrade}
                onValueChange={(itemValue, itemIndex) =>
                    setSelectedGrade(itemValue)
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
            <BasicButton text="Publish" onPress={onPublish} />

        </BasicModal>
    );
};

export default PublishProblemModal;