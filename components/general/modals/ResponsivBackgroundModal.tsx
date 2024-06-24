import React, { useState } from "react";
import {
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    View,
} from "react-native";

const ResponsiveBackgroundModal: React.FC<React.ComponentProps<typeof Modal> & {
    closeModal: () => void;
    onDrage: (dx: number, dy: number) => void;
    onDrageEnd: (dx: number, dy: number) => void;
}> = ({ closeModal, onDrage, onDrageEnd, children }) => {

    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const onTouchStart: React.ComponentProps<typeof View>["onTouchStart"] = ({ nativeEvent: { locationX: x, locationY: y } }) => {
        setInitialPosition({ x, y });
    }, 
    onTouchEnd: React.ComponentProps<typeof View>["onTouchEnd"] = ({ nativeEvent: { locationX: x, locationY: y } }) => {
        if (isDragging){
            const dx = x - initialPosition.x, dy = y - initialPosition.y;
            onDrageEnd(dx, dy);
            setIsDragging(false);
        }
        else
            closeModal();
    },
    onTouchMove: React.ComponentProps<typeof View>["onTouchMove"] = ({ nativeEvent: { locationX: x, locationY: y } }) => {
        const dx = x - initialPosition.x, dy = y - initialPosition.y;
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6)
            setIsDragging(true);
        if (isDragging)
            onDrage(dx, dy);
    };

    return (
        <Modal
            animationType="fade"
            transparent
            visible
        >
            <View
                style={{ backgroundColor: "rgba(50, 50, 50, 0.1)" }}
                onTouchMove={onTouchMove}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modal}
                        onTouchMove={e => e.stopPropagation()}
                        onTouchStart={e => e.stopPropagation()}
                        onTouchEnd={e => e.stopPropagation()}>
                        {children}
                    </View>
                </View>
            </View>
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
        height: 50,
        backgroundColor: "#E8E8E8",
        borderRadius: 20,
        opacity: 0.4,
        justifyContent: "center",
        alignItems: "stretch",
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

export default ResponsiveBackgroundModal;