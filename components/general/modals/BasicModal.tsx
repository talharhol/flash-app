import React from "react";
import {
    Modal,
    StyleSheet,
    TouchableWithoutFeedback,
    View
} from "react-native";

const BasicModal: React.FC<React.ComponentProps<typeof Modal> & {
    closeModal: () => void;
    backgroundColor?: string;
}> = ({ closeModal, children, style, backgroundColor, ...props }) => {
    return (
        <Modal
            animationType="fade"
            transparent
            visible
            onRequestClose={props.onRequestClose ?? closeModal}
        >
            <TouchableWithoutFeedback
                onPress={closeModal}
                style={{height: "100%"}}
            >
                <View style={[styles.modalContainer, {backgroundColor: backgroundColor ?? "rgba(50, 50, 50, 0.4)"}]}>
                    <TouchableWithoutFeedback>
                        <View style={style ?? styles.modal}>
                            {children}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>

    );
};

const styles = StyleSheet.create({
    modal: {
        width: "80%",
        height: 260,
        backgroundColor: "#E8E8E8",
        borderRadius: 20,
        opacity: 0.97,
        justifyContent: "space-around",
        alignItems: "center",
    },
    modalContainer: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center"
    },
});

export default BasicModal;