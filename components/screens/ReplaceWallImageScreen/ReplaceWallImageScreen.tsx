import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useDal } from '@/DAL/DALService';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/general/ThemedText';

type Step = 'pick' | 'preview' | 'saving';

const ReplaceWallImageScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal();
    const { id } = useLocalSearchParams<{ id: string }>();
    const wall = dal.walls.Get({ id });

    const [step, setStep] = useState<Step>('pick');
    const [newImageUri, setNewImageUri] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const { width: screenW, height: screenH } = useWindowDimensions();
    const camW = screenW;
    const camH = screenW * (4 / 3);
    const camTop = (screenH - camH) / 2;

    useFocusEffect(
        useCallback(
            () => {
            setStep('pick');
            setNewImageUri('');
            setShowCamera(false);
            }, []
        )
    );

    const pickFromLibrary = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            quality: 1,
        });
        if (!result.canceled) {
            setNewImageUri(result.assets[0].uri);
            setStep('preview');
        }
    };

    const pickFromCamera = async () => {
        if (!permission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) return;
        }
        setShowCamera(true);
    };

    const takePicture = async () => {
        if (!cameraRef.current) return;
        const photo = await cameraRef.current.takePictureAsync({ quality: 1, shutterSound: false });
        if (photo) {
            setNewImageUri(photo.uri);
            setShowCamera(false);
            setStep('preview');
        }
    };

    const confirm = async () => {
        setStep('saving');
        try {
            await dal.walls.replaceWallImage(wall.id, newImageUri);
            router.replace({ pathname: '/CreateWallHolds', params: { id: wall.id } });
        } catch (e) {
            console.error(e);
            setStep('preview');
        }
    };

    if (showCamera) {
        return (
            <Modal animationType="slide" transparent={false} visible statusBarTranslucent>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
                    <View style={{ position: 'absolute', top: camTop, left: 0, width: camW, height: camH }}>
                        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
                    </View>
                    <View style={styles.cameraControls}>
                        <TouchableOpacity style={styles.cameraBack} onPress={() => setShowCamera(false)}>
                            <Ionicons name="arrow-back" size={28} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                        <View style={{ width: 52 }} />
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons
                    name="close-circle-outline" size={35} color={Colors.backgroundExtraLite}
                    style={{ position: 'absolute', left: 0, padding: 10 }}
                    onPress={() => router.back()}
                />
                <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Replace Wall</ThemedText>
                {step === 'preview' && (
                    <Ionicons
                        name="checkmark-circle-outline" size={35} color={Colors.backgroundExtraLite}
                        style={{ position: 'absolute', right: 0, padding: 10 }}
                        onPress={confirm}
                    />
                )}
            </View>

            <View style={styles.imageArea}>
                {step === 'preview' && (
                    <Image source={{ uri: newImageUri }} style={styles.preview} resizeMode="contain" />
                )}
                {step === 'saving' && (
                    <ActivityIndicator size="large" color={Colors.backgroundExtraLite} />
                )}
                {step === 'pick' && (
                    <ThemedText style={styles.hint}>Pick a new wall image</ThemedText>
                )}
            </View>

            {(step === 'pick' || step === 'preview') && (
                <View style={styles.pickRow}>
                    <TouchableOpacity style={styles.pickBtn} onPress={pickFromCamera}>
                        <Ionicons name="camera-outline" size={32} color={Colors.backgroundExtraLite} />
                        <ThemedText style={styles.pickLabel}>Camera</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.pickBtn} onPress={pickFromLibrary}>
                        <Ionicons name="image-outline" size={32} color={Colors.backgroundExtraLite} />
                        <ThemedText style={styles.pickLabel}>Gallery</ThemedText>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default ReplaceWallImageScreen;

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
    imageArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.backgroundDark,
    },
    preview: { width: '100%', height: '100%' },
    hint: { color: Colors.backgroundExtraLite, fontSize: 16, opacity: 0.6 },
    pickRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingVertical: 32,
        backgroundColor: Colors.backgroundExtraDark,
    },
    pickBtn: { alignItems: 'center', gap: 8 },
    pickLabel: { color: Colors.backgroundExtraLite, fontSize: 14 },
    cameraControls: {
        position: 'absolute',
        bottom: 48,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    cameraBack: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
    captureButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        borderColor: Colors.backgroundExtraLite,
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.backgroundExtraLite,
    },
});
