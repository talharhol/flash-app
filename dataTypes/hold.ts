import uuid from "react-native-uuid";
import { svgPathProperties } from "svg-path-properties";
export enum HoldTypes {
    route,
    start,
    feet,
    top,
};
const holdTypeToHoldColor: Record<HoldTypes, string> = {
    [HoldTypes.feet]: "#FFC90C",
    [HoldTypes.route]: "blue",
    [HoldTypes.start]: "#19F02F",
    [HoldTypes.top]: "#FF0C0C",
};
const holdTypeToTitle: Record<HoldTypes, string> = {
    [HoldTypes.feet]: "Feet",
    [HoldTypes.route]: "Route",
    [HoldTypes.start]: "Start",
    [HoldTypes.top]: "Top",
};
export class HoldType {
    type: HoldTypes;
    constructor(type: HoldTypes) {
        this.type = type;
    }
    get color() {
        return holdTypeToHoldColor[this.type];
    }
    get title() {
        return holdTypeToTitle[this.type];
    }
}

export class Hold {
    id: string;
    type: HoldType;
    svgPath: string;
    constructor({ id, type, svgPath }: { type: HoldType, svgPath: string, id?: string; }) {
        this.id = id || uuid.v4() as string;
        this.type = type;
        this.svgPath = svgPath;
    }
};

interface SortHold {
    svgPath: string;
}

export const SortHolds = (hold1: SortHold, hold2: SortHold) => {
    let len1 = new svgPathProperties(hold1.svgPath).getTotalLength()
    let len2 = new svgPathProperties(hold2.svgPath).getTotalLength()
    if (len1 > len2)
        return -1
    if (len1 === len2)
        return 0
    return 1
}