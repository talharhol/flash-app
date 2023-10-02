import React, { Component, useState } from 'react';
import { SafeAreaView, View, StyleSheet, StatusBar, Text, TextInput, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform } from 'react-native';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';

import Grades from '../assets/grades';


function CreateProblemScreen({ navigation }) {
    const [name, setName] = useState(null);
    const [grade, setGrade] = useState(0);
    const [viewers, setViewers] = useState([]);
    const [viewer, setViewer] = useState(null);
    const [addViewerModal, setAddViewerModal] = useState(false)

    const addViewer = () => {
        if (viewer) {
            let newViewers = viewers.concat({name: viewer});
            let seen = {};
            newViewers = newViewers.filter((v) => {
                if (seen.hasOwnProperty(v.name)) return false;
                seen[v.name] = true;
                return true;
            });
            setViewers([...newViewers]);
            setViewer("");
        }
        
        setAddViewerModal(false);
    }

    const publishProblem = () => {
        // send to server 
        const problem_id = 2;
        navigation.replace("ProblemScreen", {problem: {id: problem_id, name: name, grade: grade}});
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.paramsContainer}>
                <View style={styles.paramContainer}>
                    <View style={styles.paramHeader}>
                        <Text style={styles.paramHeaderText}>Name</Text>
                    </View>
                    <View style={styles.paramData}>
                        <TextInput style={styles.nameParam} placeholder="Enter problem's name" onChangeText={setName} />
                    </View>
                </View>
                <View style={styles.paramContainer}>
                    <View style={styles.paramHeader}>
                        <Text style={styles.paramHeaderText}>Grade</Text>
                    </View>
                    <View style={styles.paramData}>
                        <Slider  containerStyle={{width: "90%"}} minimumTrackTintColor={"#1C9174"} thumbTintColor={"#1C9174"} maximumValue={Object.keys(Grades).length - 1} step={1} value={grade} onValueChange={v => setGrade(v[0])}/>
                        <View style={{marginLeft: 10}}>
                            <AntDesign style={{marginBottom: 10}} onPress={() => setGrade(Math.min(Object.keys(Grades).length - 1, grade + 1))} name="pluscircleo" size={24} color="black" />
                            <Text>{Grades[grade]}</Text>
                            <AntDesign style={{marginTop: 10}} onPress={() => setGrade(Math.max(0, grade - 1))} name="minuscircleo" size={24} color="black" />
                        </View>
                    </View>
                </View>
                <View style={styles.paramContainer}>
                    <View style={styles.paramHeader}>
                        <Text style={styles.paramHeaderText}>Description</Text>
                    </View>
                    <View style={styles.paramData}>
                        <TextInput style={styles.nameParam} multiline = {true} placeholder="Enter problem's description" onChangeText={setName} />
                    </View>
                </View>
                <View style={styles.paramContainer}>
                    <View style={styles.paramHeader}>
                        <Text style={styles.paramHeaderText}>Who can view this problem?</Text>
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
                        <MaterialIcons onPress={() => setAddViewerModal(true)} name="add-box" size={24} color="black" />
                    </View>
                </View>
                
            </View>
            <View style={styles.publishContainer}>
                <TouchableOpacity onPress={publishProblem} style={styles.publishButton}>
                    <Text style={styles.publishButtonText}>Publish</Text>
                </TouchableOpacity>
            </View>
            <Modal animationType='fade' transparent={true} visible={addViewerModal}>
                <TouchableOpacity onPress={() => setAddViewerModal(false)}>
                    <View style={styles.modalContainer}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modal}>
                                <TextInput placeholder="Enter user's name" onChangeText={setViewer} style={styles.addViewerTextInput}/>
                                <TouchableOpacity style={styles.addViewerAddButton} onPress={addViewer}>
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

export default CreateProblemScreen;

const styles = StyleSheet.create({
    container: {
        width: "100%",
        marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        flex: 1,
    },
    header: {
        height: 50,
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingLeft: 15,
        paddingRight: 15,
        alignItems: "center",
        backgroundColor: "black",
        opacity: 0.5,
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
        flexWrap: 'wrap',
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