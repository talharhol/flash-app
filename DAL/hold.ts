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

    get color() {
        return this.type.color
    }
};

export interface HoldInterface {
    id: string;
    svgPath: string;
    color?: string;
    length?: number;
}

export const SortHolds = (hold1: HoldInterface, hold2: HoldInterface) => {
    hold1.length = hold1.length || new svgPathProperties(hold1.svgPath).getTotalLength()
    hold2.length = hold2.length || new svgPathProperties(hold2.svgPath).getTotalLength()
    if (hold1.length > hold2.length)
        return -1
    if (hold1.length === hold2.length)
        return 0
    return 1
}