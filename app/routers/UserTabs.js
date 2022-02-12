import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';

const Tab = createMaterialTopTabNavigator();

function AboutSceen(user) {
    return () => (
        <View style={styles.container}>
            <Text>Name: {user.name}</Text>
            <Text>other data</Text>
        </View>
    );
}

function ActionsSceen(navigation) {
    return () => (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.navigate("CreateGymScreen")} style={styles.actionButton}>
                <Text style={styles.actionText}>Open Gym</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function UserTabs({ navigation, user }) {
  return (
    <NavigationContainer independent={true}>
        <Tab.Navigator>
            <Tab.Screen name="about" component={AboutSceen(user)} />
            <Tab.Screen name="actions" component={ActionsSceen(navigation)} />
        </Tab.Navigator>
    </NavigationContainer>
    
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center"

    },
    actionButton: {
        width: "60%",
        height: 50,
        backgroundColor: "red",
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20
        
    },
    actionText: {
        color: "white",
        fontSize: 20
    }
})