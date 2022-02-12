import React, { Component, useState } from 'react';
import { SafeAreaView, View, StyleSheet, StatusBar, Text, TextInput, Modal, TouchableOpacity, TouchableWithoutFeedback, Image } from 'react-native';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import { CommonActions } from "@react-navigation/native";

import Grades from '../assets/grades';


function CreateGymScreen({ navigation }) {
    const [name, setName] = useState(null);
    const [user, setUser] = useState(null);
``
    const [viewers, setViewers] = useState([]);
    const [editors, setEditors] = useState([]);
    const [owners, setOwners] = useState([]);

    const [addModal, setAddModal] = useState(false);
    
    let objectToUpdate = null;
    let updateFunction = null;

    const grades = Grades;

    const addUser = () => {
        if (user) {
            let newUsers = objectToUpdate.concat({name: user});
            let seen = {};
            newUsers = newUsers.filter((v) => {
                if (seen.hasOwnProperty(v.name)) return false;
                seen[v.name] = true;
                return true;
            });
            updateFunction([...newUsers]);
            setUser("");
        }
        
        setAddModal(false);
    }

    const publishProblem = () => {
        // send to server 
        const problem_id = 2;
        navigation.replace("ProblemScreen", {problem: {id: problem_id, name: name, grade: grade}});
    }

    const openAddModal = (updateFunc, updateObj) => {
        setAddModal(true);
        objectToUpdate = updateObj;
        updateFunction = updateFunc;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Image style={styles.gymImage} source={require('../assets/images/upload.png')}/>
                <View style={styles.gymIcons}>
                    <TextInput placeholder="Enter gym's name" style={styles.gymNameInput}/>
                </View>
            </View>
            <View style={styles.paramsContainer}>
                <View style={styles.paramContainer}>
                    <View style={styles.paramHeader}>
                        <Text style={styles.paramHeaderText}>Description</Text>
                    </View>
                    <View style={styles.paramData}>
                        <TextInput style={styles.nameParam} multiline = {true} placeholder="Enter gym's description" onChangeText={setName} />
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
                        <Text style={styles.paramHeaderText}>Editors</Text>
                    </View>
                    <View style={styles.paramData}>
                        {
                            editors.map(v => {
                                return (
                                <View key={v.name} style={styles.viewer}>
                                    <Text>{v.name}</Text>
                                    <MaterialCommunityIcons style={styles.viewerTrash} onPress={() => setViewers([...viewers.filter(i => i.name !== v.name)])} name="trash-can-outline" size={24} color="black" />
                                </View>);
                            })
                        }
                        <MaterialIcons onPress={() => openAddModal(setEditors, editors)} name="add-box" size={24} color="black" />
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
                                    <MaterialCommunityIcons style={styles.viewerTrash} onPress={() => setViewers([...viewers.filter(i => i.name !== v.name)])} name="trash-can-outline" size={24} color="black" />
                                </View>);
                            })
                        }
                        <MaterialIcons onPress={() => openAddModal(setOwners, owners)} name="add-box" size={24} color="black" />
                    </View>
                </View>
                
            </View>
            <View style={styles.publishContainer}>
                <TouchableOpacity onPress={publishProblem} style={styles.publishButton}>
                    <Text style={styles.publishButtonText}>Publish</Text>
                </TouchableOpacity>
            </View>
            <Modal animationType='fade' transparent={true} visible={addModal}>
                <TouchableOpacity onPress={() => setAddModal(false)}>
                    <View style={styles.modalContainer}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modal}>
                                <TextInput placeholder="Enter user's name" onChangeText={setUser} style={styles.addViewerTextInput}/>
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

export default CreateGymScreen;

const styles = StyleSheet.create({
    container: {
        width: "100%",
        marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        flex: 1,
    },
    header: {
        alignItems: "center"
    },
    gymImage: {
        margin: 20,
        height: 200,
        width: 200,
        borderRadius: 200,
        backgroundColor: "black",
    },
    gymIcons: {
        width: "100%",
        alignItems: "center"
    },
    gymNameInput: {
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
        alignItems: "center",
        justifyContent: "center"
    },
    viewer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#C2C2C2",
        marginRight: 10,
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
        justifyContent: 'center',
        position: "absolute",
        bottom: 50
    },
    publishButton: {
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
    modal: {width: "80%", height: 260, backgroundColor: "#E8E8E8", borderRadius: 20, justifyContent: "space-around", alignItems: "center"},
    modalContainer: {width: "100%", height: "100%", justifyContent: "center", alignItems: "center"},
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

})