import React, { Component } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import Walls from '../assets/walls'

function GymScreen({ navigation }) {
    const gym = navigation.getParam('gym')
    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Image style={styles.gymImage} source={gym.image}/>
                    <View style={styles.gymIcons}>
                        <Ionicons name="ios-pencil-outline" size={24} color="black" />
                        <Text>{gym.name}</Text>
                        <MaterialCommunityIcons name="trash-can-outline" size={24} color="black" />
                    </View>
                </View>
                <View style={styles.walls}>
                    <View style={styles.wallsHeader}>
                        <Ionicons name="add-circle-outline" size={24} color="black" style={styles.addWall}/>
                        <Text>Walls</Text>
                    </View>
                    <View style={styles.wallsContainer}>
                        {
                            Walls.map((wall) => {
                                return (
                                    <TouchableOpacity key={wall.id} onPress={() => navigation.navigate('WallScreen', {wall})}>
                                        <View style={styles.wall} >
                                            <View style={styles.wallImageContainer}>
                                                <Image source={wall.image} resizeMode={"contain"} style={styles.wallImage} />
                                            </View>
                                            <Text style={{marginLeft: 20}}>{wall.name}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        }
                    </View>
                </View>
            </ScrollView>
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
    walls: {flex: 1},
    wallsContainer: {flex: 1},
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
    }

})