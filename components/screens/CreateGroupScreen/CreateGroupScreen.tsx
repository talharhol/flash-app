import React, { useCallback, useMemo, useState } from "react";
import {
    Image,
    Text,
    TextInput,
    View,
    StyleSheet
} from "react-native";
import ParallaxScrollView from "@/components/general/ParallaxScrollView";
import ThemedView from "@/components/general/ThemedView";
import { ThemedText } from "@/components/general/ThemedText";
import SelectImageModal from "@/components/general/modals/SelectImageModal";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Group } from "@/DAL/entities/group";
import { FlatList, TouchableOpacity, TouchableWithoutFeedback } from "react-native-gesture-handler";
import { UserPicker } from "./UserPicker";
import { Wall } from "@/DAL/entities/wall";
import { useDal } from "@/DAL/DALService";
import SelectWallModal from "@/components/general/modals/SelectWallsModal";
import { Colors } from "@/constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const WallItem = ({ wall, onRemove }: { wall: Wall, onRemove: (id: string) => void }) => {
    return (
        <View style={{ flexDirection: "row", borderRadius: 12, backgroundColor: Colors.backgroundDark, alignItems: "center", marginVertical: 3, borderWidth: 1, borderColor: Colors.backgroundExtraDark }}>
            <Image source={wall.image} style={{ height: 48, width: 48, borderRadius: 8, margin: 4 }} />
            <Text style={{ flex: 1, color: Colors.textLite, fontSize: 16, fontWeight: "500", paddingHorizontal: 10 }}>{wall.fullName}</Text>
            <TouchableOpacity onPress={() => onRemove(wall.id)} style={{ padding: 12 }}>
                <Ionicons name="close-circle" size={22} color={Colors.backgroundExtraLite} />
            </TouchableOpacity>
        </View>
    )
};

const ConfigGroupScreen: React.FC = ({ }) => {
    const router = useRouter();
    const dal = useDal();
    const group = useLocalSearchParams().id !== undefined ? dal.groups.Get({ id: useLocalSearchParams().id as string }) : undefined;

    const [selectedImage, setSelectedImage] = useState<string>(group?.image.uri || '');
    const [selectImageModal, setSelectImageModal] = useState(group === undefined);
    const [selectWallModal, setSelectWallModal] = useState(false);
    const [groupName, setGroupName] = useState(group ? group.name : '');
    const [selectedUsers, setSelectedUsers] = useState<string[]>(group ? group.members.filter(u => u !== dal.currentUser.id) : []);
    const [selectedWalls, setSelectedWalls] = useState<string[]>(group ? group.walls : []);

    useFocusEffect(
        useCallback(
            () => {
                setSelectedImage(group?.image.uri || '');
                setSelectImageModal(group === undefined);
                setSelectWallModal(false);
                setGroupName(group ? group.name : '');
                setSelectedUsers(group ? group.members.filter(u => u !== dal.currentUser.id) : []);
                setSelectedWalls(group ? group.walls : []);
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
            walls: selectedWalls,
            problems: group?.problems ?? [],
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
        <View style={{ flex: 1 }}>
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={styles.headerContainer}>
                    <ThemedText type="title">Create Group</ThemedText>
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
                    dal={dal}
                    selectedWalls={selectedWalls}
                    onSelect={(id: string) => setSelectedWalls(selectedWalls.concat([id]))}
                    onRemove={(id) => setSelectedWalls(selectedWalls.filter(w => w !== id))}
                    closeModal={() => setSelectWallModal(false)} />
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
            <TextInput value={groupName} onChangeText={setGroupName} placeholder="Group's name" style={{ fontSize: 30, height: 60, width: "100%", borderRadius: 8, borderWidth: 2, backgroundColor: Colors.backgroundDark, padding: 10 }} />
            <UserPicker
                users={useMemo(() => dal.users.List({}).filter(u => u.id !== dal.currentUser.id), [])}
                selectedIds={selectedUsers}
                onChange={setSelectedUsers}
            />
            <FlatList
                data={selectedWalls}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                    <WallItem wall={dal.walls.Get({ id: item })}
                        onRemove={(id) => setSelectedWalls(selectedWalls.filter(w => w !== id))} />
                )}
                scrollEnabled={false}
            />
            <TouchableOpacity
                onPress={() => setSelectWallModal(true)}
                style={styles.addWallButton}
            >
                <Ionicons name="add-circle-outline" size={22} color={Colors.backgroundExtraLite} />
                <Text style={styles.addWallButtonText}>Add Wall</Text>
            </TouchableOpacity>
        </ParallaxScrollView>
        <TouchableOpacity
            onPress={createGroup}
            style={{ position: "absolute", bottom: 30, right: 20, backgroundColor: Colors.backgroundExtraLite, borderRadius: 50, padding: 14 }}
        >
            <Ionicons name="save" size={28} color="black" />
        </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: "transparent",
        width: "100%",
    },
    addWallButton: {
        flexDirection: "row",
        alignSelf: "center",
        width: "70%",
        backgroundColor: Colors.backgroundDark,
        borderRadius: 12,
        paddingVertical: 12,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        marginTop: 6,
        borderWidth: 1,
        borderColor: Colors.backgroundExtraDark,
    },
    addWallButtonText: {
        color: Colors.textLite,
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default ConfigGroupScreen;
