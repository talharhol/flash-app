import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Hold, HoldInterface, HoldType, HoldTypes } from "../../../DAL/hold";
import EditHoldModal from "./EditHoldModal";
import BolderProblem from "@/components/general/BolderProblem";
import { Notifier, Easing } from "react-native-notifier";
import HoldTypeSelector from "./HoldTypeSelector";
import WithCancelNotification from "@/components/general/notifications/WithCancelNotification";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import ThemedView from "@/components/general/ThemedView";
import { ThemedText } from "@/components/general/ThemedText";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import PublishProblemModal from "./PublishProblemModal";
import { Problem } from "@/DAL/entities/problem";
import { useDal } from "@/DAL/DALService";
import { Colors } from "@/constants/Colors";
import SwitchSelector from "react-native-switch-selector";
import ActionValidationModal from "@/components/general/modals/ActionValidationModal";


const CreateProblemScreen: React.FC = () => {
  const router = useRouter();
  const dal = useDal();
  const wall = dal.walls.Get({ id: useLocalSearchParams().id as string });
  const targetGroup = useLocalSearchParams().groupId as (string | undefined);
  const [isDrawingHold, setIsDrawingHold] = useState(false);
  const [editedHold, setEditedHold] = useState<string | null>(null);
  const [isPublishModal, setIsPublishModal] = useState<boolean>(false);
  const [drawingHoldType, setDrawingHoldType] = useState<HoldType>(new HoldType(HoldTypes.start));
  const [holds, setHolds] = useState<HoldInterface[]>([]);
  const [aspectRatio, setAspectRatio] = useState(1.5);
  const [isCycle, _setIsCycle] = useState(false);
  const [holdDetectionEnabled, setHoldDetectionEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const setIsCycle = (value: boolean) => {
    if (value) setDrawingHoldType(new HoldType(HoldTypes.route));
    _setIsCycle(value);
  }


  useFocusEffect(
    useCallback(
      () => {
        setIsDrawingHold(false);
        setEditedHold(null);
        setIsPublishModal(false);
        setDrawingHoldType(new HoldType(HoldTypes.start));
        setHolds([]);
        setHoldDetectionEnabled(false);
        setIsCycle(false);
      }, []
    )
  );

  const startDrawingHold = () => {
    setIsDrawingHold(true);
    Notifier.showNotification({
      duration: 2000,
      showAnimationDuration: 0,
      showEasing: Easing.step1,
      hideOnPress: true,
      Component: () => WithCancelNotification(
        {
          title: 'Create new hold',
          description: 'tap or draw a new hold',
          onCancel: () => { setIsDrawingHold(false); Notifier.hideNotification(); },
        }
      )
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
      wallVersion: wall.version,
    });
    setIsLoading(true);
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
    ).finally(() => setIsLoading(false));

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
            <ActionValidationModal
              text="Delete hold?"
              approveAction={
                () => {
                  setHolds(holds.filter(h => h.id !== editedHold));
                }
              }
              closeModal={() => setEditedHold(null)}
            />
            :
            <EditHoldModal
              closeModal={() => setEditedHold(null)}
              selectedHold={holds.filter(v => v.id === editedHold)[0]}
              editHold={(holdType, isDeleted) => editHold(editedHold, holdType, isDeleted)} />
        )
      }
      <ThemedView style={styles.headerContainer}>
        <View style={{ width: 48 }} />
        <View style={styles.headerCenter}>
          <ThemedText type="title" style={styles.headerTitle}>Create</ThemedText>
          <SwitchSelector
            initial={0}
            textColor={Colors.textDark}
            selectedColor={Colors.textDark}
            buttonColor={Colors.backgroundDark}
            borderColor={Colors.backgroundDark}
            backgroundColor={Colors.backgroundExtraLite}
            onPress={(value: boolean) => setIsCycle(value)}
            options={[
              { label: "Bolder", value: false },
              { label: "Cycle", value: true }
            ]}
            style={{ width: 130 }}
            textStyle={{ fontSize: 15 }}
            selectedTextStyle={{ fontSize: 15, fontWeight: 'bold' }}
          />
        </View>
        <TouchableOpacity
          onPress={() => setIsPublishModal(true)}
          style={[styles.headerIconBtn, holds.length > 0 && styles.publishBtnActive]}
          disabled={holds.length === 0 || isLoading}
        >
          {holds.length > 0 && (
            <View style={styles.holdsBadge}>
              <Text style={styles.holdsBadgeText}>{holds.length}</Text>
            </View>
          )}
          <Ionicons
            name='checkmark-circle'
            size={30}
            color={holds.length > 0 ? Colors.backgroundExtraDark : Colors.backgroundLite}
          />
        </TouchableOpacity>
      </ThemedView>
      <View
        onLayout={(event) => {
          const { height, width } = event.nativeEvent.layout;
          setAspectRatio(height / width);
        }}
        style={{ flex: 1, width: "100%", backgroundColor: Colors.backgroundDark }}
      >
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
          useHoldDetection={holdDetectionEnabled}
        />
        {!isDrawingHold && (
          <>
            <TouchableOpacity
              style={[styles.wandFab, holdDetectionEnabled && styles.wandFabActive]}
              onPress={() => setHoldDetectionEnabled(v => !v)}
            >
              <Ionicons
                name={holdDetectionEnabled ? 'sparkles' : 'sparkles-outline'}
                size={15}
                color={holdDetectionEnabled ? Colors.backgroundExtraDark : Colors.backgroundExtraLite}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawFab} onPress={startDrawingHold}>
              {holdDetectionEnabled
                ? <MaterialCommunityIcons name="auto-fix" size={26} color={Colors.backgroundExtraLite} />
                : <Ionicons name="brush-outline" size={26} color={Colors.backgroundExtraLite} />
              }
            </TouchableOpacity>
            <HoldTypeSelector
              holdTypes={
                Object.values(HoldTypes)
                  .filter(x => typeof x === 'number' && (!isCycle || [HoldTypes.route, HoldTypes.feet].includes(x as HoldTypes)))
                  .map(type => new HoldType(type as HoldTypes))
              }
              selected={drawingHoldType}
              onSelect={setDrawingHoldType}
            />
          </>
        )}
      </View>
      {isLoading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <ActivityIndicator size="large" color={Colors.backgroundExtraLite} />
        </View>
      )}
    </View>
  );
};

