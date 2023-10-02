import React, { Component } from 'react';
import { Platform, SafeAreaView, StatusBar, Text, View, StyleSheet, Image, Dimensions } from 'react-native';
import Grades from '../assets/grades';

function ProblemScreen({ route, navigation }) {
    const getProblemFullData = () => {
        return {
            id: route.params.problem.id,
            grade: route.params.problem.grade,
            name: route.params.problem.name,
            baseImage: require('../assets/images/Wall.png'),
            setter: {
                name: "User1"
            },
            created: 1589343013000,
            holds: [
                {
                  "color": "#19F02F",
                  "id": "9z0b3atxw",
                  "left": 0.2180883001398157,
                  "radius": 0.1,
                  "top": 0.7352385917824608,
                },
                {
                  "color": "#19F02F",
                  "id": "8itgip4rj",
                  "left": 0.45509257139983,
                  "radius": 0.07731958060477928,
                  "top": 0.7385277598087457,
                },
                {
                  "color": "#1563FC",
                  "id": "8zmswfae4",
                  "left": 0.5287037531534831,
                  "radius": 0.1,
                  "top": 0.5862477916685624,
                },
                {
                  "color": "#1563FC",
                  "id": "lzbhm1fdt",
                  "left": 0.2962851736280653,
                  "radius": 0.1,
                  "top": 0.48392524210308135,
                },
                {
                  "color": "#1563FC",
                  "id": "donf4bbzk",
                  "left": 0.527837594350179,
                  "radius": 0.1,
                  "top": 0.28172677582072714,
                },
                {
                  "color": "#1563FC",
                  "id": "3uoj47u2z",
                  "left": 0.2175925890604655,
                  "radius": 0.056185563420220526,
                  "top": 0.23233227651938645,
                },
                {
                  "color": "#FF0C0C",
                  "id": "wuo1duwmd",
                  "left": 0.37777776718139644,
                  "radius": 0.1,
                  "top": 0.08426831813980885,
                },
              ]
        }
    }
    const problem = getProblemFullData();
    const getImageDimentions = () => {
        const imgData = Image.resolveAssetSource(problem.baseImage);
        const ratio = Dimensions.get("screen").width / imgData.width;
        return {
            width: imgData.width * ratio,
            height: imgData.height * ratio,
        }
    }
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.problemHeader}>
                <Text style={styles.headerText}>{problem.name}</Text>
                <Text style={styles.headerText}>{Grades[problem.grade]}</Text>
            </View>
            <View style={styles.problemImageContainer}>
                <Image resizeMode="contain" style={[styles.problemImage, getImageDimentions()]} source={problem.baseImage}/>
                {
                    problem.holds.map((hold) => {
                        const x = hold.left * getImageDimentions().width;
                        const y = hold.top * getImageDimentions().height;
                        const r = hold.radius * getImageDimentions().width;
                        return <View key={hold.id} style={{position: "absolute", height: r, width: r, borderRadius: r, top: y - (r / 2), left: x - (r / 2),  borderColor: hold.color, borderWidth: 3}} />
                    })
                }
            </View>
            <View style={styles.problemData}>
                <Text>Set by: {problem.setter.name}</Text>
                <Text>Created: {(new Date(problem.created)).toLocaleDateString()}</Text>
            </View>
            
        </SafeAreaView>
    );
}

export default ProblemScreen;
const styles = StyleSheet.create({
    container: {
        width: "100%",
        marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        flex: 1,
    },
    problemHeader: {
        height: 50 + StatusBar.currentHeight,
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingLeft: 15,
        paddingRight: 15,
        alignItems: "center",
        backgroundColor: "black",
        opacity: 0.5,
        position: "absolute",
        paddingTop: StatusBar.currentHeight,
        zIndex: 1000,
        top: -StatusBar.currentHeight,
    },
    headerText: {
        color: "white",
        
    },
    problemImageContainer: {
        backgroundColor: "black",
        width: "100%",

    },
    problemImage: {
    },
    problemData: {
        width: "100%"
    }
})