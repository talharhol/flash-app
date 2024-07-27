import { Hold, HoldInterface, HoldType, SortHolds, holdTypeToHoldColor } from "@/DAL/hold";
import { imageSize } from "../general/SizeContext";
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
  ImageSourcePropType,
  ViewProps,
} from "react-native";
import Svg from "react-native-svg";
import Zoomable from "./Zoomable";
import DrawHold from "./DrawHold";
import SVGHold from "./SvgHold";
import { svgZoom } from "@/constants/consts";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from 'expo-media-library';

interface BolderProblemProps extends ViewProps {
  wallImage: ImageSourcePropType;
  configuredHolds?: { id: string; svgPath: string; }[];
  existingHolds?: HoldInterface[];
  drawingHoldType?: HoldType | null;
  disableMovment?: boolean;
  scale?: number
  fullScreen?: boolean;
  bindToImage?: boolean;
  onDrawHoldFinish?: (hold: HoldInterface) => void;
  onDrawHoldCancel?: () => void;
  onConfiguredHoldClick?: (hold_id: string) => void;
  onHoldClick?: (hold_id: string) => void;
}

export interface BolderProblemComponent {
  exportProblem: () => void;
  getProblemUrl: () => Promise<string>;
}


const BolderProblem = forwardRef<BolderProblemComponent, BolderProblemProps>(
  (
    { wallImage, configuredHolds, existingHolds, drawingHoldType, disableMovment, scale, fullScreen, bindToImage, onDrawHoldFinish, onDrawHoldCancel, onConfiguredHoldClick, onHoldClick, ...props }
    , ref
  ) => {
    const screenDimension = useWindowDimensions();
    const [imageHeight, setImageHeight] = useState(0);
    const [imageWidth, setImageWidth] = useState(screenDimension.width * (scale || 1));
    const onCreatedHold = (path: string) => {
      if (drawingHoldType == null) return;
      onDrawHoldFinish?.(new Hold({ svgPath: path, color: drawingHoldType.color }));
    };
    useEffect(() => {
      Image.getSize(Image.resolveAssetSource(wallImage).uri, (width, height) => {
        let tmpWidth = screenDimension.width * (scale ? scale : 1);
        let tmpHeight = tmpWidth * 1.5;
        if (height / width <= 1.5) {
          tmpHeight = tmpWidth / (width || 1) * height;
        } else {
          tmpHeight = tmpWidth * 1.5;
          tmpWidth = tmpHeight / (height / width);
        }
        setImageHeight(tmpHeight);
        setImageWidth(tmpWidth);
      });
    }, []);
    const zoomableViewRef = useRef<React.ElementRef<typeof Zoomable>>(null);
    const captureAndSave = async () => {
      try {
        const uri = await captureRef(problemContainerRef, {
          format: 'png',
          quality: 1,
        });
        await MediaLibrary.saveToLibraryAsync(uri);
        alert('Image saved to gallery!');
      } catch (error) {
        console.error('Error capturing and saving image:', error);
      }
    };

    useImperativeHandle(ref, () => {
      return {
        exportProblem() {
          captureAndSave();
        },
        async getProblemUrl() {
          return await captureRef(problemContainerRef, {
            format: 'png',
            quality: 1,
          })
        },
      };
    }, []);
    const problemContainerRef = useRef(null);

    const getHeight = () => {
      if (fullScreen) return screenDimension.height;
      if (bindToImage) return imageHeight;
      return screenDimension.width * 1.5 * (scale || 1);
    }
    const getWidth = () => {
      if (fullScreen) return screenDimension.width;
      return screenDimension.width * (scale || 1);
    }


    return (
      <View {...props} style={[styles.zoomedContainer, { height: getHeight(), width: getWidth(), alignContent: "center", justifyContent: "center", alignItems: "center" }, props.style]}>
        <imageSize.Provider value={{ width: imageWidth, height: imageHeight }}>
          <Zoomable
            ref={zoomableViewRef}
            disableMovement={!!disableMovment || !!drawingHoldType} maxZoom={20}>
            <View ref={problemContainerRef} style={[styles.zoomedContent, { height: getHeight(), width: getWidth(), alignContent: "center", justifyContent: "center", alignItems: "center" }]} collapsable={false}>
              {
                !!drawingHoldType &&
                <DrawHold
                  onCancel={onDrawHoldCancel}
                  currentHoldType={drawingHoldType}
                  onFinishedDrawingShape={onCreatedHold}
                />
              }
              <View style={{ position: "absolute", zIndex: 1 }}>
                <Svg
                  viewBox={`0 0 ${imageWidth * svgZoom / (scale || 1)} ${imageHeight * svgZoom / (scale || 1)}`}
                  style={[{ position: "relative", width: imageWidth, height: imageHeight }]}>
                  {
                    configuredHolds?.sort(SortHolds).map(hold => (
                      <SVGHold
                        key={hold.id}
                        hold={hold}
                        transparant
                        onHoldClick={onConfiguredHoldClick}
                        zoomableViewRef={zoomableViewRef}
                      />
                    ))
                  }
                  {
                    existingHolds?.sort(SortHolds).map((hold) => (
                      <SVGHold
                        key={hold.id}
                        hold={hold}
                        onHoldClick={onHoldClick}
                        zoomableViewRef={zoomableViewRef}
                      />
                    ))
                  }
                </Svg>
              </View>
              <Image style={[styles.problemImage, { width: imageWidth, height: imageHeight }]} source={wallImage} />
            </View>
          </Zoomable>
        </imageSize.Provider>
      </View>
    );
  });


export default BolderProblem;

const styles = StyleSheet.create({
  problemImage: {
    resizeMode: "cover"
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: "auto",
    marginBottom: "auto"
  },
  zoomedContainer: {
    overflow: "hidden",
    backgroundColor: "black",
  },
  zoomedContent: {
    flex: 1,
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center"
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
    height: 50 + (StatusBar.currentHeight ?? 0),
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
    top: -(StatusBar.currentHeight ?? 0),
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
