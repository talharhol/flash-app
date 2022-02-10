import React, { Component } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import Problems from '../assets/problems'

function WallScreen({ navigation }) {
    const wall = navigation.getParam('wall')
    return (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Image style={styles.wallImage} source={wall.image}/>
                    <View style={styles.wallIcons}>
                        <Ionicons name="ios-pencil-outline" size={24} color="black" />
                        <Text>{wall.name}</Text>
                        <MaterialCommunityIcons name="trash-can-outline" size={24} color="black" />
                    </View>
                </View>
                <View style={styles.walls}>
                    <View style={styles.wallsHeader}>
                        <Ionicons onPress={() => navigation.navigate('CreateProblemScreen')} name="add-circle-outline" size={24} color="black" style={styles.addWall}/>
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
    }

})