import { Hold } from "@/dataTypes/hold";
import React, { useState } from "react";
import { PanResponder } from "react-native";
import { Path } from "react-native-svg";

const SVGHold: React.FC<{ 
    hold: {id: string, svgPath: string, color?: string}, 
    onHoldClick?: (id: string) => void,
    zoomableViewRef?: any,
}> = ({ hold, onHoldClick, zoomableViewRef }) => {
    
  const [firstPos, setFirstPos] = useState<{x: number, y: number} | null>(null);
  const [firstPosPage, setFirstPosPage] = useState<{x: number, y: number} | null>(null);
    return <Path
    key={hold.id}
    d={hold.svgPath}
    stroke={hold.color}
    fill='transparent'
    strokeWidth={2}
    strokeLinejoin='round'
    strokeLinecap='round'
    // onPress={() => onHoldClick?.(hold.id)}
    onStartShouldSetResponder={() => true}
    onMoveShouldSetResponder={() => true}
    onResponderMove={e =>  {
      if (firstPos === null) {
        setFirstPos({x: e.nativeEvent.locationX, y: e.nativeEvent.locationY});
        setFirstPosPage({x: e.nativeEvent.pageX, y: e.nativeEvent.pageY});
        return;
      }
      zoomableViewRef?.current!.moveBy(firstPos.x - e.nativeEvent.locationX, firstPos.y - e.nativeEvent.locationY);
    }}
    onResponderRelease={(e) => {
      if (firstPosPage === null) return;
      if (Math.abs(e.nativeEvent.pageX - firstPosPage.x) < 4 && Math.abs(e.nativeEvent.pageY - firstPosPage.y) < 4){
        onHoldClick?.(hold.id);
      }
      setFirstPos(null);
    } }
  />
}
export default SVGHold;