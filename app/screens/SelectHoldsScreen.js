import {
  PanResponder,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  View,
  StyleSheet,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import Svg, { Polygon, Polyline } from "react-native-svg";
import { withAnchorPoint } from "react-native-anchor-point";
import { AntDesign } from "@expo/vector-icons";
import { Slider } from "@miblanchard/react-native-slider";
import React, { Component, useState } from "react";

function calcDistance(x1, y1, x2, y2) {
  let dx = Math.abs(x1 - x2);
  let dy = Math.abs(y1 - y2);
  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}

function calcCenter(x1, y1, x2, y2) {
  function middle(p1, p2) {
    return p1 > p2 ? p1 - (p1 - p2) / 2 : p2 - (p2 - p1) / 2;
  }

  return {
    x: middle(x1, x2),
    y: middle(y1, y2),
  };
}

function maxOffset(offset, windowDimension, imageDimension) {
  let max = windowDimension - imageDimension;
  if (max >= 0) {
    return 0;
  }
  return offset < max ? max : offset;
}

function calcOffsetByZoom(width, height, imageWidth, imageHeight, zoom) {
  let xDiff = imageWidth * zoom - width;
  let yDiff = imageHeight * zoom - height;
  return {
    left: -xDiff / 2,
    top: -yDiff / 2,
  };
}

class SelectHoldsScreen extends Component {
  state = {
    zoom: 1,
    minZoom: null,
    layoutKnown: false,
    isZooming: false,
    isMoving: false,
    initialDistance: null,
    initialX: null,
    initialY: null,
    offsetTop: 0,
    offsetLeft: 0,
    initialTop: 0,
    initialLeft: 0,
    initialTopWithoutZoom: 0,
    initialLeftWithoutZoom: 0,
    initialZoom: 1,
    top: 0,
    left: 0,
    editedHold: null,
    modalVisible: false,
    shouldAddHold: false,
    holdColor: null,
    holds: [],
    holdTopOffset: 0,
    holdLeftOffset: 0,
    isDrawing: false,
    svgHolds: [],
    points: [],
    initialXSVG: 0,
    initialYSVG: 0,
    scaleOriginX: 0,
    scaleOriginY: 0,
  };
  constructor(props) {
    super(props);

    this.addHold = this.addHold.bind(this);
    this._onLayout = this._onLayout.bind(this);
    this.generateHolds = this.generateHolds.bind(this);
    this.discardHold = this.discardHold.bind(this);
    this.editRadius = this.editRadius.bind(this);
    this.enableAddHold = this.enableAddHold.bind(this);
    this.getImageDimentions = this.getImageDimentions.bind(this);
    this.saveHold = this.saveHold.bind(this);

    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, { dx, dy }) => {
        return Math.abs(dx) > 2 || Math.abs(dy) > 2;
      },
      onPanResponderGrant: (evt, gestureState) => {
        if (this.state.isDrawing) {
          this.setState({
            initialXSVG: evt.nativeEvent.locationX,
            initialYSVG: evt.nativeEvent.locationY,
            points: this.state.points.concat({
              X: evt.nativeEvent.locationX,
              Y: evt.nativeEvent.locationY,
            }),
          });
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        let touches = evt.nativeEvent.touches;
        if (touches.length == 2) {
          this.processPinch(
            touches[0].pageX,
            touches[0].pageY,
            touches[1].pageX,
            touches[1].pageY,
            gestureState
          );
        } else if (
          touches.length == 1 &&
          !this.state.isZooming &&
          this.state.editedHold === null &&
          !this.state.isDrawing
        ) {
          this.processTouch(touches[0].pageX, touches[0].pageY);
        } else if (
          touches.length == 1 &&
          !this.state.isZooming &&
          this.state.editedHold !== null &&
          !this.state.isDrawing
        ) {
          this.setState({
            holdTopOffset:
              gestureState.dy /
              (this.getImageDimentions().height * this.state.zoom),
            holdLeftOffset:
              gestureState.dx /
              (this.getImageDimentions().width * this.state.zoom),
          });
        } else if (
          touches.length == 1 &&
          !this.state.isZooming &&
          this.state.editedHold === null &&
          this.state.isDrawing
        ) {
          let point = this.state.points.slice(-1)[0];
          let newPoint = {
            X: this.state.initialXSVG + gestureState.dx / this.state.zoom,
            Y: this.state.initialYSVG + gestureState.dy / this.state.zoom,
          };
          if (
            Math.abs(point.X - newPoint.X) + Math.abs(point.Y - newPoint.Y) >
            4
          )
            this.setState({
              points: this.state.points.concat(newPoint),
            });
        }
      },

      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        let hold = null;
        if (this.state.editedHold !== null) {
          hold = { ...this.state.editedHold };
          hold.top += this.state.holdTopOffset;
          hold.left += this.state.holdLeftOffset;
        }
        this.setState({
          isZooming: false,
          isMoving: false,
          isDrawing: false,
          editedHold: hold,
          holdLeftOffset: 0,
          holdTopOffset: 0,
          svgHolds: this.state.svgHolds.concat({
            points: this.getPoints(),
            id: Math.random().toString(36).substring(2, 9),
          }),
          points: [],
          initialXSVG: 0,
          initialYSVG: 0,
        });
      },
      onPanResponderTerminate: (evt, gestureState) => { },
      onShouldBlockNativeResponder: (evt, gestureState) => true,
    });
    this.image = props.route.params.wall.image;
    this.imageData = Image.resolveAssetSource(this.image);
    this.imageToScreenRation =
      Dimensions.get("screen").width / this.imageData.width;
  }
  _onLayout(event) {
    let layout = event.nativeEvent.layout;

    if (
      layout.width === this.state.width &&
      layout.height === this.state.height
    ) {
      return;
    }

    let zoom = layout.width / this.getImageDimentions().width;

    let offsetTop =
      layout.height > this.getImageDimentions().height * zoom
        ? (layout.height - this.getImageDimentions().height * zoom) / 2
        : 0;

    this.setState({
      layoutKnown: true,
      width: layout.width,
      height: layout.height,
      zoom: zoom,
      offsetTop: offsetTop,
      minZoom: zoom,
    });
  }
  processPinch(x1, y1, x2, y2) {
    let distance = calcDistance(x1, y1, x2, y2);
    let center = calcCenter(x1, y1, x2, y2);

    if (!this.state.isZooming) {
      let offsetByZoom = calcOffsetByZoom(
        this.state.width,
        this.state.height,
        this.getImageDimentions().width,
        this.getImageDimentions().height,
        this.state.zoom
      );
      this.setState({
        isZooming: true,
        initialDistance: distance,
        initialX: center.x,
        initialY: center.y,
        initialTop: this.state.top,
        initialLeft: this.state.left,
        initialZoom: this.state.zoom,
        initialTopWithoutZoom: this.state.top - offsetByZoom.top,
        initialLeftWithoutZoom: this.state.left - offsetByZoom.left,
      });
    } else {
      let touchZoom = distance / this.state.initialDistance;
      let zoom = touchZoom * this.state.initialZoom > this.state.minZoom
        ? touchZoom * this.state.initialZoom
        : this.state.minZoom;

      let offsetByZoom = calcOffsetByZoom(
        this.state.width,
        this.state.height,
        this.getImageDimentions().width,
        this.getImageDimentions().height,
        zoom
      );
      let left = this.state.initialLeftWithoutZoom * touchZoom + offsetByZoom.left;
      let top = this.state.initialTopWithoutZoom * touchZoom + offsetByZoom.top;

      this.setState({
        zoom: zoom,
        left: 0,
        top: 0,
        left:
          left > 0
            ? 0
            : maxOffset(
              left,
              this.state.width,
              this.getImageDimentions().width * zoom
            ),
        top:
          top > 0
            ? 0
            : maxOffset(
              top,
              this.state.height,
              this.getImageDimentions().height * zoom
            ),
      });
    }
  }

  processTouch(x, y) {
    if (!this.state.isMoving) {
      this.setState({
        isMoving: true,
        initialX: x,
        initialY: y,
        initialTop: this.state.top,
        initialLeft: this.state.left,
      });
    } else {
      let left = this.state.initialLeft + x - this.state.initialX;
      let top = this.state.initialTop + y - this.state.initialY;

      this.setState({
        left:
          left > 0
            ? 0
            : maxOffset(
              left,
              this.state.width,
              this.getImageDimentions().width * this.state.zoom
            ),
        top:
          top > 0
            ? 0
            : maxOffset(
              top,
              this.state.height,
              this.getImageDimentions().height * this.state.zoom
            ),
      });
    }
  }

  getImageDimentions() {
    return {
      width: this.imageData.width * this.imageToScreenRation,
      height: this.imageData.height * this.imageToScreenRation,
    };
  }

  getPoints = () => {
    let str = "";
    this.state.points.forEach(
      (i) => (str += `${Math.ceil(i.X)},${Math.ceil(i.Y)} `)
    );
    return str;
  };

  addHold({ nativeEvent }) {
    if (!this.state.shouldAddHold) return;
    const hold = {
      id: Math.random().toString(36).substr(2, 9),
      top:
        nativeEvent.locationY /
        (this.getImageDimentions().height * this.state.zoom),
      left:
        nativeEvent.locationX /
        (this.getImageDimentions().width * this.state.zoom),
      radius: 0.1,
      color: this.state.holdColor,
    };
    this.setState({
      shouldAddHold: false,
      holds: [...this.state.holds.concat(hold)],
      editedHold: { ...hold },
    });
  }

  saveHold(hold) {
    hold.top += this.state.holdTopOffset;
    hold.left += this.state.holdLeftOffset;
    this.setState({
      holds: [
        ...this.state.holds.map((h) => {
          if (h.id === hold.id) return hold;
          return h;
        }),
      ],
      editedHold: null,
    });
  }
  discardHold(hold) {
    this.setState({
      holds: [...this.state.holds.filter((h) => h.id !== hold.id)],
      editedHold: null,
    });
  }
  enableAddHold(color) {
    this.setState({
      holdColor: color,
      shouldAddHold: true,
      modalVisible: false,
    });
  }
  editRadius(radius) {
    let hold = { ...this.state.editedHold };
    hold.radius = radius[0];
    this.setState({
      editedHold: { ...hold },
      holds: [
        ...this.state.holds.map((h) => {
          if (h.id === hold.id) return hold;
          return h;
        }),
      ],
    });
  }

  generateHolds(hold) {
    if ((this.state.editedHold && this.state.editedHold.id) === hold.id) {
      hold = { ...this.state.editedHold };
      hold.top += this.state.holdTopOffset;
      hold.left += this.state.holdLeftOffset;
    }
    const r = hold.radius * this.getImageDimentions().width * this.state.zoom;
    const x =
      hold.left * this.getImageDimentions().width * this.state.zoom - r / 2;
    const y =
      hold.top * this.getImageDimentions().height * this.state.zoom - r / 2;

    const locationData = {
      top: this.state.offsetTop + this.state.top + y,
      left: this.state.offsetLeft + this.state.left + x,
      width: r,
      height: r,
    };

    if ((this.state.editedHold && this.state.editedHold.id) === hold.id) {
      return (
        <Animated.View
          key={hold.id}
          style={[{ zIndex: 100, position: "absolute" }, locationData]}
        >
          <View
            style={{
              width: r,
              height: r,
              borderRadius: r,
              borderColor: hold.color,
              borderWidth: 5 * this.state.zoom,
            }}
          />
        </Animated.View>
      );
    }
    return (
      <TouchableOpacity
        onPress={() => this.setState({ editedHold: { ...hold } })}
        key={hold.id}
        style={[{ position: "absolute" }, locationData]}
      >
        <View
          style={{
            width: r,
            height: r,
            borderRadius: r,
            borderColor: hold.color,
            borderWidth: 3 * this.state.zoom,
          }}
        />
      </TouchableOpacity>
    );
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalVisible}
        >
          <TouchableOpacity
            onPress={() => this.setState({ modalVisible: false })}
          >
            <View style={styles.modalContainer}>
              <TouchableWithoutFeedback>
                <View style={styles.modal}>
                  <TouchableOpacity
                    onPress={() => this.enableAddHold("#1563FC")}
                    style={[styles.addHoldButton, { borderColor: "#1563FC" }]}
                  >
                    <Text style={[styles.addHoldText, { color: "#1563FC" }]}>
                      Hold
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => this.enableAddHold("#19F02F")}
                    style={[styles.addHoldButton, { borderColor: "#19F02F" }]}
                  >
                    <Text style={[styles.addHoldText, { color: "#19F02F" }]}>
                      Start
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => this.enableAddHold("#FF0C0C")}
                    style={[styles.addHoldButton, { borderColor: "#FF0C0C" }]}
                  >
                    <Text style={[styles.addHoldText, { color: "#FF0C0C" }]}>
                      Top
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => this.enableAddHold("#FFC90C")}
                    style={[styles.addHoldButton, { borderColor: "#FFC90C" }]}
                  >
                    <Text style={[styles.addHoldText, { color: "#FFC90C" }]}>
                      Feet
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableOpacity>
        </Modal>
        <View
          style={[
            styles.problemImageContainer,
            { overflow: "hidden" },
            this.getImageDimentions(),
          ]}
          {...this._panResponder.panHandlers}
          onLayout={this._onLayout}
        >
          <Svg
            width={"100%"}
            height={"100%"}
            viewBox={`0 0 ${this.getImageDimentions().width} ${this.getImageDimentions().height
              }`}
            style={[
              { position: "absolute", zIndex: 100 },
              {
                width: this.getImageDimentions().width,
                height: this.getImageDimentions().height,
              },
              withAnchorPoint(
                {
                  transform: [
                    { scale: this.state.zoom },
                    {
                      translateX:
                        (this.state.left + this.state.offsetLeft) /
                        this.state.zoom,
                    },
                    {
                      translateY:
                        (this.state.top + this.state.offsetTop) /
                        this.state.zoom,
                    },
                  ],
                },
                { x: 0, y: 0 },
                {
                  width: this.getImageDimentions().width,
                  height: this.getImageDimentions().height,
                }
              ),
            ]}
          >
            {this.state.isDrawing && (
              <Polyline
                points={this.getPoints()}
                fill="none"
                stroke="black"
                strokeWidth="3"
              />
            )}
            {this.state.svgHolds.map((hold) => {
              return (
                <Polygon
                  key={hold.id}
                  points={hold.points}
                  stroke="purple"
                  strokeWidth="3"
                />
              );
            })}
          </Svg>
          <TouchableWithoutFeedback onPress={this.addHold}>
            <Image
              resizeMode="contain"
              style={[
                styles.problemImage,
                {
                  width: this.getImageDimentions().width,
                  height: this.getImageDimentions().height,
                },
                withAnchorPoint(
                  {
                    transform: [
                      { scale: this.state.zoom },
                      {
                        translateX:
                          (this.state.left + this.state.offsetLeft) /
                          this.state.zoom,
                      },
                      {
                        translateY:
                          (this.state.top + this.state.offsetTop) /
                          this.state.zoom,
                      },
                    ],
                  },
                  { x: 0, y: 0 },
                  {
                    width: this.getImageDimentions().width,
                    height: this.getImageDimentions().height,
                  }
                ),
              ]}
              source={this.image}
            />
          </TouchableWithoutFeedback>

          {this.state.holds.map(this.generateHolds)}
        </View>
        {this.state.editedHold === null && (
          <View style={styles.problemHeader}>
            <AntDesign
              name="closecircleo"
              size={24}
              color="black"
              onPress={() => this.props.navigation.goBack()}
            />
            <Text
              onPress={() => this.setState({ modalVisible: true })}
              style={styles.addHoldTextTitle}
            >
              Add hold
            </Text>
            <Text
              style={styles.next}
              onPress={() =>
                this.props.navigation.replace("CreateProblemScreen", {
                  holds: this.state.holds,
                })
              }
            >
              Next
            </Text>
          </View>
        )}
        {this.state.editedHold !== null && (
          <View>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLable}>Edit hold's radius</Text>
              <Slider
                minimumTrackTintColor={"#1C9174"}
                thumbTintColor={"#1C9174"}
                value={this.state.editedHold.radius}
                onValueChange={(value) => this.editRadius(value)}
              />
            </View>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={() => this.saveHold({ ...this.state.editedHold })}
                style={styles.saveHoldButton}
              >
                <Text>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => this.discardHold({ ...this.state.editedHold })}
                style={styles.discardHoldButton}
              >
                <Text>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View>
          <TouchableOpacity onPress={() => this.setState({ isDrawing: true })}>
            <Text>Press to draw</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

export default SelectHoldsScreen;

const styles = StyleSheet.create({
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
  problemImage: {},
  problemData: {
    width: "100%",
  },
});
