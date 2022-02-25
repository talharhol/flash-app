import React, { Component, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, TouchableWithoutFeedback, TextInput } from 'react-native';
import { MaterialCommunityIcons, Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';

import Problems from '../assets/problems'
import Grades from '../assets/grades';
import { Slider } from '@miblanchard/react-native-slider';
import SelectBox from 'react-native-multi-selectbox'
import { xorBy } from 'lodash'


const FILTERS = [
    {
        item: "grade",
        id: 1
    },
    {
        item: "created",
        id: 2
    },
    {
        item: "name",
        id: 3
    }, 
    {
        item: "setter",
        id: 4
    }
];

function WallScreen({ navigation }) {
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [gradesFilter, setGradesFilter] = useState([0, Object.keys(Grades).length-1]);
    const [settersFilter, setSettersFilter] = useState([]);
    const [sortBy, setSortBy] = useState([FILTERS[0]]);
    const [user, setUser] = useState(null);
    const [{
        addModal,
        objectToUpdate,
        updateFunction
    }, setAddModal] = useState({
        addModal: false,
        objectToUpdate: null,
        updateFunction: null
    });

    const wall = navigation.getParam('wall');

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
        
        setAddModal({
            objectToUpdate: null,
            updateFunction: null,
            addModal: false
        });
    }

    const openAddModal = (updateFunc, updateObj) => {
        setAddModal({
            objectToUpdate: updateObj,
            updateFunction: updateFunc,
            addModal: true
        });
    }

    function onMultiChange() {
        return (item) => setSortBy(xorBy(sortBy, [item], 'id'))
    }

    const deleteWall = () => {
        // delete wall
        navigation.goBack();
    }

    const apllyFilters = () => {
        // apply
        setFilterModalVisible(false);
    }

    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Image style={styles.wallImage} source={wall.image}/>
                    <View style={styles.wallIcons}>
                        <Ionicons onPress={() => navigation.navigate("EditWallScreen", {wall})} name="ios-pencil-outline" size={24} color="black" />
                        <Text>{wall.name}</Text>
                        <MaterialCommunityIcons onPress={() => setDeleteModalVisible(true)} name="trash-can-outline" size={24} color="black" />
                    </View>
                </View>
                <View style={styles.walls}>
                    <View style={styles.wallsHeader}>
                        <Ionicons onPress={() => navigation.navigate('SelectHoldsScreen', {wall})} name="add-circle-outline" size={24} color="black" style={styles.addWall}/>
                        <Text>Problems</Text>
                        <Ionicons onPress={() => setFilterModalVisible(true)} name="ios-filter-sharp" size={24} color="black" />
                    </View>
                    <View style={styles.wallsContainer}>
                        {
                            Problems.map((problem) => {
                                return (
                                    <TouchableOpacity key={problem.id} onPress={() => navigation.navigate('ProblemScreen', {problem})}>
                                        <View style={styles.problem} >
                                            <Text style={{marginLeft: 20, fontSize: 20}}>{problem.name}</Text>
                                            <Text style={{marginRight: 20, fontSize: 20}}>{problem.grade}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        }
                    </View>
                </View>
            </ScrollView>
            <Modal animationType='fade' transparent={true} visible={deleteModalVisible}>
                <TouchableOpacity onPress={() => setDeleteModalVisible(false)}>
                    <View style={styles.modalContainer}>
                        <TouchableWithoutFeedback>
                            <View style={styles.deleteModal}>
                                <View style={styles.modalTextContainer}>
                                    <Text style={styles.modalText}>
                                        Are you sure?
                                    </Text>
                                    <Text>
                                        All data will be lost (wall, problems, etc)
                                    </Text>
                                </View>
                                <View style={styles.modalButtonsContainer}>
                                    <TouchableOpacity onPress={() => deleteWall() } style={[styles.modalButton, {borderColor: "red"}]}>
                                        <Text style={[styles.modalButtonText, {color: "red"}]}>I'm sure</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setDeleteModalVisible(false) } style={[styles.modalButton, {borderColor: "green"}]}>
                                        <Text style={[styles.modalButtonText, {color: "green"}]}>Discard</Text>
                                    </TouchableOpacity>
                                </View>
                                
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity>
            </Modal>
            <Modal animationType='fade' transparent={true} visible={filterModalVisible}>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                    <View style={styles.modalContainer}>
                        <TouchableWithoutFeedback>
                            <View style={styles.filterModal}>
                                <View style={styles.paramContainer}>
                                    <View style={styles.paramHeader}>
                                        <Text style={styles.paramHeaderText}>Grade</Text>
                                    </View>
                                    <View style={styles.paramData}>
                                        <View style={{marginLeft: 10}}>
                                            <AntDesign style={{marginBottom: 10}} onPress={() => setGradesFilter([...[Math.min(gradesFilter[0] + 1, gradesFilter[1]), gradesFilter[1]]])} name="pluscircleo" size={24} color="black" />
                                            <Text>{Grades[gradesFilter[0]]}</Text>
                                            <AntDesign style={{marginTop: 10}} onPress={() => setGradesFilter([...[Math.max(0, gradesFilter[0] - 1), gradesFilter[1]]])} name="minuscircleo" size={24} color="black" />
                                        </View>
                                        <Slider  containerStyle={{width: "90%"}} minimumTrackTintColor={"#1C9174"} thumbTintColor={"#1C9174"} maximumValue={Object.keys(Grades).length - 1} step={1} value={gradesFilter} onValueChange={v => setGradesFilter([...v])}/>
                                        <View style={{marginLeft: 10}}>
                                            <AntDesign style={{marginBottom: 10}} onPress={() => setGradesFilter([...[gradesFilter[0], Math.min(Object.keys(Grades).length - 1, gradesFilter[1] + 1)]])} name="pluscircleo" size={24} color="black" />
                                            <Text>{Grades[gradesFilter[1]]}</Text>
                                            <AntDesign style={{marginTop: 10}} onPress={() => setGradesFilter([...[gradesFilter[0], Math.max(gradesFilter[0], gradesFilter[1] - 1)]])} name="minuscircleo" size={24} color="black" />
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.paramContainer}>
                                    <View style={styles.paramHeader}>
                                        <Text style={styles.paramHeaderText}>Setters</Text>
                                    </View>
                                    <View style={styles.paramData}>
                                        {
                                            settersFilter.map(v => {
                                                return (
                                                <View key={v.name} style={styles.viewer}>
                                                    <Text>{v.name}</Text>
                                                    <MaterialCommunityIcons style={styles.viewerTrash} onPress={() => setSettersFilter([...settersFilter.filter(i => i.name !== v.name)])} name="trash-can-outline" size={24} color="black" />
                                                </View>);
                                            })
                                        }
                                        <MaterialIcons onPress={() => openAddModal(setSettersFilter, settersFilter)} name="add-box" size={24} color="black" />
                                    </View>
                                </View>
                                <View style={styles.paramContainer}>
                                    <View style={styles.paramHeader}>
                                        <Text style={styles.paramHeaderText}>Sort by</Text>
                                    </View>
                                    <View style={styles.paramData}>
                                        <SelectBox
                                            label="Select sort fields"
                                            options={FILTERS}
                                            selectedValues={sortBy}
                                            onMultiSelect={onMultiChange()}
                                            onTapClose={onMultiChange()}
                                            isMulti
                                        />
                                    </View>
                                </View>
                                <View style={styles.publishContainer}>
                                    <TouchableOpacity onPress={apllyFilters} style={styles.publishButton}>
                                        <Text style={styles.publishButtonText}>Apply</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity>
            </Modal>
            <Modal animationType='fade' transparent={true} visible={addModal}>
                <TouchableOpacity onPress={() => setAddModal({
            objectToUpdate: null,
            updateFunction: null,
            addModal: false
        })}>
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
        </View>
    );
}

export default WallScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
    },
    header: {
        alignItems: "center"
    },
    wallImage: {
        margin: 20,
        height: 200,
        width: 200,
        borderRadius: 200,
    },
    wallIcons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingLeft: 15,
        paddingRight: 15,
    },
    wallsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingLeft: 15,
        paddingRight: 15,
    },
    addWall: {
    },
    walls: {flex: 1},
    wallsContainer: {flex: 1},
    problem: {
        height: 100,
        marginLeft: 20,
        marginTop: 20, 
        marginRight: 20,
        borderRadius: 10,
        backgroundColor: '#B0AFAF',
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    wallImageContainer: {
        backgroundColor: "#222",
        borderRadius: 90,
        marginLeft: 5
    },
    modalContainer: {width: "100%", height: "100%", justifyContent: "center", alignItems: "center"},
    deleteModal: {width: "80%", backgroundColor: "#E8E8E8", borderRadius: 20, justifyContent: "space-around", alignItems: "center"},
    modalTextContainer: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 30,
        marginBottom: 60

    },
    modalText: {fontSize: 20, },
    modalButtonsContainer: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        marginBottom: 15
    },
    modalButton: {
        height: 40,
        width: "40%",
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center"
    },
    modalButtonText: {color: "white"},
    filterModal: {
        width: "90%",
        backgroundColor: "#E8E8E8", 
        borderRadius: 20, 
        opacity: 1, 
        justifyContent: "space-around", 
        alignItems: "center"
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
        justifyContent: 'flex-end',
    },
    publishButton: {
        marginTop: 80,
        marginBottom: 30,
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
    modal: {width: "80%", height: 180, backgroundColor: "#A8A8A8", borderRadius: 20, opacity: 1, justifyContent: "space-around", alignItems: "center"},
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
    },
})