import React from "react";
import {
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    TouchableWithoutFeedback,
    View
} from "react-native";

const BasicModal: React.FC<React.ComponentProps<typeof Modal> & {
    closeModal: () => void;
}> = ({ closeModal, children, style, ...props }) => {
    return (
        <Modal
            animationType="fade"
            transparent
            visible
            onRequestClose={props.onRequestClose ?? closeModal}
        >
            <TouchableWithoutFeedback
                onPress={closeModal}
                style={{backgroundColor: "rgba(50, 50, 50, 0.4)", height: "100%"}}
            >
                <View style={styles.modalContainer}>
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
        opacity: 0.8,
        justifyContent: "space-around",
        alignItems: "center",
    },
    modalContainer: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
});

export default BasicModal;