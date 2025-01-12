import React, { useCallback, useState } from "react";
import {
  Button,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { Hold, HoldInterface, HoldType, HoldTypes, holdTypeToHoldColor } from "../../../DAL/hold";
import EditHoldModal from "./EditHoldModal";
import BolderProblem from "@/components/general/BolderProblem";
import BasicButton from "@/components/general/Buttom";
import { Notifier, Easing } from "react-native-notifier";
import WithCancelNotification from "@/components/general/notifications/WithCancelNotification";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import ThemedView from "@/components/general/ThemedView";
import { ThemedText } from "@/components/general/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import PublishProblemModal from "./PublishProblemModal";
import { Problem } from "@/DAL/entities/problem";
import { useDal } from "@/DAL/DALService";


const CreateBolderProblemScreen: React.FC = () => {
  const router = useRouter();
  const dal = useDal();
  const wall = dal.walls.Get({ id: useLocalSearchParams().id as string });
  const targetGroup = useLocalSearchParams().groupId as (string | undefined);
  const [isDrawingHold, setIsDrawingHold] = useState(false);
  const [editedHold, setEditedHold] = useState<string | null>(null);
  const [isPublishModal, setIsPublishModal] = useState<boolean>(false);
  const [drawingHoldType, setDrawingHoldType] = useState<HoldType>(new HoldType(HoldTypes.route));
  const [holds, setHolds] = useState<HoldInterface[]>([]);

  useFocusEffect(
      useCallback(
          () => {
              setIsDrawingHold(false);
              setEditedHold(null);
              setIsPublishModal(false);
              setDrawingHoldType(new HoldType(HoldTypes.route))
              setHolds([]);
          }, []
      )
  );

  const startDrawingHold = () => {
    Notifier.showNotification({
      duration: 3000,
      showAnimationDuration: 300,
      showEasing: Easing.linear,
      hideOnPress: true,
      Component: WithCancelNotification.bind(this, {
        title: 'Create new hold',
        description: 'you can tap or draw a new hold now',
        onCancel: () => { setIsDrawingHold(false); Notifier.hideNotification(); },
      })
    });
    setIsDrawingHold(true);
  };
  const onDrawHoldFinish = (hold: HoldInterface) => {
    setHolds(holds => holds.concat([hold]));
    setIsDrawingHold(false);
  };
  const onConfiguredHoldPress = (id: string) => {
    let holdType = drawingHoldType.type;
    let hold = wall.configuredHolds.filter(v => v.id === id)[0]
    setHolds(holds => holds.concat([new Hold({ svgPath: hold.svgPath, color: holdTypeToHoldColor[holdType] })]));
  }
  const editHold = (id: string, holdType: HoldType | null, is_delete: boolean) => {
    if (is_delete) {
      setHolds(holds.filter(h => h.id !== id));
      setEditedHold(null);
      return;
    }
    if (holdType == null)
      return;
    let hold = holds.filter(v => v.id === id)[0];
    hold.color = holdType.color;
    setHolds(holds.filter(h => h.id !== id).concat([hold]));
  }

  const publishProblem = ({ name, grade }: { name: string, grade: number }) => {
    var problem = new Problem({
      name,
      grade,
      holds,
      wallId: wall.id,
      setter: dal.currentUser.id,
      isPublic: targetGroup === undefined
    });
    dal.problems.Add(problem).then(
      () => {
        if (targetGroup) {
          let group = dal.groups.Get({ id: targetGroup });
          group.AddProblem({ problem_id: problem.id }).finally(
            () => router.navigate({ pathname: "/ViewGroupScreen", params: { id: group.id } })
          );
        }
        else
          router.navigate({ pathname: "/ViewWall", params: { id: wall.id } });
      }
    );

  }

  return (
    <View>
      <ThemedView style={styles.headerContainer}>
        <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Create problem</ThemedText>
        <Ionicons
          onPress={() => setIsPublishModal(true)}
          name='checkmark-circle-outline' size={35} color={'#A1CEDC'} style={{ right: 0, padding: 10 }} />
      </ThemedView>
      <View>
        {
          isPublishModal && <PublishProblemModal publishProblem={publishProblem} closeModal={() => setIsPublishModal(false)} />
        }
        <View style={{ flexDirection: "row" }}>
          {
            Object.values(HoldTypes).filter(x => typeof x === "number").map(type => new HoldType(type as HoldTypes)).map(hold => {
              return (
                <BasicButton
                  style={{ width: "25%" }}
                  selected={drawingHoldType.type === hold.type}
                  text={hold.title}
                  color={hold.color}
                  onPress={() => setDrawingHoldType(hold)}
                  key={hold.type}
                />
              );
            })
          }
        </View>
        {
          editedHold && <EditHoldModal closeModal={setEditedHold.bind(this, null)} editHold={editHold.bind(this, editedHold)} />
        }
        <BolderProblem
          wallImage={wall.image}
          configuredHolds={wall.configuredHolds}
          existingHolds={holds}
          onConfiguredHoldClick={onConfiguredHoldPress}
          onHoldClick={setEditedHold}
          onDrawHoldFinish={onDrawHoldFinish}
          onDrawHoldCancel={() => setIsDrawingHold(false)}
          disableMovment={isDrawingHold}
          drawingHoldType={isDrawingHold ? (drawingHoldType || new HoldType(HoldTypes.route)) : null}
        />
        <View style={styles.buttonContainer}>
          <Button title="New Hold" onPress={startDrawingHold} />
        </View>
      </View>
    </View>
  );
};

export default CreateBolderProblemScreen;

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    width: "100%",
    flexDirection: "row",
    paddingTop: StatusBar.currentHeight
  },
  problemImage: {
    resizeMode: "center"
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: "auto",
    marginBottom: "auto"
  },
  zoomedContainer: {
    maxHeight: "75%",
    overflow: "hidden",
    flex: 1,
  },
  zoomedContent: {
    flex: 1,
    position: "relative",
    display: "flex"
  },
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
    // marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
  header: {
    width: "100%",
    height: 100
  },
  problemImageContainer: {
    backgroundColor: "black",
    zIndex: 0,
  },
  problemData: {
    width: "100%",
  },
});
