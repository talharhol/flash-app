import React, { useState } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { SwipeRow } from 'react-native-swipe-list-view';

const SwipeableComponent: React.FC<React.ComponentProps<typeof SwipeRow> & {
    frontComponent: () => React.JSX.Element,
    hiddenComponent: () => React.JSX.Element,
}> = ({
    frontComponent, hiddenComponent,...props
}) => {
 
  return (
    <SwipeRow {...props}>
        {hiddenComponent()}
        {frontComponent()}
    </SwipeRow>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    width: 300,
    height: 200,
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  extraContent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 300,
    height: 200,
    backgroundColor: '#d3d3d3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
});

export default SwipeableComponent;
