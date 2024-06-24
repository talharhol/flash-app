import BolderProblem from "@/components/general/BolderProblem";
import BasicModal from "@/components/general/modals/BasicModal";
import { Problem } from "@/dataTypes/problem";
import { GetWall } from "@/scripts/utils";

const DisplayBolderProblemModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    problem: Problem;
}> = ({ problem, ...props }) => {
    const wall = GetWall({ id: problem.wallId });
    return (
        <BasicModal {...props} style={{}}>
            <BolderProblem
                wallImage={wall.image}
                existingHolds={problem.holds}
            />
        </BasicModal>

    )
}

export default DisplayBolderProblemModal;