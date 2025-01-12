import React, { useCallback, useRef, useState } from "react";
import {
    Image,
    Text,
    TextInput,
    View,
} from "react-native";
import ParallaxScrollView from "@/components/general/ParallaxScrollView";
import ThemedView from "@/components/general/ThemedView";
import { ThemedText } from "@/components/general/ThemedText";
import SelectImageModal from "@/components/general/modals/SelectImageModal";
import BasicButton from "@/components/general/Buttom";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Group } from "@/DAL/entities/group";
import MultiSelect from "react-native-multiple-select";
import { FlatList, ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { Wall } from "@/DAL/entities/wall";
import { useDal } from "@/DAL/DALService";
import SelectWallModal from "@/components/general/modals/SelectWallsModal";

const WallItem = ({ wall, onRemove }: { wall: Wall | string, onRemove: (id: string) => void }) => {
    const dal = useDal();

    if (typeof wall === "string") wall = dal.walls.Get({ id: wall });

    return (
        <View style={{ flexDirection: "row", borderRadius: 17, backgroundColor: "gray", justifyContent: "space-between", margin: 5 }}>
            <Image source={wall.image} style={{ height: 30, width: 30, borderRadius: 15, margin: 2 }} />
            <Text style={{ alignSelf: "center", fontSize: 18, padding: 5 }}>{wall.fullName}</Text>
            <TouchableOpacity onPress={() => onRemove(wall.id)} style={{ height: 30, width: 30, borderRadius: 15, margin: 2, justifyContent: "center", backgroundColor: "white" }}>
                <Text style={{ alignSelf: "center", fontSize: 18 }}>X</Text>
            </TouchableOpacity>
        </View>
    )
};

const ConfigGroupScreen: React.FC = ({ }) => {
    const router = useRouter();
    const dal = useDal();
    const group = useLocalSearchParams().id !== undefined ? dal.groups.Get({ id: useLocalSearchParams().id as string }) : undefined;
    const usersMultiSelect = useRef<MultiSelect>()

    const [selectedImage, setSelectedImage] = useState<string>(group?.image.uri || '');
    const [selectImageModal, setSelectImageModal] = useState(group === undefined);
    const [selectWallModal, setSelectWallModal] = useState(false);
    const [groupName, setGroupName] = useState(group ? group.name : '');
    const [selectedUsers, setSelectedUsers] = useState<string[]>(group ? group.members.filter(u => u !== dal.currentUser.id) : []);
    const [selectedWalls, setSelectedWalls] = useState<string[]>(group ? group.PublicWalls.map(w=>w.id) : []);
    
    useFocusEffect(
        useCallback(
            () => {
                setSelectedImage(group?.image.uri || '');
                setSelectImageModal(group === undefined);
                setSelectWallModal(false);
                setGroupName(group ? group.name : '');
                setSelectedUsers(group ? group.members.filter(u => u !== dal.currentUser.id) : []);
                setSelectedWalls(group ? group.PublicWalls.map(w=>w.id) : []);
            }, []
        )
    );
    
    const createGroup = () => {
        if (!selectedImage) {
            alert("missing image");
            return
        }

        if (!groupName) {
            alert("missing group name");
            return
        }
        let new_group = new Group({
            id: group?.id,
            name: groupName,
            image: { uri: selectedImage },
            members: [dal.currentUser.id, ...selectedUsers],
            admins: [dal.currentUser.id],
            walls: selectedWalls
        });
        if (!group)
            dal.groups.Add(new_group).then(
                () => router.push({ pathname: "/MyGroupsScreen" })
            );
        else 
            dal.groups.Update(new_group).then(
                () => router.push({ pathname: "/MyGroupsScreen" })
            ).catch(console.log);
    };

    const SaveGroupImage: (uri: string) => void = (uri) => {
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
                    getImage={SaveGroupImage}
                    text='Choose source' />
            }
            {
                selectWallModal &&
                <SelectWallModal
                    selectedWalls={selectedWalls}
                    onSelect={(id: string) => setSelectedWalls(selectedWalls.concat([id]))}
                    onRemove={(id) => setSelectedWalls(selectedWalls.filter(w => w !== id))}
                    closeModal={() => setSelectWallModal(false)} />
            }
            <View style={{ alignSelf: "center", height: 200, width: 200 }}>
                <Image style={{ height: "100%", width: "100%", borderRadius: 10000 }} source={selectedImage ? { uri: selectedImage } : require('../../assets/images/upload.png')} />
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
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} horizontal={true} style={{ width: "100%" }}>
                <View style={{ flexDirection: "column", width: "100%" }} >
                    <MultiSelect
                        fixedHeight={true}
                        hideTags
                        ref={(component) => { usersMultiSelect.current = component || undefined }}
                        items={dal.users.List({}).filter(u => u.id !== dal.currentUser.id)}
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
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <WallItem wall={item}
                                onRemove={(id) => setSelectedWalls(selectedWalls.filter(w => w !== id))} />)
                        }
                        numColumns={1} // Set the number of columns
                        contentContainerStyle={{}}
                    />
                </View>
            </ScrollView>
            <BasicButton onPress={() => setSelectWallModal(true)} style={{ alignSelf: "center" }} text="Add wall" color="blue" />
            <BasicButton onPress={createGroup} style={{ alignSelf: "center", margin: 20 }} text={!!group ? "Update" : "Create"} color="green" />
        </ParallaxScrollView>
    );
};

export default ConfigGroupScreen;
