import React from "react";
import { HoldInterface, HoldType, HoldTypes } from "../../../DAL/hold";
import BasicModal from "@/components/general/modals/BasicModal";
import BasicButton from "@/components/general/Button";

const EditHoldModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    editHold: (holdType: HoldType | null, is_delete: boolean) => void;
    selectedHold: HoldInterface;
}> = ({ editHold, selectedHold, ...props }) => {
    return (
        <BasicModal {...props}>
            {
                Object.values(HoldTypes).filter(x => typeof x === "number")
                .map(type => new HoldType(type as HoldTypes))
                .map(hold => {
                    return (
                        <BasicButton
                            text={hold.title}
                            color={hold.color}
                            onPress={() => editHold(hold, false)}
                            key={hold.type}
                            selected={hold.color === selectedHold.color}
                        />
                        
                    );
                })
            }
            <BasicButton
                key="deleteHold"
                text="Delete"
                color="black"
                onPress={() => editHold(null, true)}
            />

        </BasicModal>
    );
};

export default EditHoldModal;