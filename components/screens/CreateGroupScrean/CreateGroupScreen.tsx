import React, { useRef, useState } from "react";
import {
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
import BasicButton from "@/components/general/Buttom";
import { groups, users, walls } from "@/app/debugData";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Group } from "@/dataTypes/group";
import MultiSelect from "react-native-multiple-select";


const CreateGroupScreen: React.FC = ({ }) => {
    const router = useRouter();
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [selectImageModal, setSelectImageModal] = useState(true);
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
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
        });
        groups.push(group);
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
            <View style={{ alignSelf: "center", height: 200, width: 200}}>
                <Image style={{ height: "100%", width: "100%", borderRadius: 10000 }} source={selectedImage ? { uri: selectedImage } : require('../../../assets/images/upload.png')} />
                <Ionicons 
                style={{position: "absolute", bottom: 0, right: 0}}
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
          items={users}
          uniqueKey="id"
          onSelectedItemsChange={setSelectedUsers}
          selectedItems={selectedUsers}
          selectText="Pick Items"
          searchInputPlaceholderText="Search Items..."
          onChangeInput={ (text)=> console.log(text)}
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
            <BasicButton onPress={createGroup} style={{ alignSelf: "center", margin: 30 }} text="Create" color="green" />
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
