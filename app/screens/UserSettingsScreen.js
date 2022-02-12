import React, { Component, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import Problems from '../assets/problems'
import UserTabs from '../routers/UserTabs';

function UserSettingScreen({ navigation }) {
    const user = {
        username: "User1",
        name: "Tal king",
        birthday: {
            day: 10,
            month: 6,
            year: 1999
        },
        image: require('../assets/images/climber.png')
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.userImageContainer}>
                    <Image style={styles.userImage} source={user.image}/>
                    <Ionicons style={styles.editUserImage} name="ios-pencil-outline" size={24} color="black" />
                </View>
                <View style={styles.userIcons}>
                    <Text style={styles.userNameText}>{user.name}</Text>
                </View>
            </View>
            <UserTabs navigation={navigation} user={user}/>
    </View>
    );
}

export default UserSettingScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
    },
    header: {
        alignItems: "center"
    },
    userImageContainer: {
        margin: 20,
    },
    userImage: {
        height: 200,
        width: 200,
        borderRadius: 200,
        backgroundColor: "black",
    },
    editUserImage: {position: "absolute", bottom: 0, left: 0},
    userIcons: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    userNameText: {
        fontSize: 25,
        fontWeight: "bold"
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