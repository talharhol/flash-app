import { HoldInterface } from "@/DAL/hold";
import React, { useMemo } from "react";
import { Path, Text, SkPath, matchFont } from "@shopify/react-native-skia";
import { Platform } from "react-native";

const FONT_SIZE = 30;

const SkiaHold: React.FC<{
  hold: HoldInterface;
  path: SkPath;
  transparent?: boolean;
}> = React.memo(({ hold, path, transparent }) => {
  const labelFont = useMemo(() => matchFont({
    fontFamily: Platform.OS === "ios" ? "Helvetica" : "sans-serif",
    fontSize: FONT_SIZE,
  }), []);

  const labelPoint = useMemo(() => path.getPoint(0), [path]);

  return (
    <>
      <Path
        path={path}
        color={transparent ? "transparent" : hold.color}
        style="stroke"
        strokeWidth={2}
        strokeJoin="round"
        strokeCap="round"
      />
      {hold.label && labelFont ? (
        <Text
          x={labelPoint.x}
          y={labelPoint.y + FONT_SIZE}
          text={`  ${hold.label}  `}
          font={labelFont}
          color="white"
        />
      ) : null}
    </>
  );
});

export default SkiaHold;
