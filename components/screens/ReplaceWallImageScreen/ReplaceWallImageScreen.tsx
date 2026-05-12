import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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

    useFocusEffect(
        useCallback(
            () => {
            setStep('pick');
            setNewImageUri('');
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
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            quality: 1,
        });
        if (!result.canceled) {
            setNewImageUri(result.assets[0].uri);
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons
                    name="close-circle-outline" size={35} color={Colors.backgroundExtraLite}
                    style={{ position: 'absolute', left: 0, padding: 10 }}
                    onPress={() => router.back()}
                />
                <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Replace Image</ThemedText>
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
});
