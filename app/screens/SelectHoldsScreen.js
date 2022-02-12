import React, { useRef, useState } from 'react';
import { PanResponder, Animated, TouchableWithoutFeedback, TouchableOpacity, Platform, SafeAreaView, StatusBar, Text, View, StyleSheet, Image, Dimensions, Modal } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';


function SelectHoldsScreen({ navigation }) {
    const [editedHold, setEditedHold] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [shouldAddHold, setShouldAddHold] = useState(false);
    const [holdColor, setHoldColor] = useState(null);
    const [holds, setHolds] = useState([]);
    const baseImage = require('../assets/images/Wall.png');
    const imgData = Image.resolveAssetSource(baseImage)
    const ratio = Dimensions.get("screen").width / imgData.width;
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
          onPanResponderMove: Animated.event(
            [
              null,
              { dx: pan.x, dy: pan.y }
            ],
            {useNativeDriver: false}
          ),
          onPanResponderRelease: (e) => {
            pan.flattenOffset();
          },
        })
      ).current;
    
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
    const editRadius = (radius) => {
        let hold = {...editedHold};
        hold.radius = radius[0];
        setEditedHold(hold);
        setHolds([...holds.map( h => {
            if (h.id === hold.id) return hold;
            return h;
        })]);
    }

    return (
        <SafeAreaView style={styles.container}>
            <Modal animationType='fade' transparent={true} visible={modalVisible}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContainer}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modal}>
                                <TouchableOpacity onPress={() => enableAddHold("#1563FC")} style={[styles.addHoldButton, {borderColor: "#1563FC"}]}>
                                    <Text style={[styles.addHoldText, {color: "#1563FC"}]}>Hold</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => enableAddHold("#19F02F")} style={[styles.addHoldButton, {borderColor: "#19F02F"}]}>
                                    <Text style={[styles.addHoldText, {color: "#19F02F"}]}>Start</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => enableAddHold("#FF0C0C")} style={[styles.addHoldButton, {borderColor: "#FF0C0C"}]}>
                                    <Text style={[styles.addHoldText, {color: "#FF0C0C"}]}>Top</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => enableAddHold("#FFC90C")} style={[styles.addHoldButton, {borderColor: "#FFC90C"}]}>
                                    <Text style={[styles.addHoldText, {color: "#FFC90C"}]}>Feet</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableOpacity>
            </Modal>
            {
                editedHold === null &&
                <View style={styles.problemHeader}>
                    <AntDesign name="closecircleo" size={24} color="black" onPress={ () => navigation.goBack() }/>
                    <Text onPress={() => setModalVisible(true)} style={styles.addHoldTextTitle}>Add hold</Text>
                    <Text style={styles.next} onPress={() => navigation.replace('CreateProblemScreen', {holds})}>Next</Text>
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
                                    <Animated.View key={hold.id} style={{ transform: pan.getTranslateTransform(), zIndex:100, position: "absolute", width: r, height: r, top: top, left: left}} >
                                        <View style={{width: r, height: r, borderRadius: r, borderColor: hold.color, borderWidth: 5}} />
                                    </Animated.View>
                                );
                            }
                            return (
                                <TouchableOpacity onPress={() => setEditedHold({...hold})} key={hold.id} style={{position: "absolute", height: r, width: r, top: y - (r / 2), left: x - (r / 2), alignItems: "center", justifyContent: "center"}}>
                                    <View style={{width: r, height: r, borderRadius: r, borderColor: hold.color, borderWidth: 3}} />
                                </TouchableOpacity>
                            );
                        })
                    }
                </View>
            {
                editedHold !== null &&
                <View>
                    <View style={styles.sliderContainer}>
                        <Text style={styles.sliderLable}>Edit hold's radius</Text>
                        <Slider minimumTrackTintColor={"#1C9174"} thumbTintColor={"#1C9174"} value={editedHold.radius} onValueChange={value => editRadius(value)}></Slider>
                    </View>
                    <View style={{flexDirection: "row"}}>
                        <TouchableOpacity onPress={() => saveHold({...editedHold})} style={styles.saveHoldButton}>
                            <Text>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => discardHold({...editedHold})} style={styles.discardHoldButton}>
                            <Text>Discard</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
            }
            
        </SafeAreaView>
    );
}

export default SelectHoldsScreen;
const styles = StyleSheet.create({
    saveHoldButton: {height: 40, width: "50%", backgroundColor: "green", justifyContent: "center", alignItems: "center"},
    discardHoldButton: {height: 40, width: "50%", backgroundColor: "red", justifyContent: "center", alignItems: "center"},
    sliderLable: {alignSelf: "center"},
    sliderContainer: {marginLeft: 10, marginRight: 10, justifyContent: "center"},
    next: {color: "#FF0101"},
    modal: {width: "80%", height: 260, backgroundColor: "#E8E8E8", borderRadius: 20, opacity: 0.8, justifyContent: "space-around", alignItems: "center"},
    modalContainer: {width: "100%", height: "100%", justifyContent: "center", alignItems: "center"},
    addHoldText: {fontWeight: "bold"},
    addHoldTextTitle: {color: "white"},
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