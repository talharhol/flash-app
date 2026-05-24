import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { autoAlignLightGlue } from './autoAlign';
import { isModelDownloaded, downloadModel } from './lightGlueLocal';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useDal } from '@/DAL/DALService';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/general/ThemedText';
import { Image } from 'react-native';
import CornerAdjustCanvas, { AnchorPoint, CornerAdjustRef, CornerPoint, defaultCorners } from './CornerAdjustCanvas';
import { CameraWithOverlay } from './CameraWithOverlay';
import BolderProblem from '@/components/general/BolderProblem';

type Step = 'pick' | 'camera' | 'adjust' | 'confirm' | 'saving';

const UpdateWallImageScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal();
    const { id } = useLocalSearchParams<{ id: string }>();
    const wall = dal.walls.Get({ id });

    const [step, setStep] = useState<Step>('pick');
    const [newImageUri, setNewImageUri] = useState('');
    const [corners, setCorners] = useState<CornerPoint[]>([]);
    const [anchors, setAnchors] = useState<AnchorPoint[]>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [oldImageSize, setOldImageSize] = useState<{ width: number; height: number } | null>(null);
    const [isAligning, setIsAligning] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [originalNewImageUri, setOriginalNewImageUri] = useState<string | null>(null);
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [showHolds, setShowHolds] = useState(true);
    const [isCapturing, setIsCapturing] = useState(false);
    const adjustRef = useRef<CornerAdjustRef>(null);
    const canvasSizeRef = useRef(canvasSize);
    canvasSizeRef.current = canvasSize;
    const oldImageSizeRef = useRef(oldImageSize);
    oldImageSizeRef.current = oldImageSize;

    const oldImageUri = wall.image.uri;
    useFocusEffect(
        useCallback(
          () => {
            setStep('pick');
            setNewImageUri('');
            setCorners([]);
            setAnchors([]);
            setCanvasSize({ width: 0, height: 0 });
            setIsAligning(false);
            setDownloadProgress(null);
            setOriginalNewImageUri(null);
            setCapturedUri(null);
            setShowHolds(true);
            setIsCapturing(false);
          }, []
        )
    );
    useEffect(() => {
        Image.getSize(oldImageUri, (w, h) => setOldImageSize({ width: w, height: h }));
    }, [oldImageUri]);
    useEffect(() => {
        if (oldImageSize && canvasSize.width > 0) {
            setCorners(defaultCorners(canvasSize.width, canvasSize.height, oldImageSize.width, oldImageSize.height));
        }
    }, [oldImageSize]);

    const onImagePicked = (uri: string) => {
        setNewImageUri(uri);
        setOriginalNewImageUri(null);
        setAnchors([]);
        setStep('adjust');
        setTimeout(() => {
            const { width, height } = canvasSizeRef.current;
            const ois = oldImageSizeRef.current;
            setCorners(defaultCorners(width, height, ois?.width, ois?.height));
        }, 100);
    };

    const pickFromLibrary = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            quality: 1,
        });
        if (!result.canceled) onImagePicked(result.assets[0].uri);
    };

    const onCanvasLayout = (w: number, h: number) => {
        if (canvasSize.width === w && canvasSize.height === h) return;
        const firstLayout = canvasSize.width === 0;
        setCanvasSize({ width: w, height: h });
        if (firstLayout) setCorners(defaultCorners(w, h, oldImageSize?.width, oldImageSize?.height));
    };

    const handleAutoAlign = async () => {
        if (!canvasSize.width || !newImageUri) return;
        if (originalNewImageUri) {
            setNewImageUri(originalNewImageUri);
            setOriginalNewImageUri(null);
            setCorners(defaultCorners(canvasSize.width, canvasSize.height, oldImageSize?.width, oldImageSize?.height));
            return;
        }
        const ready = await isModelDownloaded();
        if (!ready) {
            setDownloadProgress(0);
            try {
                await downloadModel(setDownloadProgress);
            } catch {
                setDownloadProgress(null);
                return;
            }
            setDownloadProgress(null);
        }
        setIsAligning(true);
        try {
            const warpedUri = await autoAlignLightGlue(oldImageUri, newImageUri, canvasSize.width, canvasSize.height);
            setCorners(defaultCorners(canvasSize.width, canvasSize.height, oldImageSize?.width, oldImageSize?.height));
            if (warpedUri) {
                setOriginalNewImageUri(newImageUri);
                setNewImageUri(warpedUri);
                setCorners(defaultCorners(canvasSize.width, canvasSize.height, oldImageSize?.width, oldImageSize?.height));
            }
        } catch (error) {
            console.error('Error in autoAlignLightGlue:', error);
        } finally {
            setIsAligning(false);
        }
    };

    const proceedToConfirm = async () => {
        if (isCapturing) return;
        setIsCapturing(true);
        try {
            const uri = await adjustRef.current?.capture();
            if (!uri) return;
            setCapturedUri(uri);
            setStep('confirm');
        } catch {
            // stay on adjust
        } finally {
            setIsCapturing(false);
        }
    };

    const save = async () => {
        if (!capturedUri) return;
        setStep('saving');
        try {
            wall.image = Image.resolveAssetSource({ uri: capturedUri });
            if (wall.isPublic) {
                wall.remoteImage = await wall.uploadImage(wall.image);
            }
            await dal.walls.Update(wall);
            router.back();
        } catch {
            setStep('confirm');
        }
    };

    if (step === 'camera') {
        return (
            <CameraWithOverlay
                oldImageUri={oldImageUri}
                onCapture={onImagePicked}
                onCancel={() => setStep('pick')}
            />
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons
                    name={step === 'confirm' ? 'arrow-back-outline' : 'close-circle-outline'}
                    size={35}
                    color={Colors.backgroundExtraLite}
                    style={{ position: 'absolute', left: 0, padding: 10 }}
                    onPress={step === 'confirm' ? () => setStep('adjust') : () => router.back()}
                />
                <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>
                    {step === 'confirm' ? 'Confirm Update' : 'Update Wall'}
                </ThemedText>
                {step === 'adjust' && (
                    <Ionicons
                        name="checkmark-circle-outline" size={35} color={Colors.backgroundExtraLite}
                        style={{ position: 'absolute', right: 0, padding: 10 }}
                        onPress={proceedToConfirm}
                    />
                )}
            </View>

            {/* Canvas area */}
            <View
                style={styles.canvasArea}
                onLayout={(e) => {
                    const { width, height } = e.nativeEvent.layout;
                    onCanvasLayout(width, height);
                }}
            >
                {(step === 'adjust' || step === 'confirm') && canvasSize.width > 0 && (
                    <View
                        style={StyleSheet.absoluteFill}
                        pointerEvents={step === 'confirm' ? 'none' : 'auto'}
                    >
                        <CornerAdjustCanvas
                            ref={adjustRef}
                            oldImageUri={oldImageUri}
                            newImageUri={newImageUri}
                            width={canvasSize.width}
                            height={canvasSize.height}
                            corners={corners}
                            onCornersChange={setCorners}
                            anchors={anchors}
                            onAnchorsChange={setAnchors}
                            showOverlay={step === 'adjust'}
                        />
                    </View>
                )}
                {step === 'confirm' && capturedUri && (
                    <View style={StyleSheet.absoluteFill}>
                        <BolderProblem
                            wallImage={{ uri: capturedUri }}
                            existingHolds={showHolds ? wall.configuredHolds : []}
                            aspectRatio={canvasSize.height / canvasSize.width}
                        />
                    </View>
                )}
                {(step === 'pick' || step === 'saving') && (
                    <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
                        {step === 'saving' && <ActivityIndicator size="large" color={Colors.backgroundExtraLite} />}
                    </View>
                )}
                {isCapturing && (
                    <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
                        <ActivityIndicator size="large" color={Colors.backgroundExtraLite} />
                    </View>
                )}
            </View>

            {/* Bottom controls */}
            {step === 'pick' && (
                <View style={styles.pickRow}>
                    <TouchableOpacity style={styles.pickBtn} onPress={() => setStep('camera')}>
                        <Ionicons name="camera-outline" size={32} color={Colors.backgroundExtraLite} />
                        <ThemedText style={styles.pickLabel}>Camera</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pickBtn} onPress={pickFromLibrary}>
                        <Ionicons name="image-outline" size={32} color={Colors.backgroundExtraLite} />
                        <ThemedText style={styles.pickLabel}>Gallery</ThemedText>
                    </TouchableOpacity>
                </View>
            )}
            {step === 'confirm' && (
                <View style={styles.confirmBar}>
                    <TouchableOpacity style={styles.toggleHoldsBtn} onPress={() => setShowHolds(v => !v)}>
                        <Ionicons
                            name={showHolds ? 'eye-outline' : 'eye-off-outline'}
                            size={20}
                            color={Colors.backgroundExtraLite}
                        />
                        <ThemedText style={styles.toggleHoldsLabel}>
                            {showHolds ? 'Hide holds' : 'Show holds'}
                        </ThemedText>
                    </TouchableOpacity>
                    <ThemedText style={styles.warningText}>
                        Once updated, this cannot be reverted.
                    </ThemedText>
                    <TouchableOpacity style={styles.confirmBtn} onPress={save}>
                        <ThemedText style={styles.confirmBtnLabel}>Update Wall</ThemedText>
                    </TouchableOpacity>
                </View>
            )}
            {step === 'adjust' && (
                <View style={styles.hintBar}>
                    {downloadProgress !== null ? (
                        <View style={styles.aligningRow}>
                            <ActivityIndicator size="small" color="#7DF9FF" />
                            <ThemedText style={[styles.hint, { color: '#7DF9FF' }]}>
                                Downloading model… {Math.round(downloadProgress * 100)}%
                            </ThemedText>
                        </View>
                    ) : isAligning ? (
                        <View style={styles.aligningRow}>
                            <ActivityIndicator size="small" color={Colors.backgroundExtraLite} />
                            <ThemedText style={styles.hint}>Auto-aligning…</ThemedText>
                        </View>
                    ) : (
                        <>
                            <ThemedText style={styles.hint}>Drag corners to align</ThemedText>
                            <View style={styles.hintActions}>
                                <TouchableOpacity onPress={handleAutoAlign} style={styles.magicBtn}>
                                    <Ionicons
                                        name={originalNewImageUri ? 'checkmark-circle' : 'scan-outline'}
                                        size={16}
                                        color={originalNewImageUri ? '#7DF9FF' : '#7DF9FF'}
                                    />
                                    <ThemedText style={[styles.hint, { color: '#7DF9FF' }]}>
                                        {originalNewImageUri ? 'Undo Align' : 'Auto Align'}
                                    </ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setStep('pick')} style={styles.rePickBtn}>
                                    <Ionicons name="refresh-outline" size={18} color={Colors.backgroundExtraLite} />
                                    <ThemedText style={styles.hint}>Re-pick</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            )}
        </View>
    );
};

