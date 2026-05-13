import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HoldType, HoldTypes } from '@/DAL/hold';

const MAIN_SIZE = 64;
const DOT_SIZE = 40;
const ORBIT_RADIUS = 86;
const MARGIN = 20;
const MAIN_RADIUS = MAIN_SIZE / 2;
const DOT_RADIUS = DOT_SIZE / 2;
const COLLAPSED_DOT_SIZE = 16;
const COLLAPSED_SCALE = COLLAPSED_DOT_SIZE / DOT_SIZE;
// distance from main center to collapsed dot center — just outside main circle edge
const COLLAPSED_ORBIT = MAIN_RADIUS + 6 + COLLAPSED_DOT_SIZE / 2;

const ANGLES_BY_COUNT: Record<number, number[]> = {
  1: [135],
  2: [90, 180],
  3: [90, 135, 180],
};

function getSatellitePos(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    right: MARGIN + MAIN_RADIUS - ORBIT_RADIUS * Math.cos(rad) - DOT_RADIUS,
    bottom: MARGIN + MAIN_RADIUS + ORBIT_RADIUS * Math.sin(rad) - DOT_RADIUS,
    // translation to move dot center to COLLAPSED_ORBIT distance from main center
    collapsedTX: -(ORBIT_RADIUS - COLLAPSED_ORBIT) * Math.cos(rad),
    collapsedTY: (ORBIT_RADIUS - COLLAPSED_ORBIT) * Math.sin(rad),
  };
}

interface Props {
  holdTypes: HoldType[];
  selected: HoldType;
  onSelect: (type: HoldType) => void;
}

const HoldTypeSelector: React.FC<Props> = ({ holdTypes, selected, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const mainScale = useRef(new Animated.Value(1)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const dotPressScales = useRef<Partial<Record<HoldTypes, Animated.Value>>>({});
  const isFirst = useRef(true);

  holdTypes.forEach(ht => {
    if (!dotPressScales.current[ht.type]) {
      dotPressScales.current[ht.type] = new Animated.Value(1);
    }
  });

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: true,
      tension: 130,
      friction: 8,
    }).start();
  }, [isExpanded]);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    mainScale.setValue(0.65);
    Animated.spring(mainScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 7,
    }).start();
  }, [selected.type]);

  const satellites = holdTypes.filter(ht => ht.type !== selected.type);
  const angles = ANGLES_BY_COUNT[satellites.length] ?? [];

  const dotExpandScale = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED_SCALE, 1],
  });

  const handleSelect = (type: HoldType) => {
    const pressScale = dotPressScales.current[type.type];
    if (pressScale) {
      Animated.sequence([
        Animated.spring(pressScale, {
          toValue: MAIN_SIZE / DOT_SIZE,
          useNativeDriver: true,
          tension: 200,
          friction: 20,
        }),
        Animated.timing(pressScale, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start(() => pressScale.setValue(1));
    }
    setIsExpanded(false);
    onSelect(type);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.mainTouchable}
        onPress={() => setIsExpanded(v => !v)}
        activeOpacity={0.85}
      >
        <Animated.View
          style={[styles.main, { backgroundColor: selected.color, transform: [{ scale: mainScale }] }]}
        >
          <Text style={styles.mainLabel}>{selected.title}</Text>
        </Animated.View>
      </TouchableOpacity>

      {satellites.map((type, i) => {
        const pos = getSatellitePos(angles[i]);
        const pressScale = dotPressScales.current[type.type] ?? new Animated.Value(1);
        const combinedScale = Animated.multiply(pressScale, dotExpandScale);
        const translateX = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [pos.collapsedTX, 0] });
        const translateY = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [pos.collapsedTY, 0] });
        return (
          <Animated.View
            key={type.type}
            style={[
              styles.dot,
              { backgroundColor: type.color, right: pos.right, bottom: pos.bottom },
              { transform: [{ translateX }, { translateY }, { scale: combinedScale }] },
            ]}
          >
            <TouchableOpacity style={styles.fill} onPress={() => handleSelect(type)}>
              <Text style={styles.dotLabel}>{type.title[0]}</Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_RADIUS,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  fill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: DOT_RADIUS,
  },
  dotLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  mainTouchable: {
    position: 'absolute',
    right: MARGIN,
    bottom: MARGIN,
    width: MAIN_SIZE,
    height: MAIN_SIZE,
    borderRadius: MAIN_RADIUS,
  },
  main: {
    width: MAIN_SIZE,
    height: MAIN_SIZE,
    borderRadius: MAIN_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  mainLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default HoldTypeSelector;
