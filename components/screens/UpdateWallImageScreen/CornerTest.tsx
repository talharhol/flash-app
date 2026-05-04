import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { 
  Canvas, 
  useImage, 
  ImageShader, 
  Vertices, 
  vec, 
  Circle,
  Group
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useDerivedValue } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Initial positions for the corners of the "new" image
const IMG_SIZE = 250;
const START_X = 50;
const START_Y = 100;

const ImageWarpMatch = ({ oldImgUri, newImgUri }) => {
  const oldImg = useImage(oldImgUri);
  const newImg = useImage(newImgUri);

  // Shared values for the 4 corners
  const tl = useSharedValue({ x: START_X, y: START_Y });
  const tr = useSharedValue({ x: START_X + IMG_SIZE, y: START_Y });
  const br = useSharedValue({ x: START_X + IMG_SIZE, y: START_Y + IMG_SIZE });
  const bl = useSharedValue({ x: START_X, y: START_Y + IMG_SIZE });

  // Create gesture handlers for each corner
  const createGesture = (point) => 
    Gesture.Pan().onChange((e) => {
      point.value = { x: point.value.x + e.changeX, y: point.value.y + e.changeY };
    });

  // Map the texture coordinates to the image dimensions
  const vertices = useDerivedValue(() => {
    return [
      vec(tl.value.x, tl.value.y),
      vec(tr.value.x, tr.value.y),
      vec(br.value.x, br.value.y),
      vec(bl.value.x, bl.value.y),
    ];
  });

  // Texture mapping: maps the corners of the actual image file to the vertices
  const textureCoords = useDerivedValue(() => {
    if (!newImg) return [];
    return [
      vec(0, 0),
      vec(newImg.width(), 0),
      vec(newImg.width(), newImg.height()),
      vec(0, newImg.height()),
    ];
  });

  if (!oldImg || !newImg) return null;

  return (
    <GestureHandlerRootView style={styles.container}>
      <Canvas style={styles.canvas}>
        {/* The "Old" Image: Serving as the reference background */}
        <Group opacity={0.5}>
           <ImageShader image={oldImg} fit="cover" rect={{ x: 0, y: 0, width, height }} />
           <Circle cx={0} cy={0} r={0} /> {/* Placeholder to trigger render */}
        </Group>

        {/* The "New" Image: Warped via Vertices */}
        <Vertices
          vertices={vertices}
          textures={textureCoords}
          indices={[0, 1, 2, 0, 2, 3]} // Two triangles forming the quad
        >
          <ImageShader image={newImg} fit="fill" />
        </Vertices>

        {/* Visual Handles */}
        <Circle c={tl} r={15} color="white" />
        <Circle c={tr} r={15} color="white" />
        <Circle c={br} r={15} color="white" />
        <Circle c={bl} r={15} color="white" />
      </Canvas>

      {/* Invisible Gesture Overlays */}
      <GestureDetector gesture={createGesture(tl)}>
        <Animated.View style={[styles.handle, { top: tl.value.y, left: tl.value.x }]} />
      </GestureDetector>
      <GestureDetector gesture={createGesture(tr)}>
        <Animated.View style={[styles.handle, { top: tr.value.y, left: tr.value.x }]} />
      </GestureDetector>
      <GestureDetector gesture={createGesture(br)}>
        <Animated.View style={[styles.handle, { top: br.value.y, left: br.value.x }]} />
      </GestureDetector>
      <GestureDetector gesture={createGesture(bl)}>
        <Animated.View style={[styles.handle, { top: bl.value.y, left: bl.value.x }]} />
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  canvas: { flex: 1, backgroundColor: '#1a1a1a' },
  handle: {
    position: 'absolute',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
});

export default ImageWarpMatch;