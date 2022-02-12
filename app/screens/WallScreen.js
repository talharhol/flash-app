import React, { Component, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import Problems from '../assets/problems'

function WallScreen({ navigation }) {
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const wall = navigation.getParam('wall')
    const deleteWall = () => {
        // delete wall
        navigation.goBack();
    }
    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Image style={styles.wallImage} source={wall.image}/>
                    <View style={styles.wallIcons}>
                        <Ionicons name="ios-pencil-outline" size={24} color="black" />
                        <Text>{wall.name}</Text>
                        <MaterialCommunityIcons onPress={() => setDeleteModalVisible(true)} name="trash-can-outline" size={24} color="black" />
                    </View>
                </View>
                <View style={styles.walls}>
                    <View style={styles.wallsHeader}>
                        <Ionicons onPress={() => navigation.navigate('SelectHoldsScreen')} name="add-circle-outline" size={24} color="black" style={styles.addWall}/>
                        <Text>Problems</Text>
                        <Ionicons name="ios-filter-sharp" size={24} color="black" />
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
                            <View style={styles.modal}>
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
    modal: {width: "80%", backgroundColor: "#E8E8E8", borderRadius: 20, opacity: 0.8, justifyContent: "space-around", alignItems: "center"},
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
        alignItems: "center"
    },
    modalButton: {
        height: 40,
        width: "40%",
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center"
    },
    modalButtonText: {color: "white"}
    


})