import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';

import ThemedView from '@/components/general/ThemedView';
import { Colors } from '@/constants/Colors';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_HEIGHT = 250;

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

const ParallaxScrollView: React.FC<React.ComponentProps<typeof ThemedView> & {
  headerImage: React.ReactNode,
  headerBackgroundColor: { light: string, dark: string },
  padding?: number;
  gap?: number;
}> = ({
  children,
  headerImage,
  headerBackgroundColor,
  padding,
  gap
}) => {
    const colorScheme = 'dark';
    const insets = useSafeAreaInsets();
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const scrollOffset = useScrollViewOffset(scrollRef);

    const headerAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateY: interpolate(
              scrollOffset.value,
              [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
              [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
            ),
          },
          {
            scale: interpolate(scrollOffset.value, [-HEADER_HEIGHT, 0, HEADER_HEIGHT], [2, 1, 1]),
          },
        ],
      };
    });

    return (
      <ThemedView style={styles.container}>
        <Animated.ScrollView ref={scrollRef} scrollEventThrottle={16}>
          <Animated.View
            style={[
              styles.header,
              { backgroundColor: Colors.backgroundDark, paddingTop: insets.top },
              headerAnimatedStyle,
            ]}>
            {headerImage}
          </Animated.View>
          <ThemedView style={[styles.content, padding !== undefined ? { padding: padding } : {}, gap !== undefined ? { gap: gap } : {}]}>
            {children}
          </ThemedView>
        </Animated.ScrollView>
      </ThemedView>
    );
  }

export default ParallaxScrollView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLite
  },
  header: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: "8%",
    gap: 16,
    overflow: 'hidden',
    backgroundColor: "transparent"
  },
});
