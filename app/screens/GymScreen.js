import React, { Component, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import Walls from '../assets/walls';

function GymScreen({ navigation, route }) {
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const { gym } = route.params;

    const deleteGym = () => {
        // delete wall
        navigation.goBack();
    };
    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Image style={styles.gymImage} source={gym.image} />
                    <View style={styles.gymIcons}>
                        <Ionicons onPress={() => navigation.navigate('EditGymScreen', { gym })} name="ios-pencil-outline" size={24} color="black" />
                        <Text>{gym.name}</Text>
                        <MaterialCommunityIcons onPress={() => setDeleteModalVisible(true)} name="trash-can-outline" size={24} color="black" />
                    </View>
                </View>
                <View style={styles.walls}>
                    <View style={styles.wallsHeader}>
                        <Ionicons onPress={() => navigation.navigate("CreateWallScreen")} name="add-circle-outline" size={24} color="black" style={styles.addWall} />
                        <Text>Walls</Text>
                    </View>
                    <View style={styles.wallsContainer}>
                        {
                            Walls.map((wall) => {
                                return (
                                    <TouchableOpacity key={wall.id} onPress={() => navigation.navigate('WallScreen', { wall })}>
                                        <View style={styles.wall} >
                                            <View style={styles.wallImageContainer}>
                                                <Image source={wall.image} resizeMode={"contain"} style={styles.wallImage} />
                                            </View>
                                            <Text style={{ marginLeft: 20 }}>{wall.name}</Text>
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
                                    <TouchableOpacity onPress={() => deleteGym()} style={[styles.modalButton, { borderColor: "red" }]}>
                                        <Text style={[styles.modalButtonText, { color: "red" }]}>I'm sure</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={[styles.modalButton, { borderColor: "green" }]}>
                                        <Text style={[styles.modalButtonText, { color: "green" }]}>Discard</Text>
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

export default GymScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
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
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        paddingLeft: 15,
        paddingRight: 15,
    },
    wallsHeader: {
        height: 40,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    addWall: {
        position: "absolute",
        left: 15
    },
    walls: { flex: 1 },
    wallsContainer: { flex: 1 },
    wall: {
        height: 100,
        marginLeft: 20,
        marginTop: 20,
        marginRight: 20,
        borderRadius: 10,
        backgroundColor: '#B0AFAF',
        flexDirection: "row",
        alignItems: "center"
    },
    wallImage: {
        height: 90,
        width: 90,
        borderRadius: 90,
    },
    wallImageContainer: {
        backgroundColor: "#222",
        borderRadius: 90,
        marginLeft: 5
    },
    modalContainer: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
    deleteModal: { width: "80%", backgroundColor: "#E8E8E8", borderRadius: 20, justifyContent: "space-around", alignItems: "center" },
    modalTextContainer: {
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 30,
        marginBottom: 60

    },
    modalText: { fontSize: 20, },
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
    modalButtonText: { color: "white" },

});