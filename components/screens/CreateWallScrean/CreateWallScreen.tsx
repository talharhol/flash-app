import React, { useCallback, useState } from "react";
import {
    Button,
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import ParallaxScrollView from "@/components/general/ParallaxScrollView";
import ThemedView from "@/components/general/ThemedView";
import { ThemedText } from "@/components/general/ThemedText";
import SelectImageModal from "@/components/general/modals/SelectImageModal";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import Toggle from "react-native-toggle-element";
import BasicButton from "@/components/general/Button";
import { Wall } from "@/DAL/entities/wall";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDal } from "@/DAL/DALService";
import SwitchSelector from "react-native-switch-selector";
import { Colors } from "@/constants/Colors";


const CreateWallScreen: React.FC = ({ }) => {
    const router = useRouter();
    const dal = useDal();
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [selectImageModal, setSelectImageModal] = useState(true);
    const [isPublic, setIsPublic] = useState(false);
    const [wallName, setWallName] = useState('');
    const [gymName, setGymName] = useState('');
    useFocusEffect(
        useCallback(
            () => {
                setSelectedImage('');
                setSelectImageModal(true);
                setIsPublic(false);
                setWallName('');
                setGymName('');
            }, []
        )
    );
    const createWall = () => {
        if (!selectedImage) {
            alert("missing image");
            return
        }

        if (!wallName) {
            alert("missing wall name");
            return
        }
        if (!gymName) {
            alert("missing gym name");
            return
        }

        let wall = new Wall({
            name: wallName,
            gym: gymName,
            image: { uri: selectedImage },
            isPublic: isPublic,
            owner: dal.currentUser.id
        });
        dal.walls.Add(wall).then(
            () => router.push({ pathname: "/CreateWallHolds", params: { id: wall.id } })
        );
    };
    const SaveWallImage: (uri: string) => void = (uri) => {
        setSelectedImage(uri);
    };

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={{
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                }}>
                    <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>CreateWall</ThemedText>
                </ThemedView>
            }>
            {
                selectImageModal &&
                <SelectImageModal
                    closeModal={() => setSelectImageModal(false)}
                    getImage={SaveWallImage}
                    text='Choose source'
                />
            }
            <TouchableWithoutFeedback onPress={() => setSelectImageModal(true)}
                style={{ alignSelf: "center", height: 200, width: 200, borderRadius: 200, overflow: "hidden", backgroundColor: "red" }}>
                <Image
                    style={{ height: "100%", width: "100%" }}
                    source={selectedImage ? { uri: selectedImage } : require('../../../assets/images/upload.png')} />
            </TouchableWithoutFeedback>
            <TextInput value={wallName} onChangeText={setWallName} placeholder="Wall's name" style={{ fontSize: 30, height: 60, width: "100%", borderRadius: 8, borderWidth: 2, backgroundColor: Colors.backgroundDark, padding: 10 }} />
            <TextInput value={gymName} onChangeText={setGymName} placeholder="Gym's name" style={{ fontSize: 30, height: 60, width: "100%", borderRadius: 8, borderWidth: 2, backgroundColor: Colors.backgroundDark, padding: 10 }} />
            <View style={{ alignSelf: "center", height: 50, width: "50%" }}>
                <SwitchSelector
                    initial={0}
                    textColor={Colors.backgroundDark}
                    selectedColor={Colors.backgroundExtraLite}
                    buttonColor={Colors.backgroundDark}
                    borderColor={Colors.backgroundDark}
                    backgroundColor={Colors.backgroundExtraLite}
                    onPress={(value: boolean) => setIsPublic(value)}
                    options={[
                        { label: "Private", value: false },
                        { label: "Public", value: true }
                    ]}
                />
            </View>
            <BasicButton onPress={createWall} style={{ alignSelf: "center", margin: 30 }} text="Create" color="green" />
        </ParallaxScrollView>
    );
};

export default CreateWallScreen;

const styles = StyleSheet.create({

});
