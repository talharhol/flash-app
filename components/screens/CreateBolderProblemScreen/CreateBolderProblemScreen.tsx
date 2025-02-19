import React, { useCallback, useState } from "react";
import {
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Hold, HoldInterface, HoldType, HoldTypes, holdTypeToHoldColor } from "../../../DAL/hold";
import EditHoldModal from "./EditHoldModal";
import BolderProblem from "@/components/general/BolderProblem";
import BasicButton from "@/components/general/Button";
import { Notifier, Easing } from "react-native-notifier";
import WithCancelNotification from "@/components/general/notifications/WithCancelNotification";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import ThemedView from "@/components/general/ThemedView";
import { ThemedText } from "@/components/general/ThemedText";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import PublishProblemModal from "./PublishProblemModal";
import { Problem } from "@/DAL/entities/problem";
import { useDal } from "@/DAL/DALService";
import { Colors } from "@/constants/Colors";
import ManagmantModal from "@/components/general/modals/ManagmantModal";


const CreateProblemScreen: React.FC = () => {
  const router = useRouter();
  const dal = useDal();
  const wall = dal.walls.Get({ id: useLocalSearchParams().id as string });
  const targetGroup = useLocalSearchParams().groupId as (string | undefined);
  const [isDrawingHold, setIsDrawingHold] = useState(false);
  const [editedHold, setEditedHold] = useState<string | null>(null);
  const [isPublishModal, setIsPublishModal] = useState<boolean>(false);
  const [drawingHoldType, setDrawingHoldType] = useState<HoldType>(new HoldType(HoldTypes.route));
  const [holds, setHolds] = useState<HoldInterface[]>([]);
  const [aspectRatio, setAspectRatio] = useState(1.5);
  const [chooseMode, setChooseMode] = useState(false);
  const [isCycle, setIsCycle] = useState(false);


  useFocusEffect(
    useCallback(
      () => {
        setIsDrawingHold(false);
        setEditedHold(null);
        setIsPublishModal(false);
        setDrawingHoldType(new HoldType(HoldTypes.route));
        setHolds([]);
      }, []
    )
  );

  const startDrawingHold = () => {
    setIsDrawingHold(true);
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
  };
  const onDrawHoldFinish = (hold: HoldInterface) => {
    setHolds(h => h.concat(hold));
    setIsDrawingHold(false);
  };
  const onConfiguredHoldPress = (id: string) => {
    let hold = wall.configuredHolds.filter(v => v.id === id)[0];
    let newHolds = holds.concat([new Hold({ svgPath: hold.svgPath, color: drawingHoldType.color })]);
    setHolds(newHolds);
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
      isPublic: targetGroup === undefined,
      type: isCycle ? "cycle" : "bolder",
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
    <View style={styles.container}>
      {
        isPublishModal && <PublishProblemModal publishProblem={publishProblem} closeModal={() => setIsPublishModal(false)} />
      }
      {
        editedHold &&
        (
          isCycle ?
            <ManagmantModal closeModal={() => setEditedHold(null)}
              deleteObj={() => {
                setHolds(holds.filter(h => h.id !== editedHold));
              }}
              extraActions={{
                "cancel": () => { }
              }} />
            :
            <EditHoldModal
              closeModal={() => setEditedHold(null)}
              selectedHold={holds.filter(v => v.id === editedHold)[0]}
              editHold={(holdType, isDeleted) => editHold(editedHold, holdType, isDeleted)} />
        )
      }
      {
        chooseMode &&
        <ManagmantModal closeModal={() => setChooseMode(false)} extraActions={{
          "cycle": () => {
            setDrawingHoldType(new HoldType(HoldTypes.route));
            setIsCycle(true);
          },
          "bolder": () => setIsCycle(false)
        }} />
      }
      <ThemedView style={styles.headerContainer}>
        <MaterialCommunityIcons
          onPress={() => setChooseMode(true)}
          name='dots-vertical-circle-outline' size={35} color={Colors.backgroundExtraLite} style={{ position: "absolute", left: 0, padding: 10 }} />
        <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Create {isCycle ? 'cycle' : 'bolder'}</ThemedText>
        <Ionicons
          onPress={() => setIsPublishModal(true)}
          name='checkmark-circle-outline' size={35} color={Colors.backgroundExtraLite} style={{ position: "absolute", right: 0, padding: 10 }} />
      </ThemedView>
      <View style={{ flexDirection: "row", backgroundColor: Colors.backgroundDark }}>
          
              {
                Object.values(HoldTypes)
                  .filter(
                    x => (
                      typeof x === "number" &&
                      (!isCycle || [HoldTypes.route, HoldTypes.feet].includes(x))
                    )
                  )
                  .map(type => new HoldType(type as HoldTypes))
                  .map(hold => {
                    return (
                      <View key={hold.type} style={{ flex: 1 }}>
                        <View style={{ height: "100%", width: "100%", backgroundColor: hold.color, opacity: 0.1, position: "absolute", borderRadius: 5 }} />
                        <BasicButton
                          style={{ width: "100%" }}
                          selected={drawingHoldType.type === hold.type}
                          text={hold.title}
                          color={hold.color}
                          onPress={() => setDrawingHoldType(hold)}
                        />
                      </View>
                    );
                  })
              }
              <BasicButton
                style={{ flex: 1 }}
                text="Draw"
                color={Colors.backgroundExtraLite}
                onPress={startDrawingHold}
                key="New"
              />
      </View>
      <View
        onLayout={(event) => {
          const { height, width } = event.nativeEvent.layout;
          setAspectRatio(height / width);
        }}

        style={{ flex: 1, width: "100%", backgroundColor: Colors.backgroundDark }}>
        <BolderProblem
          key={wall.id}
          cycle={isCycle}
          aspectRatio={aspectRatio}
          wallImage={wall.image}
          configuredHolds={wall.configuredHolds}
          existingHolds={holds}
          onConfiguredHoldClick={onConfiguredHoldPress}
          onHoldClick={setEditedHold}
          onDrawHoldFinish={onDrawHoldFinish}
          onDrawHoldCancel={() => setIsDrawingHold(false)}
          disableMovment={isDrawingHold}
          drawingHoldType={isDrawingHold ? drawingHoldType : null}
        />
      </View>
    </View>
  );
};

export default CreateProblemScreen;

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundExtraDark,
    width: "100%",
    flexDirection: "row",
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
    height: 100,
  },
  container: {
    width: "100%",
    height: "100%",
  },
});
