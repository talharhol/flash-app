import { Wall } from "@/dataTypes/wall";
import { ThemedText } from "@/components/general/ThemedText";
import React from "react";
import {
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";

const BasicModal: React.FC<React.ComponentProps<typeof Modal> & {
    closeModal: () => void;
}> = ({ closeModal, children, style }) => {
    return (
        <Modal
            animationType="fade"
            transparent
            visible
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
    saveHoldButton: {
        height: 40,
        width: "50%",
        backgroundColor: "green",
        justifyContent: "center",
        alignItems: "center",
    },
    discardHoldButton: {
        height: 40,
        width: "50%",
        backgroundColor: "red",
        justifyContent: "center",
        alignItems: "center",
    },
    sliderLable: { alignSelf: "center" },
    sliderContainer: {
        marginLeft: 10,
        marginRight: 10,
        justifyContent: "center",
    },
    next: { color: "#FF0101" },
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
    addHoldText: { fontWeight: "bold" },
    addHoldTextTitle: { color: "white" },
    addHoldButton: {
        height: 40,
        width: "50%",
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "100%",
        marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        flex: 1,
    },
    problemHeader: {
        height: 50 + (StatusBar.currentHeight ?? 0),
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingLeft: 15,
        paddingRight: 15,
        alignItems: "center",
        backgroundColor: "black",
        opacity: 0.5,
        position: "absolute",
        paddingTop: StatusBar.currentHeight,
        zIndex: 10,
        top: -(StatusBar.currentHeight ?? 0),
    },
    headerText: {
        color: "white",
    },
    problemImageContainer: {
        backgroundColor: "black",
        zIndex: 0,
    },
    problemImage: {},
    problemData: {
        width: "100%",
    },
});

export default BasicModal;