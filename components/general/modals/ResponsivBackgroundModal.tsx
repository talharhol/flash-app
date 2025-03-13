import React, { useState } from "react";
import {
    Modal,
    StyleSheet,
    View,
} from "react-native";

const ResponsiveBackgroundModal: React.FC<React.ComponentProps<typeof Modal> & {
    closeModal: () => void;
    onDrage: (dx: number, dy: number) => void;
    onDrageEnd: (dx: number, dy: number) => void;
}> = ({ closeModal, onDrage, onDrageEnd, children }) => {

    const [initialPosition, setInitialPosition] = useState<{x: number, y: number} | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const onTouchStart: React.ComponentProps<typeof View>["onTouchStart"] = ({ nativeEvent: { locationX: x, locationY: y } }) => {
        setInitialPosition({ x, y });
    }, 
    onTouchEnd: React.ComponentProps<typeof View>["onTouchEnd"] = ({ nativeEvent: { locationX: x, locationY: y } }) => {        
        if (isDragging && initialPosition !== null){
            const dx = x - initialPosition.x, dy = y - initialPosition.y;
            onDrageEnd(dx, dy);
            setIsDragging(false);
        }
        else
            closeModal();
    },
    onTouchMove: React.ComponentProps<typeof View>["onTouchMove"] = ({ nativeEvent: { locationX: x, locationY: y } }) => {
        if (initialPosition === null) return;
        const dx = x - initialPosition.x, dy = y - initialPosition.y;
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10)
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
    modal: {
        width: "80%",
        height: 80,
        backgroundColor: "#E8E8E8",
        borderRadius: 20,
        opacity: 0.6,
        alignItems: "stretch",
        position: "absolute",
        top: 100
    },
    modalContainer: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
});

export default ResponsiveBackgroundModal;