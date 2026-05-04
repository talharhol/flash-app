import React, { useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDal } from '@/DAL/DALService';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/general/ThemedText';
import { Image } from 'react-native';
import CornerAdjustCanvas, { CornerAdjustRef, CornerPoint, defaultCorners } from './CornerAdjustCanvas';
import { CameraWithOverlay } from './CameraWithOverlay';

type Step = 'pick' | 'camera' | 'adjust' | 'saving';

const UpdateWallImageScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal();
    const { id } = useLocalSearchParams<{ id: string }>();
    const wall = dal.walls.Get({ id });

    const [step, setStep] = useState<Step>('pick');
    const [newImageUri, setNewImageUri] = useState('');
    const [corners, setCorners] = useState<CornerPoint[]>([]);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const adjustRef = useRef<CornerAdjustRef>(null);

    const oldImageUri = wall.image.uri;

    const onImagePicked = (uri: string) => {
        setNewImageUri(uri);
        setCorners(defaultCorners(canvasSize.width, canvasSize.height));
        setStep('adjust');
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
        setCanvasSize({ width: w, height: h });
        setCorners(defaultCorners(w, h));
    };

    const save = async () => {
        setStep('saving');
        try {
            const uri = await adjustRef.current?.capture();
            if (!uri) { setStep('adjust'); return; }
            wall.image = Image.resolveAssetSource({ uri });
            await dal.walls.Update(wall);
            router.back();
        } catch {
            setStep('adjust');
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
                    name="close-circle-outline" size={35} color={Colors.backgroundExtraLite}
                    style={{ position: 'absolute', left: 0, padding: 10 }}
                    onPress={() => router.back()}
                />
                <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Update Image</ThemedText>
                {step === 'adjust' && (
                    <Ionicons
                        name="checkmark-circle-outline" size={35} color={Colors.backgroundExtraLite}
                        style={{ position: 'absolute', right: 0, padding: 10 }}
                        onPress={save}
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
                {step === 'adjust' && canvasSize.width > 0 && (
                    <CornerAdjustCanvas
                        ref={adjustRef}
                        oldImageUri={oldImageUri}
                        newImageUri={newImageUri}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        corners={corners}
                        onCornersChange={setCorners}
                        showOverlay
                    />
                )}
                {step === 'saving' && canvasSize.width > 0 && (
                    // Render clean (no ghost/handles) for capture, invisible behind spinner
                    <CornerAdjustCanvas
                        ref={adjustRef}
                        oldImageUri={oldImageUri}
                        newImageUri={newImageUri}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        corners={corners}
                        onCornersChange={setCorners}
                        showOverlay={false}
                    />
                )}
                {(step === 'pick' || step === 'saving') && (
                    <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
                        {step === 'saving' && <ActivityIndicator size="large" color={Colors.backgroundExtraLite} />}
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
            {step === 'adjust' && (
                <View style={styles.hintBar}>
                    <ThemedText style={styles.hint}>Drag corners to align new image with old wall</ThemedText>
                    <TouchableOpacity onPress={() => setStep('pick')} style={styles.rePickBtn}>
                        <Ionicons name="refresh-outline" size={18} color={Colors.backgroundExtraLite} />
                        <ThemedText style={styles.hint}>Re-pick</ThemedText>
                    </TouchableOpacity>
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
    rePickBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
