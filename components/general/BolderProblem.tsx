import { ConvertToCycle, Hold, HoldInterface, HoldType, SortHolds, holdTypeToHoldColor } from "@/DAL/hold";
import { imageSize } from "../general/SizeContext";
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  ImageSourcePropType,
  ViewProps,
} from "react-native";
import { Canvas, Group, Skia } from "@shopify/react-native-skia";
import Zoomable from "./Zoomable";
import DrawHold from "./DrawHold";
import SkiaHold from "./SkiaHold";
import { captureRef } from "react-native-view-shot";
import * as MediaLibrary from 'expo-media-library';
import { Colors } from "@/constants/Colors";
import { useHoldDetection } from "@/hooks/useHoldDetection";

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
  useHoldDetection?: boolean;
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
    { wallImage, configuredHolds, existingHolds, drawingHoldType, disableMovment, scale, fullScreen, bindToImage, aspectRatio, cycle, useHoldDetection: enableHoldDetection, onDrawHoldFinish, onDrawHoldCancel, onConfiguredHoldClick, onHoldClick, ...props }
    , ref
  ) => {
    const screenDimension = useWindowDimensions();
    aspectRatio = aspectRatio ?? (fullScreen ? screenDimension.height / screenDimension.width : 1.5);
    const [imageHeight, setImageHeight] = useState(0);
    const [imageWidth, setImageWidth] = useState(screenDimension.width * (scale || 1));
    const zoomableViewRef = useRef<React.ElementRef<typeof Zoomable>>(null);
    const problemContainerRef = useRef(null);
    const tapStartRef = useRef<{ x: number; y: number } | null>(null);
    const isDraggingRef = useRef(false);
    existingHolds = existingHolds ?? [];
    if (cycle) {
      existingHolds = ConvertToCycle(existingHolds);
    }


    const [imageUri, setImageUri] = useState<string | null>(null);
    const { detectHold, isEncoding, isReady } = useHoldDetection(imageUri, !!enableHoldDetection);

  useEffect(() => {
      const uri = Image.resolveAssetSource(wallImage).uri;
      setImageUri(uri);
      Image.getSize(uri, (width, height) => {
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
    }, [wallImage, aspectRatio]);

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

    const pathScale = imageWidth / 1000;

    const sortedExistingHolds = useMemo(() =>
      [...existingHolds].sort(SortHolds).map(hold => ({
        hold,
        path: Skia.Path.MakeFromSVGString(hold.svgPath) ?? Skia.Path.Make(),
      })),
      [existingHolds]
    );

    const sortedConfiguredHolds = useMemo(() =>
      [...(configuredHolds ?? [])].sort(SortHolds).map(hold => ({
        hold,
        path: Skia.Path.MakeFromSVGString(hold.svgPath) ?? Skia.Path.Make(),
      })),
      [configuredHolds]
    );

    const handleTap = (canvasX: number, canvasY: number) => {
      const pathX = canvasX / pathScale;
      const pathY = canvasY / pathScale;
      for (const { hold, path } of sortedExistingHolds) {
        if (path.contains(pathX, pathY)) {
          onHoldClick?.(hold.id);
          return;
        }
      }
      for (const { hold, path } of sortedConfiguredHolds) {
        if (path.contains(pathX, pathY)) {
          onConfiguredHoldClick?.(hold.id);
          return;
        }
      }
    };


    return (
      <View {...props} style={[styles.zoomedContainer, { height: getHeight(), width: getWidth(), alignContent: "center", justifyContent: "center", alignItems: "center", backgroundColor: Colors.backgroundDark, borderRadius: 8 }, props.style]}>
        {enableHoldDetection && !isReady && (
          <View style={styles.modelLoadingBanner}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.modelLoadingText}>
              {isEncoding ? 'Preparing wall...' : 'Loading model...'}
            </Text>
          </View>
        )}
        <imageSize.Provider value={{ width: imageWidth, height: imageHeight }}>
          <Zoomable
            key={JSON.stringify(wallImage)}
            ref={zoomableViewRef}
            disableMovement={!!disableMovment || !!drawingHoldType} maxZoom={20} minZoom={0.8}>
            <View style={[styles.zoomedContent, { height: getHeight(), width: getWidth(), alignContent: "center", justifyContent: "center", alignItems: "center" }]}>
              <View ref={problemContainerRef} style={{ width: imageWidth, height: imageHeight }} collapsable={false}>
                {
                  !!drawingHoldType &&
                  <DrawHold
                    onCancel={onDrawHoldCancel}
                    currentHoldType={drawingHoldType}
                    onFinishedDrawingShape={onCreatedHold}
                    detectHold={enableHoldDetection ? detectHold : undefined}
                    isEncoding={isEncoding}
                    isReady={isReady}
                  />
                }
                <Canvas
                  style={{ position: "absolute", top: 0, left: 0, zIndex: 1, width: imageWidth, height: imageHeight }}
                  onTouchStart={(e) => {
                    tapStartRef.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY };
                    isDraggingRef.current = false;
                  }}
                  onTouchMove={(e) => {
                    if (!tapStartRef.current) return;
                    const { locationX: x, locationY: y } = e.nativeEvent;
                    const { x: sx, y: sy } = tapStartRef.current;
                    if (Math.abs(x - sx) > 4 || Math.abs(y - sy) > 4) {
                      isDraggingRef.current = true;
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (!tapStartRef.current) return;
                    const { locationX: x, locationY: y } = e.nativeEvent;
                    const { x: sx, y: sy } = tapStartRef.current;
                    tapStartRef.current = null;
                    if (!isDraggingRef.current && Math.abs(x - sx) < 4 && Math.abs(y - sy) < 4) {
                      handleTap(x, y);
                    }
                  }}
                >
                  <Group transform={[{ scale: pathScale }]}>
                    {sortedConfiguredHolds.map(({ hold, path }) => (
                      <SkiaHold
                        key={hold.id}
                        hold={hold}
                        path={path}
                        transparent
                      />
                    ))}
                    {sortedExistingHolds.map(({ hold, path }) => (
                      <SkiaHold
                        key={hold.id}
                        hold={hold}
                        path={path}
                      />
                    ))}
                  </Group>
                </Canvas>
                <Image style={[styles.problemImage, { width: imageWidth, height: imageHeight }]} source={wallImage} />
              </View>
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
  modelLoadingBanner: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modelLoadingText: {
    color: '#fff',
    fontSize: 12,
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
