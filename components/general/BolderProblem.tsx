import { ConvertToCycle, Hold, HoldInterface, HoldType, SortHolds, holdTypeToHoldColor } from "@/DAL/hold";
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
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from 'expo-media-library';
import { Colors } from "@/constants/Colors";

interface BolderProblemProps extends ViewProps {
  wallImage: ImageSourcePropType;
  configuredHolds?: HoldInterface[];
  existingHolds?: HoldInterface[];
  drawingHoldType?: HoldType | null;
  disableMovment?: boolean;
  scale?: number
  fullScreen?: boolean;
  bindToImage?: boolean;
  aspectRatio?: number;
  cycle?: boolean;
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
    { wallImage, configuredHolds, existingHolds, drawingHoldType, disableMovment, scale, fullScreen, bindToImage, aspectRatio, cycle, onDrawHoldFinish, onDrawHoldCancel, onConfiguredHoldClick, onHoldClick, ...props }
    , ref
  ) => {
    const screenDimension = useWindowDimensions();
    aspectRatio = aspectRatio ?? (fullScreen ? screenDimension.height / screenDimension.width : 1.5);
    const [imageHeight, setImageHeight] = useState(0);
    const [imageWidth, setImageWidth] = useState(screenDimension.width * (scale || 1));
    const zoomableViewRef = useRef<React.ElementRef<typeof Zoomable>>(null);
    const problemContainerRef = useRef(null);
    existingHolds = existingHolds ?? [];
    if (cycle) {
      existingHolds = ConvertToCycle(existingHolds);
    }

    
    useEffect(() => {
      Image.getSize(Image.resolveAssetSource(wallImage).uri, (width, height) => {
        let tmpWidth = screenDimension.width * (scale ? scale : 1);
        let tmpHeight = tmpWidth * aspectRatio;
        if (height / width <= aspectRatio) {
          tmpHeight = tmpWidth / (width || 1) * height;
        } else {
          tmpHeight = tmpWidth * aspectRatio;
          tmpWidth = tmpHeight / (height / width);
        }
        setImageHeight(tmpHeight);
        setImageWidth(tmpWidth);
      });
    }, [aspectRatio]);

    const onCreatedHold = (path: string) => {
      if (drawingHoldType == null) return;
      onDrawHoldFinish?.(new Hold({ svgPath: path, color: drawingHoldType.color }));
    };
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
    const getHeight = () => {
      if (fullScreen) return screenDimension.height;
      if (bindToImage) return imageHeight;
      return screenDimension.width * aspectRatio * (scale || 1);
    }
    const getWidth = () => {
      if (fullScreen) return screenDimension.width;
      return screenDimension.width * (scale || 1);
    }


    return (
      <View {...props} style={[styles.zoomedContainer, { height: getHeight(), width: getWidth(), alignContent: "center", justifyContent: "center", alignItems: "center", backgroundColor: Colors.backgroundDark, borderRadius: 8 }, props.style]}>
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
                  viewBox={`0 0 1000 ${1000 / (imageWidth / imageHeight)}`}
                  style={[{ position: "relative", width: imageWidth, height: imageHeight }]}>
                  {
                    configuredHolds?.sort(SortHolds).map(hold => (
                      <SVGHold
                        key={hold.id}
                        hold={hold}
                        transparant
                        onHoldClick={onConfiguredHoldClick}
                        zoomableViewRef={zoomableViewRef}
                        disabeMovment={disableMovment}
                      />
                    ))
                  }
                  {
                    [...existingHolds].sort(SortHolds).map((hold) => (
                      <SVGHold
                        key={hold.id}
                        hold={hold}
                        onHoldClick={onHoldClick}
                        zoomableViewRef={zoomableViewRef}
                        disabeMovment={disableMovment}
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
  }
});
