import { HoldInterface } from "@/DAL/hold";
import React, { useContext, useState } from "react";
import { Path } from "react-native-svg";
import { zoomSize } from "./SizeContext";
import Zoomable from "./Zoomable";

const SVGHold: React.FC<{
  hold: HoldInterface,
  transparant?: boolean
  onHoldClick?: (id: string) => void,
  zoomableViewRef?: React.RefObject<React.ElementRef<typeof Zoomable>>,
  disabeMovment?: boolean
}> = ({ hold, onHoldClick, zoomableViewRef, transparant, disabeMovment }) => {
  const shouldSetResponder = !disabeMovment;
  const [firstPos, setFirstPos] = useState<{ x: number, y: number }>({x: 0, y: 0});
  const [firstPosPage, setFirstPosPage] = useState<{ x: number, y: number }>({x: 0, y: 0});
  const zoom = useContext(zoomSize);
  return (
    <Path
      key={hold.id}
      d={hold.svgPath}
      stroke={transparant ? undefined : hold.color}
      fill='transparent'
      strokeWidth={2 / (Math.max(1, zoom / 4))}
      strokeLinejoin='round'
      strokeLinecap='round'
      onStartShouldSetResponder={() => shouldSetResponder}
      onMoveShouldSetResponder={() => shouldSetResponder}
      onResponderStart={e => {
        setFirstPos({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
        setFirstPosPage({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
      }}
      onResponderMove={e => {
        zoomableViewRef?.current?.moveBy(firstPos.x - e.nativeEvent.locationX, firstPos.y - e.nativeEvent.locationY);
      }}
      onResponderRelease={(e) => {
        if (Math.abs(e.nativeEvent.pageX - firstPosPage.x) < 4 && Math.abs(e.nativeEvent.pageY - firstPosPage.y) < 4) {
          onHoldClick?.(hold.id);
        }
      }}
    />
  )
}
export default SVGHold;