import React, { useCallback, useState } from "react";
import {
    Image,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as Location from "expo-location";
import ParallaxScrollView from "@/components/general/ParallaxScrollView";
import ThemedView from "@/components/general/ThemedView";
import { ThemedText } from "@/components/general/ThemedText";
import SelectImageModal from "@/components/general/modals/SelectImageModal";
import TooManyPublicWallsModal from "@/components/general/modals/TooManyPublicWallsModal";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import BasicButton from "@/components/general/Button";
import { Wall } from "@/DAL/entities/wall";
import { useFocusEffect, useRouter } from "expo-router";
import { useDal } from "@/DAL/DALService";
import SwitchSelector from "react-native-switch-selector";
import { Colors } from "@/constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";


const CreateWallScreen: React.FC = ({ }) => {
    const router = useRouter();
    const dal = useDal();
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [selectImageModal, setSelectImageModal] = useState(true);
    const [isPublic, setIsPublic] = useState(false);
    const [wallName, setWallName] = useState('');
    const [gymName, setGymName] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [fetchingLocation, setFetchingLocation] = useState(false);
    const [showTooManyPublicModal, setShowTooManyPublicModal] = useState(false);
    useFocusEffect(
        useCallback(
            () => {
                setSelectedImage('');
                setSelectImageModal(true);
                setIsPublic(false);
                setWallName('');
                setGymName('');
                setLat('');
                setLng('');
                setShowTooManyPublicModal(false);
            }, []
        )
    );
    const useCurrentLocation = async () => {
        try {
            setFetchingLocation(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Location permission denied');
                return;
            }
            const pos = await Location.getCurrentPositionAsync({});
            setLat(String(pos.coords.latitude));
            setLng(String(pos.coords.longitude));
        } catch (e) {
            alert('Failed to get location');
        } finally {
            setFetchingLocation(false);
        }
    };
    const parseCoord = (v: string): number | undefined => {
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : undefined;
    };
    const doCreateWall = (asPublic: boolean) => {
        const latNum = parseCoord(lat);
        const lngNum = parseCoord(lng);
        let wall = new Wall({
            name: wallName,
            gym: gymName,
            image: { uri: selectedImage },
            isPublic: asPublic,
            owner: dal.currentUser.id,
            lat: latNum,
            lng: lngNum,
        });
        dal.walls.Add(wall).then(
            () => router.push({ pathname: "/CreateWallHolds", params: { id: wall.id } })
        );
    };
    const createWall = () => {
        if (!selectedImage) { alert("missing image"); return; }
        if (!wallName) { alert("missing wall name"); return; }
        if (!gymName) { alert("missing gym name"); return; }

        if (isPublic) {
            const publicWalls = dal.currentUser.ownedWalls.filter(wall => wall.isPublic);
            if (publicWalls.length >= 3) {
                setShowTooManyPublicModal(true);
                return;
            }
        }

        doCreateWall(isPublic);
    };
    const SaveWallImage: (uri: string) => void = (uri) => {
        setSelectedImage(uri);
    };

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    width: "100%"
                }}>
                    <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>CreateWall</ThemedText>
                    <Ionicons
                        onPress={createWall}
                        name='checkmark-circle-outline' size={35} color={Colors.backgroundExtraLite} style={{ position: "absolute", right: 0, padding: 10 }} />

                </ThemedView>
            }>
            {selectImageModal &&
                <SelectImageModal
                    closeModal={() => setSelectImageModal(false)}
                    getImage={SaveWallImage}
                    text='Choose source'
                />
            }
            {showTooManyPublicModal &&
                <TooManyPublicWallsModal
                    closeModal={() => setShowTooManyPublicModal(false)}
                    onMakePrivate={() => { setShowTooManyPublicModal(false); doCreateWall(false); }}
                />
            }
            <TouchableWithoutFeedback onPress={() => setSelectImageModal(true)}
                style={{ alignSelf: "center", height: 200, width: 200, borderRadius: 200, overflow: "hidden", alignItems: "center" }}>
                {
                    selectedImage ?
                        <Image
                            style={{ height: "100%", width: "100%" }}
                            source={{ uri: selectedImage }} />
                        : <MaterialCommunityIcons name="image-plus" size={150} color={Colors.backgroundExtraDark} />
                }
            </TouchableWithoutFeedback>
            <TextInput
                value={wallName}
                onChangeText={setWallName}
                placeholder="Wall's name"
                placeholderTextColor={Colors.backgroundExtraDark}
                style={{ fontSize: 20, height: 56, width: "100%", borderRadius: 12, borderWidth: 2, borderColor: Colors.backgroundExtraDark, backgroundColor: Colors.backgroundLite, paddingHorizontal: 14, color: Colors.textDark, fontFamily: 'Nunito' }}
            />
            <TextInput
                value={gymName}
                onChangeText={setGymName}
                placeholder="Gym's name"
                placeholderTextColor={Colors.backgroundExtraDark}
                style={{ fontSize: 20, height: 56, width: "100%", borderRadius: 12, borderWidth: 2, borderColor: Colors.backgroundExtraDark, backgroundColor: Colors.backgroundLite, paddingHorizontal: 14, color: Colors.textDark, fontFamily: 'Nunito' }}
            />
            <View style={{ flexDirection: "row", gap: 8, width: "100%" }}>
                <TextInput
                    value={lat}
                    onChangeText={setLat}
                    placeholder="Latitude"
                    placeholderTextColor={Colors.backgroundExtraDark}
                    keyboardType="numbers-and-punctuation"
                    style={{ flex: 1, fontSize: 18, height: 56, borderRadius: 12, borderWidth: 2, borderColor: Colors.backgroundExtraDark, backgroundColor: Colors.backgroundLite, paddingHorizontal: 14, color: Colors.textDark, fontFamily: 'Nunito' }}
                />
                <TextInput
                    value={lng}
                    onChangeText={setLng}
                    placeholder="Longitude"
                    placeholderTextColor={Colors.backgroundExtraDark}
                    keyboardType="numbers-and-punctuation"
                    style={{ flex: 1, fontSize: 18, height: 56, borderRadius: 12, borderWidth: 2, borderColor: Colors.backgroundExtraDark, backgroundColor: Colors.backgroundLite, paddingHorizontal: 14, color: Colors.textDark, fontFamily: 'Nunito' }}
                />
            </View>
            <TouchableOpacity
                onPress={useCurrentLocation}
                disabled={fetchingLocation}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 12, borderWidth: 2, borderColor: Colors.backgroundExtraDark, backgroundColor: Colors.backgroundLite, opacity: fetchingLocation ? 0.6 : 1 }}
            >
                <Ionicons name="location-outline" size={20} color={Colors.textDark} />
                <ThemedText style={{ color: Colors.textDark }}>
                    {fetchingLocation ? "Getting location..." : "Use current location"}
                </ThemedText>
            </TouchableOpacity>
            <View style={{ alignSelf: "center", height: 50, width: "50%", marginTop: 50 }}>
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
        </ParallaxScrollView>
    );
};

export default CreateWallScreen;

const styles = StyleSheet.create({

});
