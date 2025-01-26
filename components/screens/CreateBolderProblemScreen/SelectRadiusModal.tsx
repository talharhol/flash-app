import React, { useContext } from "react";
import { Slider } from '@miblanchard/react-native-slider';
import { zoomSize } from "../../general/SizeContext";
import ResponsiveBackgroundModal from "@/components/general/modals/ResponsivBackgroundModal";

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
            <Slider
                value={radius}
                maximumValue={300}
                onValueChange={v => { setRadius(v[0]) }}
            />
        </ResponsiveBackgroundModal>
    );
};

export default SetRadiusModal;