import BolderProblem from "@/components/general/BolderProblem";
import BasicModal from "@/components/general/modals/BasicModal";
import { Colors } from "@/constants/Colors";
import { useDal } from "@/DAL/DALService";
import { Problem } from "@/DAL/entities/problem";
import { IDAL } from "@/DAL/IDAL";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";

const DisplayBolderProblemModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    problem: Problem;
}> = ({ problem, ...props }) => {
    const wall = problem.wall;
    return (
        <BasicModal {...props} style={{ position: "absolute", left: 0, top: 0 }}>
            <BolderProblem
                fullScreen
                wallImage={wall.image}
                existingHolds={problem.holds}
            />
            <Ionicons
                color={Colors.backgroundLite}
                name="exit-outline"
                size={50}
                onPress={props.closeModal}
                style={{ position: "absolute", margin: 10, right: 0, top: 0, paddingTop: Platform.OS === 'ios' ? 40 : 0 }} />
        </BasicModal>
    )
}

export default DisplayBolderProblemModal;