import React, { useRef, useState } from "react";
import {
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import ParallaxScrollView from "@/components/general/ParallaxScrollView";
import ThemedView from "@/components/general/ThemedView";
import { ThemedText } from "@/components/general/ThemedText";
import SelectImageModal from "@/components/general/modals/SelectImageModal";
import BasicButton from "@/components/general/Buttom";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Group } from "@/DAL/group";
import MultiSelect from "react-native-multiple-select";
import SelectWallModal from "./SelectWallsModal";
import { FlatList, TouchableOpacity } from "react-native-gesture-handler";
import { Wall } from "@/DAL/wall";
import { useDal } from "@/DAL/DALService";
const WallItem = ({ wall, onRemove }: { wall: Wall, onRemove: (id: string) => void }) => (
    <View style={{ flexDirection: "row", borderRadius: 17, backgroundColor: "gray", justifyContent: "space-between", margin: 5}}>
        <Image source={wall.image} style={{ height: 30, width: 30, borderRadius: 15, margin: 2 }} />
        <Text style={{ alignSelf: "center", fontSize: 18, padding: 5 }}>{wall.fullName}</Text>
        <TouchableOpacity onPress={() => onRemove(wall.id)} style={{ height: 30, width: 30, borderRadius: 15, margin: 2, justifyContent: "center", backgroundColor: "white" }}>
            <Text style={{ alignSelf: "center", fontSize: 18 }}>X</Text>
        </TouchableOpacity>
    </View>
);

const CreateGroupScreen: React.FC = ({ }) => {
    const router = useRouter();
    const dal = useDal();
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [selectImageModal, setSelectImageModal] = useState(true);
    const [selectWallModal, setSelectWallModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [selectedWalls, setSelectedWalls] = useState<Wall[]>([]);
    const usersMultiSelect = useRef<MultiSelect>()
    const createGroup = () => {
        if (!selectedImage) {
            alert("missing image");
            return
        }

        if (!groupName) {
            alert("missing group name");
            return
        }

        let group = new Group({
            name: groupName,
            image: { uri: selectedImage },
            members: selectedUsers,
            walls: selectedWalls.map(w => w.id)
        });
        dal.addGroup(group);
        router.push({ pathname: "/MyGroupsScreen" });
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
            {selectWallModal &&
                <SelectWallModal 
                selectedWalls={selectedWalls} 
                onSelect={(id: string) => setSelectedWalls(selectedWalls.concat([dal.getWall({ id })]))} closeModal={() => setSelectWallModal(false)} />}
            <View style={{ alignSelf: "center", height: 200, width: 200 }}>
                <Image style={{ height: "100%", width: "100%", borderRadius: 10000 }} source={selectedImage ? { uri: selectedImage } : require('../../../assets/images/upload.png')} />
                <Ionicons
                    style={{ position: "absolute", bottom: 0, right: 0 }}
                    onPress={() => setSelectImageModal(true)}
                    size={30}
                    color="gray"
                    name="pencil-outline"
                />
            </View>
            <TextInput value={groupName} onChangeText={setGroupName} placeholder="Group's name" style={{ fontSize: 30, height: 60, width: "100%", borderRadius: 8, borderWidth: 2, backgroundColor: "grey", padding: 10 }} />
            <View>
                {usersMultiSelect.current?.getSelectedItemsExt(selectedUsers)}
            </View>
            <MultiSelect
                hideTags
                ref={(component) => { usersMultiSelect.current = component || undefined }}
                items={dal.getUsers({})}
                uniqueKey="id"
                onSelectedItemsChange={setSelectedUsers}
                selectedItems={selectedUsers}
                selectText="Pick members"
                searchInputPlaceholderText="Search Items..."
                onChangeInput={(text) => console.log(text)}
                altFontFamily="ProximaNova-Light"
                tagRemoveIconColor="#CCC"
                tagBorderColor="#CCC"
                tagTextColor="#CCC"
                selectedItemTextColor="#CCC"
                selectedItemIconColor="#CCC"
                itemTextColor="#000"
                displayKey="name"
                searchInputStyle={{ color: '#CCC' }}
                submitButtonColor="#CCC"
                submitButtonText="Submit"
            />
            <FlatList
                data={selectedWalls}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <WallItem wall={item} onRemove={(id) => setSelectedWalls(selectedWalls.filter(w => w.id !== id))} />}
                numColumns={1} // Set the number of columns
                contentContainerStyle={{}}
            />
            <BasicButton onPress={() => setSelectWallModal(true)} style={{ alignSelf: "center" }} text="Add wall" color="blue" />
            <BasicButton onPress={createGroup} style={{ alignSelf: "center", margin: 20 }} text="Create" color="green" />
        </ParallaxScrollView>
    );
};

export default CreateGroupScreen;

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
