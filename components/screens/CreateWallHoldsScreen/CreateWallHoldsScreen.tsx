import React, { useCallback, useState, useEffect, useRef } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Hold, HoldInterface, HoldType, HoldTypes, holdTypeToHoldColor } from "../../../DAL/hold";
import BolderProblem, { BolderProblemComponent } from "@/components/general/BolderProblem";
import { Skia } from "@shopify/react-native-skia";
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
    const insets = useSafeAreaInsets();
    const dal = useDal();
    const { id } = useLocalSearchParams();
    const wall = dal.walls.Get({ id });
    const bolderRef = useRef<BolderProblemComponent>(null);
    const cancelScanRef = useRef(false);
    const [isDrawingHold, setIsDrawingHold] = useState(false);
    const [holdDetectionEnabled, setHoldDetectionEnabled] = useState(false);
    const [isLuckyScanRunning, setIsLuckyScanRunning] = useState(false);
    const [scanCell, setScanCell] = useState<{ row: number; col: number } | null>(null);
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
    const runLuckyScan = async () => {
        const bp = bolderRef.current;
        if (!bp || !bp.isReady) return;
        cancelScanRef.current = false;
        setIsLuckyScanRunning(true);

        const svgWidth = 1000;
        const svgHeight = 1000 * (bp.imageHeight / bp.imageWidth);

        type BBox = { x: number; y: number; width: number; height: number };
        const knownBBoxes: BBox[] = holds.flatMap(h => {
            const p = Skia.Path.MakeFromSVGString(h.svgPath);
            return p ? [p.getBounds()] : [];
        });

        const boxIoU = (a: BBox, b: BBox): number => {
            const ix = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
            const iy = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
            const inter = ix * iy;
            const union = a.width * a.height + b.width * b.height - inter;
            return union > 0 ? inter / union : 0;
        };

        outer:
        for (let row = 0; row < 40; row++) {
            for (let col = 0; col < 40; col++) {
                if (cancelScanRef.current) break outer;
                setScanCell({ row, col });

                const tapX = (col + 0.5) / 40;
                const tapY = (row + 0.5) / 40;

                const { svgPath } = await bp.detectHold(tapX, tapY, svgWidth, svgHeight);
                await new Promise<void>(r => setTimeout(r, 0));
                if (!svgPath) continue;

                const newPath = Skia.Path.MakeFromSVGString(svgPath);
                if (!newPath) continue;
                const b = newPath.getBounds();

                if (knownBBoxes.some(eb => boxIoU(b, eb) > 0.3)) continue;

                const hold = new Hold({ svgPath, color: holdTypeToHoldColor[HoldTypes.route] });
                knownBBoxes.push(b);
                setHolds(prev => [...prev, hold]);
            }
        }
        setScanCell(null);
        setIsLuckyScanRunning(false);
    };

    const SaveHolds = () => {
        wall.configuredHolds = holds;
        dal.walls.Update(wall);
        router.push("/");
    }

    return (
        <View style={styles.container}>
            <ThemedView style={[styles.headerContainer, { paddingTop: insets.top, height: 72 + insets.top }]}>
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
                    ref={bolderRef}
                    wallImage={wall.image}
                    existingHolds={isDrawingHold ? [] : holds}
                    onHoldClick={setHoldToDelete}
                    onDrawHoldFinish={onDrawHoldFinish}
                    onDrawHoldCancel={() => setIsDrawingHold(false)}
                    drawingHoldType={isDrawingHold ? new HoldType(HoldTypes.route) : null}
                    aspectRatio={aspectRatio}
                    useHoldDetection={holdDetectionEnabled}
                    scanCell={scanCell}
                />
                {isLuckyScanRunning && (
                    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-only" />
                )}
                {!isDrawingHold && (
                    <>
                        {holdDetectionEnabled && (
                            <View style={styles.luckyFabContainer}>
                                {isLuckyScanRunning
                                    ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                          <View style={styles.luckyFab}>
                                              <ActivityIndicator size="small" color={Colors.textLite} />
                                              <ThemedText style={{ color: Colors.textLite, fontSize: 12, marginLeft: 6 }}>
                                                  {`Scanning... ${scanCell ? Math.round((scanCell.row * 40 + scanCell.col + 1) / 1600 * 100) : 0}%`}
                                              </ThemedText>
                                          </View>
                                          <TouchableOpacity style={styles.cancelFab} onPress={() => { cancelScanRef.current = true; }}>
                                              <ThemedText style={{ color: Colors.textLite, fontSize: 12 }}>Cancel</ThemedText>
                                          </TouchableOpacity>
                                      </View>
                                    : <TouchableOpacity style={styles.luckyFab} onPress={runLuckyScan}>
                                          <ThemedText style={{ color: Colors.textLite, fontSize: 13 }}>Feeling Lucky</ThemedText>
                                      </TouchableOpacity>
                                }
                            </View>
                        )}
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
        paddingHorizontal: 8,
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
    cancelFab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: Colors.danger,
        borderWidth: 1.5,
        borderColor: Colors.backgroundLite,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
    },
    luckyFabContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    luckyFab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: Colors.backgroundExtraDark,
        borderWidth: 1.5,
        borderColor: Colors.backgroundLite,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
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
