import React from "react";
import { HoldType, HoldTypes } from "../../../DAL/hold";
import BasicModal from "@/components/general/modals/BasicModal";
import BasicButton from "@/components/general/Buttom";

const EditHoldModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    editHold: (holdType: HoldType | null, is_delete: boolean) => void;
}> = ({ editHold, ...props }) => {
    return (
        <BasicModal {...props}>
            {
                Object.values(HoldTypes).filter(x => typeof x === "number").map(type => new HoldType(type as HoldTypes)).map(hold => {
                    return (
                        <BasicButton
                            text={hold.title}
                            color={hold.color}
                            onPress={editHold.bind(this, hold, false)}
                            key={hold.type}
                        />
                        
                    );
                })
            }
            <BasicButton
                key="deleteHold"
                text="Delete"
                color="red"
                onPress={editHold.bind(this, null, true)}
            />

        </BasicModal>
    );
};

export default EditHoldModal;