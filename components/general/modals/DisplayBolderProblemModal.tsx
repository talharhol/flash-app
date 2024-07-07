import BolderProblem from "@/components/general/BolderProblem";
import BasicModal from "@/components/general/modals/BasicModal";
import { Problem } from "@/DAL/problem";
import { GetWall } from "@/scripts/utils";
import { Ionicons } from "@expo/vector-icons";

const DisplayBolderProblemModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    problem: Problem;
}> = ({ problem, ...props }) => {
    const wall = GetWall({ id: problem.wallId });
    return (
        <BasicModal {...props} style={{}}>
            <BolderProblem
                fullScreen
                wallImage={wall.image}
                existingHolds={problem.holds}
            />
            <Ionicons onPress={props.closeModal} color={"gray"} name="exit-outline" size={50} style={{position: "absolute", margin: 10, right: 0}}/>
        </BasicModal>

    )
}

export default DisplayBolderProblemModal;