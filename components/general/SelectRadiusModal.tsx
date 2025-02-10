import React, { useContext } from "react";
import { Slider } from '@miblanchard/react-native-slider';
import ResponsiveBackgroundModal from "@/components/general/modals/ResponsivBackgroundModal";
import { zoomSize } from "./SizeContext";
import { Text, View } from "react-native";
import { ThemedText } from "./ThemedText";

const SetRadiusModal: React.FC<{
    closeModal: () => void;
    setRadius: (radius: number) => void;
    radius: number;
    moveCenter: (dx: number, dy: number) => void;
    setCenter: () => void;
}> = ({ closeModal, setRadius, radius, moveCenter, setCenter }) => {
    const zoomLevel = useContext(zoomSize);
    const onDragg = (dx: number, dy: number) => {
        moveCenter(dx / zoomLevel, dy / zoomLevel);
    }
    const onDraggEnd = (dx: number, dy: number) => {
        setCenter();
    }

    return (
        <ResponsiveBackgroundModal onDrage={onDragg} onDrageEnd={onDraggEnd} closeModal={closeModal}>
                <ThemedText style={{alignSelf: "center"}} type="defaultSemiBold"> change radius </ThemedText>
                <Slider
                    value={radius}
                    maximumValue={300}
                    onValueChange={v => { setRadius(v[0]) }}
                />
        </ResponsiveBackgroundModal>
    );
};

export default SetRadiusModal;