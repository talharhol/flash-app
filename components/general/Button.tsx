import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";

const BasicButton: React.FC<React.ComponentProps<typeof TouchableOpacity> & {
    text: string;
    color?: string;
    selected?: boolean;
}> = ({ text, color, selected, ...props }) => {
    return (
        <TouchableOpacity
            {...props}
            style={[styles.addHoldButton, selected ? {backgroundColor: color, borderColor: "transparent"} : { borderColor: color }, props.style]}
        >
            <Text style={[styles.addHoldText, selected ? {color: "black"} : { color: color }]}>
                {text}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({

    addHoldText: { fontWeight: "bold" },
    addHoldButton: {
        height: 40,
        width: "50%",
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    }
});

export default BasicButton;