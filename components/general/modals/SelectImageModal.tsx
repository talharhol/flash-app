import { ThemedText } from "@/components/general/ThemedText";
import React from "react";
import BasicModal from "./BasicModal";
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons";

const SelectImageModal: React.FC<React.ComponentProps<typeof BasicModal> & {
    getImage: (uri: string) => void;
    text: string;
}> = ({ closeModal, getImage, text }) => {
    const pickImageAsync = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            allowsMultipleSelection: false,
            mediaTypes: 'images',
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            getImage(result.assets[0].uri);
        } else {
            alert('You did not select any image.');
        }
        closeModal();
    };
    const tackImageAsync = async () => {
        let result = await ImagePicker.launchCameraAsync({
            allowsMultipleSelection: false,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            getImage(result.assets[0].uri);
        } else {
            alert('You did not select any image.');
        }
        closeModal();
    };
    return (
        <BasicModal closeModal={closeModal}>
            <ThemedText lightColor="black" darkColor="black" type="subtitle">{text}</ThemedText>
            <Ionicons name='camera' size={80} color={'black'} onPress={tackImageAsync} />
            <Ionicons name='image' size={80} color={'#black'} onPress={pickImageAsync} />
        </BasicModal>
    );
};

export default SelectImageModal;