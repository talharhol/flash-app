import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Button,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import Zoomable from "./Zoomable";
import AddHoldModal from "./AddHoldModal";
import DrawHold from "./Drawable";
import { Hold, HoldType } from "../../dataTypes/holds";
import Svg, { Path } from "react-native-svg";
import { imageSize } from "./SizeContext";

const SelectHoldsScreen: React.FC<NativeStackScreenProps<any>> = ({ route, }) => {
  const [isHoldModalVisible, setIsHoldModalVisible] = useState(false);
  const [currentHoldType, setCurrentHoldType] = useState<HoldType | null>(null);
  const isDrawing = currentHoldType !== null;
  const [holds, setHolds] = useState<Hold[]>([]);
  const screenDimension = useWindowDimensions();
  const [imageHeight, setImageHeight] = useState(0);
  const startCreatingHold = (holdType: HoldType) => {
    setIsHoldModalVisible(false);
    setCurrentHoldType(holdType);
  };
  const onCreatedHold = (path: string) => {
    setHolds(holds => holds.concat([new Hold({ svgPath: path, type: currentHoldType })]));
    setCurrentHoldType(null);
  };

  useEffect(() => {
    // Image.getSize(Image.resolveAssetSource(route.params.wall.image).uri, (width, height) => setImageHeight(screenDimension.width / (width || 1) * height));
    setImageHeight(550);
  }, []);

  return (
    <imageSize.Provider value={{ width: screenDimension.width, height: imageHeight }}>
      <View style={styles.container}>
        {
          isHoldModalVisible && <AddHoldModal closeModal={setIsHoldModalVisible.bind(this, false)} addHold={startCreatingHold} />
        }
        <View style={[styles.zoomedContainer]}>
          <Zoomable disableMovement={isDrawing}>
            <View style={styles.zoomedContent}>
              {
                isDrawing && <DrawHold currentHoldType={currentHoldType} onFinishedDrawingShape={onCreatedHold} />
              }
              <View style={{ position: "absolute", zIndex: 1 }}>
                <Svg
                  viewBox={`0 0 ${screenDimension.width} ${imageHeight}`}
                  style={[{ position: "relative", width: screenDimension.width, height: imageHeight }]}>
                  {
                    holds.map(hold => (
                      <Path key={hold.id}
                        d={hold.svgPath}
                        stroke={hold.type.color}
                        fill='transparent'
                        strokeWidth={2}
                        strokeLinejoin='round'
                        strokeLinecap='round'
                      />
                    ))
                  }
                </Svg>
              </View>
              <Image style={[styles.problemImage, { width: screenDimension.width, height: imageHeight }]} source={route.params.wall.image} />
            </View>
            {/* <HoldsLayout />  */}
          </Zoomable>
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Add Hold" onPress={setIsHoldModalVisible.bind(this, true)} />
          {/* <Button title="Start Drawing" onPress={() => setIsDrawing(a => !a)}></Button> */}
        </View>
      </View>
    </imageSize.Provider>
  );
};

export default SelectHoldsScreen;

const styles = StyleSheet.create({
  problemImage: {
    resizeMode: "center"
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: "auto",
    marginBottom: "auto"
  },
  zoomedContainer: {
    maxHeight: "75%",
    overflow: "hidden",
    flex: 1,
  },
  zoomedContent: {
    flex: 1,
    position: "relative",
    display: "flex"
  },
  saveHoldButton: {
    height: 40,
    width: "50%",
    backgroundColor: "green",
    justifyContent: "center",
    alignItems: "center",
  },
  discardHoldButton: {
    height: 40,
    width: "50%",
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
  },
  sliderLable: { alignSelf: "center" },
  sliderContainer: {
    marginLeft: 10,
    marginRight: 10,
    justifyContent: "center",
  },
  next: { color: "#FF0101" },
  modal: {
    width: "80%",
    height: 260,
    backgroundColor: "#E8E8E8",
    borderRadius: 20,
    opacity: 0.8,
    justifyContent: "space-around",
    alignItems: "center",
  },
  modalContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  addHoldText: { fontWeight: "bold" },
  addHoldTextTitle: { color: "white" },
  addHoldButton: {
    height: 40,
    width: "50%",
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
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
    zIndex: 10,
    top: -StatusBar.currentHeight,
  },
  headerText: {
    color: "white",
  },
  problemImageContainer: {
    backgroundColor: "black",
    zIndex: 0,
  },
  problemData: {
    width: "100%",
  },
});
