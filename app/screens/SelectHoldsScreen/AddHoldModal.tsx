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

enum HoldType {
    start,
    feet,
    top,
}
const holdTypeToHoldColor: Record<HoldType, string> = {
    [HoldType.feet]: "#FFC90C",
    [HoldType.start]: "#19F02F",
    [HoldType.top]: "#FF0C0C",
};
const holdTypeToTitle: Record<HoldType, string> = {
    [HoldType.feet]: "Feet",
    [HoldType.start]: "Start",
    [HoldType.top]: "Top",
};

const AddHoldModal: React.FC<{ closeModal: () => void; addHold: (holdType: HoldType) => void; }> = ({ closeModal, addHold }) => {
    return (
        <Modal
            animationType="fade"
            transparent
            visible
        >
            <TouchableOpacity
            style={{backgroundColor: "rgba(50, 50, 50, 0.4)"}}
                onPress={closeModal}
            >
                <View style={styles.modalContainer}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modal}>
                            {
                                Object.values(HoldType).filter(isFinite).map(hold => {
                                    return (
                                        <TouchableOpacity
                                            key={hold}
                                            onPress={addHold.bind(this, HoldType.start)}
                                            style={[styles.addHoldButton, { borderColor: holdTypeToHoldColor[hold] }]}
                                        >
                                            <Text style={[styles.addHoldText, { color: holdTypeToHoldColor[hold] }]}>
                                                {holdTypeToTitle[hold]}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            }
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableOpacity>
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
        height: 50 + StatusBar.currentHeight,
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
        top: -StatusBar.currentHeight,
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

export default AddHoldModal;