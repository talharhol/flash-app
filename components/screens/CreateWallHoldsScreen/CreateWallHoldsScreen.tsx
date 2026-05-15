import React, { useCallback, useState, useEffect } from "react";
import {
    Platform,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { HoldInterface, HoldType, HoldTypes, holdTypeToHoldColor } from "../../../DAL/hold";
import BolderProblem from "@/components/general/BolderProblem";
import { Notifier, Easing } from "react-native-notifier";
import WithCancelNotification from "@/components/general/notifications/WithCancelNotification";
import ActionValidationModal from "@/components/general/modals/ActionValidationModal";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import ThemedView from "@/components/general/ThemedView";
import { ThemedText } from "@/components/general/ThemedText";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useDal } from "@/DAL/DALService";
import { Colors } from "@/constants/Colors";


const CreateWallHoldsScreen: React.FC = ({ }) => {
    const dal = useDal();
    const { id } = useLocalSearchParams();
    const wall = dal.walls.Get({ id });
    const [isDrawingHold, setIsDrawingHold] = useState(false);
    const [holdDetectionEnabled, setHoldDetectionEnabled] = useState(false);
    const [isExitRequest, setIsExitRequest] = useState(false);
    const [holdToDelete, setHoldToDelete] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState(1.5);
    const [holds, setHolds] = useState<HoldInterface[]>([]);
    useEffect(
        () => {
            setHolds(wall.configuredHolds.map((h) => ({ ...h, color: holdTypeToHoldColor[HoldTypes.route] })));
        }, 
        [id]
    );
    useFocusEffect(
        useCallback(
            () => {
                setIsDrawingHold(false);
                setHoldToDelete(null);
                setHoldDetectionEnabled(false);
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
    const editHold = (id: string) => {
        setHolds(holds.filter(h => h.id !== id));
        setHoldToDelete(null);
    };
    const SaveHolds = () => {
        wall.configuredHolds = holds;
        dal.walls.Update(wall);
        router.push("/");
    }

    return (
        <View style={styles.container}>
            <ThemedView style={styles.headerContainer}>
                <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Create Holds</ThemedText>
            </ThemedView>
            {
                holdToDelete && <ActionValidationModal
                    text="Delete this hold?"
                    closeModal={setHoldToDelete.bind(this, null)}
                    approveAction={editHold.bind(this, holdToDelete)} />
            }
            {
                isExitRequest && <ActionValidationModal
                    text="Are you sure?"
                    subText="changes might not be saved"
                    closeModal={() => setIsExitRequest(false)}
                    approveAction={() => router.push("/")} />
            }
            <View
                onLayout={(event) => {
                    const { height, width } = event.nativeEvent.layout;
                    setAspectRatio(height / width);
                }}
                style={{ flex: 1, width: "100%", backgroundColor: Colors.backgroundDark }}>
                <BolderProblem
                    wallImage={wall.image}
                    existingHolds={isDrawingHold ? [] : holds}
                    onHoldClick={setHoldToDelete}
                    onDrawHoldFinish={onDrawHoldFinish}
                    onDrawHoldCancel={() => setIsDrawingHold(false)}
                    drawingHoldType={isDrawingHold ? new HoldType(HoldTypes.route) : null}
                    aspectRatio={aspectRatio}
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
                        <TouchableOpacity style={styles.exitFab} onPress={() => setIsExitRequest(true)}>
                            <Ionicons name='close' size={18} color={Colors.backgroundExtraLite} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveFab} onPress={SaveHolds}>
                            <Ionicons name='checkmark' size={30} color={Colors.backgroundExtraLite} />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
};

export default CreateWallHoldsScreen;

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
    },
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
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
    wandFab: {
        position: 'absolute',
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
    saveFab: {
        position: 'absolute',
        right: 20,
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
    exitFab: {
        position: 'absolute',
        right: 72,
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
});
