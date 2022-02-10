import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text } from 'react-native';
import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import NearBy from '../components/NearBy';

const Tab = createMaterialTopTabNavigator();

function SomeScreen() {
    return (
        <Text>1111111111111111</Text>
    );
}

function SettingsScreen() {
    return (
        <Text>222222222222222</Text>
    );
}

export default function HomeCategoriesTabs({ navigation }) {
  return (
    <NavigationContainer independent={true}>
        <Tab.Navigator>
            <Tab.Screen name="near" component={NearBy(navigation)} />
            <Tab.Screen name="2" component={SettingsScreen} />
        </Tab.Navigator>
    </NavigationContainer>
    
  );
}