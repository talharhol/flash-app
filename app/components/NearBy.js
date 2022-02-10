import React, { Component } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';

import Gyms from '../assets/gyms'

function NearBy(navigation) {
    return () => (
        <View style={styles.container}>
            <ScrollView>
                <View style={styles.category}>
                    <Text>Near by gyms</Text>
                </View>
                <View style={styles.gyms}>
                    {
                        Gyms.map((gym) => {
                            return (
                                <TouchableOpacity key={gym.id} onPress={() => navigation.navigate('GymScreen', {gym})}>
                                    <View style={styles.gym} >
                                        <Image source={gym.image} resizeMode={"contain"} style={{borderRadius: 90, height: 90, width: 90, marginLeft: 5}} />
                                        <Text style={{marginLeft: 20}}>{gym.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    }
                </View>
            </ScrollView>
        </View>
    );
}

export default NearBy;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: "100%",
    },
    category: {
        height: 40,
        width: "100%",
        justifyContent: "center", 
        alignItems: "center",
    },
    gyms: {flex: 1},
    gym: {
        height: 100,
        marginLeft: 20,
        marginTop: 20, 
        marginRight: 20,
        borderRadius: 10,
        backgroundColor: '#B0AFAF',
        flexDirection: "row",
        alignItems: "center"
    },


})