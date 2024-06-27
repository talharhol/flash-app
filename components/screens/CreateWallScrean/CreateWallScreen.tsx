import React, { useState } from "react";
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
import BasicButton from "@/components/general/Buttom";
import { Wall } from "@/dataTypes/wall";
import { walls } from "@/app/debugData";
import { useRouter } from "expo-router";


const CreateWallScreen: React.FC = ({ }) => {
    const router = useRouter();
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [selectImageModal, setSelectImageModal] = useState(true);
    const [isPublic, setIsPublic] = useState(false);
    const [wallName, setWallName] = useState('');
    const [gymName, setGymName] = useState('');
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
        });
        walls.push(
            wall
        );
        router.push({ pathname: "/CreateWallHolds", params: { id: wall.id } });
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
            {selectImageModal && <SelectImageModal
                closeModal={() => setSelectImageModal(false)}
                getImage={SaveWallImage}
                text='Choose source' />

            }
            <TouchableWithoutFeedback onPress={() => setSelectImageModal(true)} style={{ backgroundColor: "red", alignSelf: "center", height: 200, width: 200, borderRadius: 200 }}>
                <Image style={{ height: 200, width: 200, borderRadius: 200 }} source={selectedImage ? { uri: selectedImage } : require('../../../assets/images/upload.png')} />
            </TouchableWithoutFeedback>
            <TextInput value={wallName} onChangeText={setWallName} placeholder="Wall's name" style={{ fontSize: 30, height: 60, width: "100%", borderRadius: 8, borderWidth: 2, backgroundColor: "grey", padding: 10 }} />
            <TextInput value={gymName} onChangeText={setGymName} placeholder="Gym's name" style={{ fontSize: 30, height: 60, width: "100%", borderRadius: 8, borderWidth: 2, backgroundColor: "grey", padding: 10 }} />
            <View style={{ alignSelf: "center" }}>
                <Toggle
                    leftTitle="private"
                    rightTitle="public"
                    value={isPublic}
                    onPress={(val) => setIsPublic(val!)}
                />
            </View>
            <BasicButton onPress={createWall} style={{ alignSelf: "center", margin: 30 }} text="Create" color="green" />
        </ParallaxScrollView>
    );
};

export default CreateWallScreen;

const styles = StyleSheet.create({
    problemImage: {
        resizeMode: "center"
    },
    buttonContainer: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginTop: "auto",
        marginBottom: "auto"
    },
    zoomedContainer: {
        maxHeight: "75%",
        overflow: "hidden",
        flex: 1,
    },
    zoomedContent: {
        flex: 1,
        position: "relative",
        display: "flex"
    },
    saveHoldButton: {
        height: 40,
        width: "50%",
        backgroundColor: "green",
        justifyContent: "center",
        alignItems: "center",
    },
    discardHoldButton: {
        height: 40,
        width: "50%",
        backgroundColor: "red",
        justifyContent: "center",
        alignItems: "center",
    },
    sliderLable: { alignSelf: "center" },
    sliderContainer: {
        marginLeft: 10,
        marginRight: 10,
        justifyContent: "center",
    },
    next: { color: "#FF0101" },
    modal: {
        width: "80%",
        height: 260,
        backgroundColor: "#E8E8E8",
        borderRadius: 20,
        opacity: 0.8,
        justifyContent: "space-around",
        alignItems: "center",
    },
    modalContainer: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    addHoldText: { fontWeight: "bold" },
    addHoldTextTitle: { color: "white" },
    addHoldButton: {
        height: 40,
        width: "50%",
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "100%",
        marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        flex: 1,
    },
    problemHeader: {
        height: 50 + (StatusBar.currentHeight ?? 0),
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingLeft: 15,
        paddingRight: 15,
        alignItems: "center",
        backgroundColor: "black",
        opacity: 0.5,
        position: "absolute",
        paddingTop: StatusBar.currentHeight,
        zIndex: 10,
        top: -(StatusBar.currentHeight ?? 0),
    },
    headerText: {
        color: "white",
    },
    problemImageContainer: {
        backgroundColor: "black",
        zIndex: 0,
    },
    problemData: {
        width: "100%",
    },
});
