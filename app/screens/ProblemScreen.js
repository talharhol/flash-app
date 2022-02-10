import React, { Component } from 'react';
import { Platform, SafeAreaView, StatusBar, Text, View, StyleSheet, Image, Dimensions } from 'react-native';

function ProblemScreen({ navigation }) {
    const getProblemFullData = () => {
        return {
            id: navigation.getParam('problem').id,
            grade: navigation.getParam('problem').grade,
            name: navigation.getParam('problem').name,
            baseImage: require('../assets/images/Wall.png'),
            setter: {
                name: "User1"
            },
            created: 1589343013000,
            holds: [
                {
                    id: 1,
                    top: "55%",
                    left: "50%",
                    radius: "10%",
                    color: "#1563FC"
                },
                {
                    id: 2,
                    top: "45%",
                    left: "50%",
                    radius: "10%",
                    color: "#19F02F"
                },
                {
                    id: 3,
                    top: "45%",
                    left: "60%",
                    radius: "10%",
                    color: "#FFC90C"
                },
                {
                    id: 4,
                    top: "5%",
                    left: "40%",
                    radius: "15%",
                    color: "#FF0C0C"
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
                <Text style={styles.headerText}>{problem.grade}</Text>
            </View>
            <View style={styles.problemImageContainer}>
                <Image resizeMode="contain" style={[styles.problemImage, getImageDimentions()]} source={problem.baseImage}/>
                {
                    problem.holds.map((hold) => {
                        return (
                            <View key={hold.id} style={{position: "absolute", top: hold.top, left: hold.left, aspectRatio: 1, width: hold.radius, borderColor: hold.color, borderRadius: 1000, borderWidth: 2}}/>
                        );
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