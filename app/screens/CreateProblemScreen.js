import React, { Component, useRef, useState } from 'react';
import { PanResponder, Animated, TouchableWithoutFeedback, TouchableOpacity, Platform, SafeAreaView, StatusBar, Text, View, StyleSheet, Image, Dimensions, Modal } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Draggable from 'react-native-draggable';

function calcDistance(x1, y1, x2, y2) {
    let dx = Math.abs(x1 - x2)
    let dy = Math.abs(y1 - y2)
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}

function CreateProblemScreen({ navigation }) {
    const [initialDistance, setInitialDistance] = useState(null);
    const [isZoom, setIsZoom] = useState(false);
    const [editedHold, setEditedHold] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [shouldAddHold, setShouldAddHold] = useState(false);
    const [holdColor, setHoldColor] = useState(null);
    const [holds, setHolds] = useState([]);

    const pan = useRef(new Animated.ValueXY()).current;
    const panRadius = useRef(new Animated.Value(1)).current;

    const panResponder = useRef(
        PanResponder.create({
          onMoveShouldSetPanResponder: (e, {dx, dy}) => {
            return Math.abs(dx) > 2 || Math.abs(dy) > 2;
          },
          onPanResponderGrant: () => {
            pan.setOffset({
              x: pan.x._value,
              y: pan.y._value
            });
            panRadius.setOffset(panRadius._value)
          },
          onPanResponderMove: (event, gestureState) => {
            const touches = event.nativeEvent.touches;
            if (touches.length === 1) {
                Animated.event(
                    [
                      null,
                      { dx: pan.x, dy: pan.y }
                    ],
                    {useNativeDriver: false}
                  )(event, gestureState);
            }
            else if (touches.length === 2) {
                handleZoom(touches[0], touches[1])
            }
            
          },
          onPanResponderRelease: (e) => {
            pan.flattenOffset();
            //setIsZoom(false);
          },
        })
      ).current;
    
    const baseImage = require('../assets/images/Wall.png');
    const imgData = Image.resolveAssetSource(baseImage)
    const ratio = Dimensions.get("screen").width / imgData.width;
    
    const handleZoom = (t1, t2) => {
        let distance = calcDistance(t1.locationX, t1.locationY, t2.locationX, t2.locationY)
        console.log(distance, isZoom);
        if (!isZoom) {
            setInitialDistance(distance);
            setIsZoom(true);
            return;
        }
        // let touchZoom = distance /  initialDistance;
        // console.log(touchZoom);

    }
    
    const getImageDimentions = () => {
        return {
            width: imgData.width * ratio,
            height: imgData.height * ratio,
        }
    }

    const addHold = ({ nativeEvent }) => {
        if (!shouldAddHold) return;
        setShouldAddHold(false); 
        const hold = {
            id: Math.random().toString(36).substr(2, 9),
            top: (nativeEvent.locationY / getImageDimentions().height),
            left: (nativeEvent.locationX / getImageDimentions().width),
            radius: 0.1,
            color: holdColor
        };
        holds.push(hold);
        setHolds([...holds]);
        setEditedHold({...hold});
    }

    const saveHold = (hold) => {
        hold.top = (((hold.top * getImageDimentions().height) + pan.y._value) / getImageDimentions().height);
        hold.left = (((hold.left * getImageDimentions().width) + pan.x._value) / getImageDimentions().width);
        setHolds([...holds.map( h => {
            if (h.id === hold.id) return hold;
            return h;
        })]);

        pan.setValue({x: 0, y: 0});
        setEditedHold(null);
    }
    const discardHold = (hold) => {
        setHolds([...holds.filter(h => h.id !== hold.id)]);
        pan.setValue({x: 0, y: 0});
        setEditedHold(null);
    }
    const enableAddHold = (color) => {
        setHoldColor(color);
        setShouldAddHold(true);
        setModalVisible(false)
    }

    return (
        <SafeAreaView style={styles.container}>
            <Modal animationType='fade' transparent={true} visible={modalVisible}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <View style={{width: "100%", height: "100%", justifyContent: "center", alignItems: "center"}}>
                        <TouchableWithoutFeedback>
                            <View style={{width: "80%", height: 260, backgroundColor: "#E8E8E8", borderRadius: 20, opacity: 0.8, justifyContent: "space-around", alignItems: "center"}}>
                                <TouchableOpacity onPress={() => enableAddHold("#1563FC")} style={[styles.addHoldButton, {borderColor: "#1563FC"}]}>
                                    <Text style={{color: "#1563FC", fontWeight: "bold"}}>Hold</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => enableAddHold("#19F02F")} style={[styles.addHoldButton, {borderColor: "#19F02F"}]}>
                                    <Text style={{color: "#19F02F", fontWeight: "bold"}}>Start</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => enableAddHold("#FF0C0C")} style={[styles.addHoldButton, {borderColor: "#FF0C0C"}]}>
                                    <Text style={{color: "#FF0C0C", fontWeight: "bold"}}>Top</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => enableAddHold("#FFC90C")} style={[styles.addHoldButton, {borderColor: "#FFC90C"}]}>
                                    <Text style={{color: "#FFC90C", fontWeight: "bold"}}>Feet</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity>
            </Modal>
            {
                editedHold === null &&
                <View style={styles.problemHeader}>
                    <AntDesign name="closecircleo" size={24} color="black" />
                    <Text onPress={() => setModalVisible(true)} style={{color: "white"}}>Add hold</Text>
                    <Text style={{color: "#FF0101"}}>Next</Text>
                </View>
            }
                <View style={[styles.problemImageContainer]} {...panResponder.panHandlers}>
                    <TouchableWithoutFeedback onPress={addHold}>
                        <Image resizeMode="contain" style={[styles.problemImage, getImageDimentions()]} source={baseImage}/>
                    </TouchableWithoutFeedback>
                    {
                        holds.map((hold) => {
                            const x = hold.left * getImageDimentions().width;
                            const y = hold.top * getImageDimentions().height;
                            const r = hold.radius * getImageDimentions().width;
                            if ((editedHold && editedHold.id) === hold.id) {
                                const top = y - (r / 2), left = x - (r / 2) ;
                                return (
                                    <Animated.View key={hold.id} style={{ transform: [{ translateX: pan.x }, { translateY: pan.y }], zIndex:100, position: "absolute", width: r, height: r, top: top, left: left}} >
                                        <View style={{width: r, height: r, borderRadius: r, borderColor: hold.color, borderWidth: 5}} />
                                    </Animated.View>
                                );
                            }
                            return (
                                <TouchableOpacity onPress={() => setEditedHold({...hold})} key={hold.id} style={{position: "absolute", height: r, width: r, top: y - (r / 2), left: x - (r / 2), alignItems: "center", justifyContent: "center"}}>
                                    <View style={{width: r, height: r, borderRadius: r, borderColor: hold.color, borderWidth: 2}} />
                                </TouchableOpacity>
                            );
                        })
                    }
                </View>
            {
                editedHold !== null &&
                <View>
                    <View style={{flexDirection: "row"}}>
                        <TouchableOpacity onPress={() => saveHold({...editedHold})} style={{height: 40, width: "50%", backgroundColor: "green", justifyContent: "center", alignItems: "center"}}>
                            <Text>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => discardHold({...editedHold})} style={{height: 40, width: "50%", backgroundColor: "red", justifyContent: "center", alignItems: "center"}}>
                            <Text>Discard</Text>
                        </TouchableOpacity>
                    </View>
                    
                </View>
                
            }
            
        </SafeAreaView>
    );
}

export default CreateProblemScreen;
const styles = StyleSheet.create({
    addHoldButton: {
        height: 40,
        width: "50%",
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center"
    },
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
    },
    problemImage: {
    },
    problemData: {
        width: "100%"
    }
})