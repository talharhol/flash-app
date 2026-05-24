import React, { useState } from "react";
import BasicModal from "@/components/general/modals/BasicModal";
import { Slider } from '@miblanchard/react-native-slider';
import { StyleSheet, Text, TextInput, View } from "react-native";
import { getRandomName } from "@/scripts/randomNames";
import BasicButton from "@/components/general/Button";
import { useGrades } from "@/hooks/useGrades";
import { Colors } from "@/constants/Colors";

const PublishProblemModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    publishProblem: ({ name, grade }: { name: string, grade: number }) => void;
}> = ({ publishProblem, ...props }) => {
    const [selectedGrade, setSelectedGrade] = useState<number>(9);
    const [name, setName] = useState<string>('');
    const gradeMap = useGrades();
    const onPublish = () => {
        publishProblem({ name: name || getRandomName(), grade: selectedGrade });
        props.closeModal();
    }

    return (
        <BasicModal {...props} style={styles.modal}>
            <Text style={styles.title}>Publish Problem</Text>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Leave blank for random name"
                    placeholderTextColor={Colors.backgroundDark}
                    value={name}
                    onChangeText={setName}
                />
            </View>

            <View style={styles.fieldGroup}>
                <Text style={styles.label}>Grade</Text>
                <Text style={styles.gradeValue}>{gradeMap[selectedGrade]}</Text>
                <Slider
                    minimumValue={0}
                    maximumValue={24}
                    step={1}
                    value={selectedGrade}
                    onValueChange={(value) => setSelectedGrade(Array.isArray(value) ? value[0] : value)}
                    minimumTrackTintColor={Colors.backgroundDeep}
                    maximumTrackTintColor={Colors.backgroundLite}
                    thumbTintColor={Colors.backgroundExtraDark}
                />
            </View>

            <BasicButton
                text="Publish"
                onPress={onPublish}
                color={Colors.confirm}
                selected
                style={styles.publishButton}
            />
        </BasicModal>
    );
};

const styles = StyleSheet.create({
    modal: {
        width: "85%",
        backgroundColor: Colors.surface,
        borderRadius: 20,
        paddingHorizontal: 24,
        paddingVertical: 28,
        gap: 18,
        alignItems: "stretch",
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: Colors.backgroundDeep,
        textAlign: "center",
        marginBottom: 4,
    },
    fieldGroup: {
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.backgroundExtraDark,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    input: {
        height: 48,
        borderColor: Colors.border,
        borderWidth: 1.5,
        borderRadius: 10,
        paddingHorizontal: 14,
        color: Colors.backgroundDeep,
        backgroundColor: Colors.backgroundExtraLite,
        fontSize: 15,
    },
    gradeValue: {
        fontSize: 22,
        fontWeight: "700",
        color: Colors.backgroundDeep,
        textAlign: "center",
    },
    publishButton: {
        width: "100%",
        marginTop: 4,
        borderRadius: 12,
        height: 48,
    },
});

export default PublishProblemModal;