export default CreateProblemScreen;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundExtraDark,
    width: "100%",
    flexDirection: "row",
    paddingTop: Platform.OS === 'ios' ? 50 : 0,
    paddingHorizontal: 8,
    height: Platform.OS === 'ios' ? 100 : 72,
    elevation: 6,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    backgroundColor: 'transparent',
  },
  headerIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconBtnActive: {
    backgroundColor: Colors.confirm,
  },
  publishBtnActive: {
    backgroundColor: Colors.confirm,
  },
  holdsBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.backgroundExtraDark,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  holdsBadgeText: {
    color: Colors.backgroundExtraLite,
    fontSize: 10,
    fontWeight: 'bold',
  },
  drawFab: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.backgroundExtraDark,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: Colors.backgroundLite,
  },
  drawFabActive: {
    backgroundColor: Colors.backgroundExtraLite,
    borderColor: Colors.backgroundExtraDark,
  },
  wandFab: {
    position: 'absolute',
    // Draw FAB center: left=48, bottom=48. At 45° upper-right, distance 58: center=(89,89). Size=34.
    left: 72,
    bottom: 72,
    width: 25,
    height: 25,
    borderRadius: 17,
    backgroundColor: Colors.backgroundExtraDark,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.backgroundLite,
  },
  wandFabActive: {
    backgroundColor: Colors.tickProject,
    borderColor: Colors.backgroundExtraLite,
  },
});
