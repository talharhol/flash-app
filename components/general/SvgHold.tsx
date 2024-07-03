import { HoldInterface } from "@/dataTypes/hold";
import React, { useContext, useState } from "react";
import { Path } from "react-native-svg";
import { zoomSize } from "./SizeContext";
import Zoomable from "./Zoomable";
import { svgZoom } from "@/constants/consts";

const SVGHold: React.FC<{
  hold: HoldInterface,
  onHoldClick?: (id: string) => void,
  zoomableViewRef?: React.RefObject<React.ElementRef<typeof Zoomable>>,
}> = ({ hold, onHoldClick, zoomableViewRef }) => {

  const [firstPos, setFirstPos] = useState<{ x: number, y: number } | null>(null);
  const [firstPosPage, setFirstPosPage] = useState<{ x: number, y: number } | null>(null);
  const zoom = useContext(zoomSize);
  return (
    <Path
      key={hold.id}
      d={hold.svgPath}
      stroke={hold.color}
      fill='transparent'
      strokeWidth={2 * svgZoom / (Math.max(1, zoom / 2))}
      strokeLinejoin='round'
      strokeLinecap='round'
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderMove={e => {
        if (firstPos === null) {
          setFirstPos({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY });
          setFirstPosPage({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
          return;
        }
        zoomableViewRef?.current!.moveBy(firstPos.x - e.nativeEvent.locationX, firstPos.y - e.nativeEvent.locationY);
      }}
      onResponderRelease={(e) => {
        if (firstPosPage === null) return;
        if (Math.abs(e.nativeEvent.pageX - firstPosPage.x) < 4 && Math.abs(e.nativeEvent.pageY - firstPosPage.y) < 4) {
          onHoldClick?.(hold.id);
        }
        setFirstPos(null);
      }}
    />
  )
}
export default SVGHold;