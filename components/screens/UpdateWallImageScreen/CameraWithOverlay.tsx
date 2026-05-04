/**
 * Requires: expo install expo-camera
 * Shows a live camera preview with a ghost overlay of the old wall image.
 * User frames the shot to match the old wall, then taps capture.
 */
import React, { useRef, useState } from 'react';
import { Image, Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/general/ThemedText';
import { Colors } from '@/constants/Colors';

interface Props {
    oldImageUri: string;
    onCapture: (uri: string) => void;
    onCancel: () => void;
}

export const CameraWithOverlay: React.FC<Props> = ({ oldImageUri, onCapture, onCancel }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [overlayOpacity, setOverlayOpacity] = useState(0.4);
    const cameraRef = useRef<CameraView>(null);
    const { width: screenW, height: screenH } = useWindowDimensions();

    const camW = screenW;
    const camH = screenW * (4 / 3);
    const camTop = (screenH - camH) / 2;

    if (!permission) return null;

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <ThemedText>Camera permission needed</ThemedText>
                <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
                    <ThemedText>Grant Permission</ThemedText>
                </TouchableOpacity>
            </View>
        );
    }

    const capture = async () => {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 1 });
        if (photo) onCapture(photo.uri);
    };

    return (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
            {/* 4:3 camera box — matches captured photo dimensions exactly */}
            <View style={{ position: 'absolute', top: camTop, left: 0, width: camW, height: camH }}>
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Image
                        source={{ uri: oldImageUri }}
                        style={[StyleSheet.absoluteFill, { opacity: overlayOpacity, resizeMode: 'contain' }]}
                    />
                </View>
            </View>
            {/* Opacity slider strip */}
            <View style={styles.opacityRow}>
                <Ionicons name="remove" size={20} color="#fff" onPress={() => setOverlayOpacity(o => Math.max(0, o - 0.1))} />
                <ThemedText style={styles.opacityLabel}>{Math.round(overlayOpacity * 100)}%</ThemedText>
                <Ionicons name="add" size={20} color="#fff" onPress={() => setOverlayOpacity(o => Math.min(0.9, o + 0.1))} />
            </View>
            {/* Controls */}
            <View style={styles.controls}>
                <Ionicons name="close-circle-outline" size={44} color="#fff" onPress={onCancel} />
                <TouchableOpacity onPress={capture} style={styles.shutterBtn} />
                <View style={{ width: 44 }} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    permBtn: {
        paddingHorizontal: 20, paddingVertical: 10,
        backgroundColor: Colors.backgroundDark, borderRadius: 8,
    },
    opacityRow: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 16,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    opacityLabel: { color: '#fff', fontSize: 14, minWidth: 36, textAlign: 'center' },
    controls: {
        position: 'absolute',
        bottom: 48,
        left: 0, right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    shutterBtn: {
        width: 72, height: 72,
        borderRadius: 36,
        backgroundColor: '#fff',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.5)',
    },
});
