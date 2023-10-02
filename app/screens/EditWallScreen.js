import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, StyleSheet, StatusBar, Text, TextInput, Modal, TouchableOpacity, TouchableWithoutFeedback, Image, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';




function EditWallScreen({ route, navigation }) {


    const { wall } = route.params;

    const [name, setName] = useState(wall.name);
    const [description, setDescription] = useState(null);
    const [user, setUser] = useState(null);

    const [viewers, setViewers] = useState([]);
    const [setters, setSetters] = useState([]);
    const [owners, setOwners] = useState([]);

    const [{
        addModal,
        objectToUpdate,
        updateFunction
    }, setAddModal] = useState({
        addModal: false,
        objectToUpdate: null,
        updateFunction: null
    });

    const addUser = () => {
        if (user) {
            let newUsers = objectToUpdate.concat({ name: user });
            let seen = {};
            newUsers = newUsers.filter((v) => {
                if (seen.hasOwnProperty(v.name)) return false;
                seen[v.name] = true;
                return true;
            });
            updateFunction([...newUsers]);
            setUser("");
        }

        setAddModal({
            objectToUpdate: null,
            updateFunction: null,
            addModal: false
        });
    };

    const updateWall = () => {
        // send to server 
        const wallId = 2;
        navigation.replace("WallScreen", { wall: { id: wallId, name: name, image: wall.image } });
    };

    const openAddModal = (updateFunc, updateObj) => {
        setAddModal({
            objectToUpdate: updateObj,
            updateFunction: updateFunc,
            addModal: true
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Image style={styles.wallImage} source={wall.image} />
                </View>

                <View style={styles.wallIcons}>
                    <TextInput onChangeText={setName} value={name} placeholder="Enter wall's name" style={styles.wallNameInput} />
                </View>
                <View style={styles.paramsContainer}>
                    <View style={styles.paramContainer}>
                        <View style={styles.paramHeader}>
                            <Text style={styles.paramHeaderText}>Description</Text>
                        </View>
                        <View style={styles.paramData}>
                            <TextInput value={description} onChangeText={setDescription} style={styles.nameParam} multiline={true} placeholder="Enter wall's description" />
                        </View>
                    </View>
                    <View style={styles.paramContainer}>
                        <View style={styles.paramHeader}>
                            <Text style={styles.paramHeaderText}>Viewers</Text>
                        </View>
                        <View style={styles.paramData}>
                            {
                                viewers.map(v => {
                                    return (
                                        <View key={v.name} style={styles.viewer}>
                                            <Text>{v.name}</Text>
                                            <MaterialCommunityIcons style={styles.viewerTrash} onPress={() => setViewers([...viewers.filter(i => i.name !== v.name)])} name="trash-can-outline" size={24} color="black" />
                                        </View>);
                                })
                            }
                            <MaterialIcons onPress={() => openAddModal(setViewers, viewers)} name="add-box" size={24} color="black" />
                        </View>
                    </View>
                    <View style={styles.paramContainer}>
                        <View style={styles.paramHeader}>
                            <Text style={styles.paramHeaderText}>Setters</Text>
                        </View>
                        <View style={styles.paramData}>
                            {
                                setters.map(v => {
                                    return (
                                        <View key={v.name} style={styles.viewer}>
                                            <Text>{v.name}</Text>
                                            <MaterialCommunityIcons style={styles.viewerTrash} onPress={() => setSetters([...setters.filter(i => i.name !== v.name)])} name="trash-can-outline" size={24} color="black" />
                                        </View>);
                                })
                            }
                            <MaterialIcons onPress={() => openAddModal(setSetters, setters)} name="add-box" size={24} color="black" />
                        </View>
                    </View>
                    <View style={styles.paramContainer}>
                        <View style={styles.paramHeader}>
                            <Text style={styles.paramHeaderText}>Owners</Text>
                        </View>
                        <View style={styles.paramData}>
                            {
                                owners.map(v => {
                                    return (
                                        <View key={v.name} style={styles.viewer}>
                                            <Text>{v.name}</Text>
                                            <MaterialCommunityIcons style={styles.viewerTrash} onPress={() => setOwners([...owners.filter(i => i.name !== v.name)])} name="trash-can-outline" size={24} color="black" />
                                        </View>);
                                })
                            }
                            <MaterialIcons onPress={() => openAddModal(setOwners, owners)} name="add-box" size={24} color="black" />
                        </View>
                    </View>

                </View>
                <View style={styles.publishContainer}>
                    <TouchableOpacity onPress={updateWall} style={styles.publishButton}>
                        <Text style={styles.publishButtonText}>Update</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <Modal animationType='fade' transparent={true} visible={addModal}>
                <TouchableOpacity onPress={() => setAddModal({
                    objectToUpdate: null,
                    updateFunction: null,
                    addModal: false
                })}>
                    <View style={styles.modalContainer}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modal}>
                                <TextInput placeholder="Enter user's name" onChangeText={setUser} style={styles.addViewerTextInput} />
                                <TouchableOpacity style={styles.addViewerAddButton} onPress={addUser}>
                                    <Text style={styles.addViewerAddButtonText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

export default EditWallScreen;

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%",
        marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        flex: 1,

    },
    header: {
        alignItems: "center",
        justifyContent: 'center',
        width: "100%"
    },
    wallImage: {
        margin: 20,
        height: 200,
        width: 200,
        borderRadius: 200,
        backgroundColor: "black",
    },
    wallIcons: {
        width: "100%",
        alignItems: "center"
    },
    wallNameInput: {
        fontSize: 25,
        alignContent: "center",
        textAlign: "center"
    },
    paramsContainer: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    paramContainer: {
        width: "90%",
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: "#999",
        borderBottomWidth: 2,
        padding: 10
    },
    paramHeader: {
        paddingBottom: 10
    },
    paramHeaderText: {
        fontSize: 20,
        fontWeight: "bold",
    },
    paramData: {
        width: "90%",
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center"
    },
    viewer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#C2C2C2",
        marginRight: 10,
        marginTop: 5,
        borderRadius: 5,
        paddingLeft: 5
    },
    viewerTrash: {
        backgroundColor: "#F8CECE",
        marginLeft: 5,
        borderBottomRightRadius: 5,
        borderTopRightRadius: 5
    },
    publishContainer: {
        width: "100%",
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 20,
    },
    publishButton: {
        marginTop: 40,
        backgroundColor: "green",
        height: 40,
        width: "40%",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5
    },
    publishButtonText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white"
    },
    modal: { width: "80%", height: 260, backgroundColor: "#E8E8E8", borderRadius: 20, justifyContent: "space-around", alignItems: "center" },
    modalContainer: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
    addViewerTextInput: {},
    addViewerAddButton: {
        height: 40,
        width: "50%",
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
        borderColor: "#86F075"
    },
    addViewerAddButtonText: {
        color: "#86F075",
        fontWeight: "bold",
        fontSize: 20,
    }

});