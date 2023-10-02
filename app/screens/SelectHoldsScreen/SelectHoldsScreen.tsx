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
import Drawable from "./Drawable";

// const HoldsLayout: React.FC = () => {
//   return (
//       <View>
//           <Drawable />
//           <ExistingHolds />
//       </View>
//   )
// }
const SelectHoldsScreen: React.FC<NativeStackScreenProps<any>> = ({ route, }) => {
  const [isChoosingNewHold, setIsChoosingNewHold] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const screenDimension = useWindowDimensions();
  const [imageSize, setTrueValue] = useState({ height: 0, width: 0 });
  useEffect(() => {
    Image.getSize(Image.resolveAssetSource(route.params.wall.image).uri, (width, height) => setTrueValue({ height, width }));
  }, []);
  return (
    <View style={styles.container}>
      {
        isChoosingNewHold && <AddHoldModal closeModal={setIsChoosingNewHold.bind(this, false)} addHold={holdType => setIsChoosingNewHold(false) || console.log(holdType)} />
      }
      <View style={[styles.zoomedContainer]}>
        <Zoomable dimensions={{ width: screenDimension.width, height: screenDimension.width / (imageSize.width || 1) * imageSize.height }} disableMovement={isDrawing}>
          <View style={styles.zoomedContent}>
            {
              isDrawing && <Drawable />
            }
            <Image style={[styles.problemImage, { width: screenDimension.width, height: screenDimension.width / (imageSize.width || 1) * imageSize.height }]} source={route.params.wall.image} />
          </View>
          {/* <HoldsLayout />  */}
        </Zoomable>
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Add Hold" onPress={setIsChoosingNewHold.bind(this, true)} />
        <Button title="Start Drawing" onPress={() => setIsDrawing(a => !a)}></Button>
      </View>
    </View>
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
