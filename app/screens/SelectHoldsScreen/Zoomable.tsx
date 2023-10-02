import { useRef, useState } from "react";
import { Animated, PanResponder } from "react-native";
import { withAnchorPoint } from "react-native-anchor-point";
import { calcCenter, calcDistance, calcOffsetByZoom, maxOffset } from "./MathHelpers";
const Zoomable: React.FC<React.PropsWithChildren<{ dimensions: { width: number, height: number; }; }>> = ({ children, dimensions }) => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [isZooming, setIsZooming] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [left, setLeft] = useState(0);
    const [top, setTop] = useState(0);
    const [offsetLeft, setOffsetLeft] = useState(0);
    const [offsetTop, setOffsetTop] = useState(0);
    const [initialXSVG, setInitialXSVG] = useState(0);
    const [initialYSVG, setInitialYSVG] = useState(0);
    const [points, setPoints] = useState<{ x: number, y: number; }[]>([]);
    const pan = useRef(new Animated.ValueXY()).current;
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, { dx, dy }) => {
                return Math.abs(dx) > 2 || Math.abs(dy) > 2;
            },
            onPanResponderGrant: (evt) => {
                if (isDrawing) {
                    setInitialXSVG(evt.nativeEvent.locationX);
                    setInitialYSVG(evt.nativeEvent.locationY);
                    setPoints(points => points.concat({
                        x: evt.nativeEvent.locationX,
                        y: evt.nativeEvent.locationY,
                    }));
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
        })
    ).current;
    return (
        <Animated.View style={
            withAnchorPoint(
                {
                    transform: [
                        { scale: zoom },
                        {
                            translateX:
                                (left + offsetLeft) /
                                zoom,
                        },
                        {
                            translateY:
                                (top + offsetTop) /
                                zoom,
                        },
                    ],
                },
                { x: 0, y: 0 },
                {
                    width: dimensions.width,
                    height: dimensions.height,
                }
            )
        } {...panResponder.panHandlers}>
            {children}
        </Animated.View>
    );
    
    function processPinch(x1, y1, x2, y2) {
        let distance = calcDistance(x1, y1, x2, y2);
        let center = calcCenter(x1, y1, x2, y2);

        if (!isZooming) {
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

    };