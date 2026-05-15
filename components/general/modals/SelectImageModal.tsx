import { ThemedText } from "@/components/general/ThemedText";
import React, { useRef, useState } from "react";
import BasicModal from "./BasicModal";
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, StyleSheet, Modal, Text, useWindowDimensions } from "react-native";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors } from "@/constants/Colors";

const SelectImageModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    getImage: (uri: string) => void;
    text: string;
}> = ({ closeModal, getImage, text }) => {
    const [showCamera, setShowCamera] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const { width: screenW, height: screenH } = useWindowDimensions();
    const camW = screenW;
    const camH = screenW * (4 / 3);
    const camTop = (screenH - camH) / 2;

    const pickImageAsync = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: false,
            mediaTypes: 'images',
            quality: 1,
        });
        if (!result.canceled) {
            getImage(result.assets[0].uri);
            closeModal();
        }
    };

    const handleCameraPress = async () => {
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
            getImage(photo.uri);
            setShowCamera(false);
            closeModal();
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
                        <TouchableOpacity style={styles.backButton} onPress={() => setShowCamera(false)}>
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
        <BasicModal closeModal={closeModal}>
            <View style={styles.container}>
                <ThemedText type="subtitle" style={styles.title}>{text}</ThemedText>
                <View style={styles.options}>
                    <TouchableOpacity style={styles.option} onPress={handleCameraPress} activeOpacity={0.7}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="camera" size={30} color="#333" />
                        </View>
                        <Text style={styles.optionLabel}>Take Photo</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.option} onPress={pickImageAsync} activeOpacity={0.7}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="images" size={30} color="#333" />
                        </View>
                        <Text style={styles.optionLabel}>Choose from Library</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </BasicModal>
    );
};

const styles = StyleSheet.create({
    container: {
        width: "100%",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 20,
    },
    title: {
        textAlign: "center",
        color: Colors.backgroundDeep,
    },
    options: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-evenly",
    },
    option: {
        flex: 1,
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.backgroundExtraLite,
        alignItems: "center",
        justifyContent: "center",
    },
    optionLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.backgroundExtraDark,
        textAlign: "center",
    },
    divider: {
        width: 1,
        height: 70,
        backgroundColor: Colors.backgroundLite,
    },
    cameraControls: {
        position: 'absolute',
        bottom: 48,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    backButton: {
        width: 52,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
    },
    captureButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        borderColor: Colors.backgroundExtraLite,
        alignItems: "center",
        justifyContent: "center",
    },
    captureInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.backgroundExtraLite,
    },
});

export default SelectImageModal;