export default UpdateWallImageScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.backgroundDeep },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.backgroundExtraDark,
        width: '100%',
        paddingTop: Platform.OS === 'ios' ? 50 : 0,
        height: 100,
    },
    canvasArea: { flex: 1, backgroundColor: Colors.backgroundDark },
    overlay: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
    pickRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingVertical: 32,
        backgroundColor: Colors.backgroundExtraDark,
    },
    pickBtn: { alignItems: 'center', gap: 8 },
    pickLabel: { color: Colors.backgroundExtraLite, fontSize: 14 },
    hintBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.backgroundExtraDark,
    },
    hint: { color: Colors.backgroundExtraLite, fontSize: 13, opacity: 0.8 },
    hintActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    magicBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    aligningRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rePickBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    confirmBar: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.backgroundExtraDark,
    },
    toggleHoldsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
    },
    toggleHoldsLabel: {
        color: Colors.backgroundExtraLite,
        fontSize: 14,
    },
    warningText: {
        color: Colors.backgroundExtraLite,
        fontSize: 13,
        opacity: 0.75,
        textAlign: 'center',
    },
    confirmBtn: {
        backgroundColor: Colors.confirm,
        borderRadius: 8,
        paddingHorizontal: 32,
        paddingVertical: 12,
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    confirmBtnLabel: {
        color: Colors.textLite,
        fontSize: 16,
        fontWeight: '600',
    },
});
