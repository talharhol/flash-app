import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { HoldInterface, HoldType, HoldTypes } from "../../../DAL/hold";
import BasicModal from "@/components/general/modals/BasicModal";
import BasicButton from "@/components/general/Button";
import { Colors } from "@/constants/Colors";

const EditHoldModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    editHold: (holdType: HoldType | null, is_delete: boolean) => void;
    selectedHold: HoldInterface;
}> = ({ editHold, selectedHold, ...props }) => {
    const holdTypes = Object.values(HoldTypes)
        .filter(x => typeof x === "number")
        .map(type => new HoldType(type as HoldTypes));

    return (
        <BasicModal {...props} style={styles.modal}>
            <Text style={styles.title}>Edit Hold</Text>
            <View style={styles.grid}>
                {holdTypes.map(hold => (
                    <BasicButton
                        text={hold.title}
                        color={hold.color}
                        onPress={() => editHold(hold, false)}
                        key={hold.type}
                        selected={hold.color === selectedHold.color}
                        style={styles.gridButton}
                    />
                ))}
            </View>
            <View style={styles.divider} />
            <BasicButton
                key="deleteHold"
                text="Delete Hold"
                color={Colors.danger}
                onPress={() => editHold(null, true)}
                style={styles.deleteButton}
            />
        </BasicModal>
    );
};

const styles = StyleSheet.create({
    modal: {
        width: "82%",
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        gap: 14,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.backgroundDeep,
        letterSpacing: 0.3,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
        width: "100%",
    },
    gridButton: {
        width: "45%",
        height: 44,
    },
    divider: {
        width: "100%",
        height: 1,
        backgroundColor: Colors.backgroundLite,
    },
    deleteButton: {
        width: "100%",
        height: 44,
        borderColor: Colors.danger,
    },
});

export default EditHoldModal;
