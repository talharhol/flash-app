import uuid from "react-native-uuid";
import { svgPathProperties } from "svg-path-properties";
export enum HoldTypes {
    route,
    start,
    feet,
    top,
};
export const holdTypeToHoldColor: Record<HoldTypes, string> = {
    [HoldTypes.feet]: "#FFC90C",
    [HoldTypes.route]: "blue",
    [HoldTypes.start]: "#19F02F",
    [HoldTypes.top]: "#FF0C0C",
};
export const holdTypeToTitle: Record<HoldTypes, string> = {
    [HoldTypes.feet]: "Feet",
    [HoldTypes.route]: "Route",
    [HoldTypes.start]: "Start",
    [HoldTypes.top]: "Top",
};

const generateRainbowColors = (steps: number) => {
    return Array.from({ length: steps }, (_, i) => {
        const hue = (i / (steps - 1)) * 360; // Distributes hue from 240° to 240°
        return `hsl(${(240 + hue) % 360}, 100%, 50%)`; // Full saturation, medium lightness
    });
};

const colors = generateRainbowColors(30);

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
    color: string;
    svgPath: string;
    length: number;
    label: string
    constructor({ id, svgPath, color, length, label }: { svgPath: string, id?: string; color?: string, length?: number, label?: string }) {
        this.id = id ?? uuid.v4() as string;
        this.color = color ?? holdTypeToHoldColor[HoldTypes.route];
        this.svgPath = svgPath;
        this.length = length ?? new svgPathProperties(svgPath).getTotalLength();
        this.label = label ?? '';
    }
};

export interface HoldInterface {
    id: string;
    svgPath: string;
    color?: string;
    length?: number;
    label: string;
}

export const SortHolds = (hold1: HoldInterface, hold2: HoldInterface) => {
    hold1.length = hold1.length ?? new svgPathProperties(hold1.svgPath).getTotalLength()
    hold2.length = hold2.length ?? new svgPathProperties(hold2.svgPath).getTotalLength()
    if (hold1.length > hold2.length)
        return -1
    if (hold1.length === hold2.length)
        return 0
    return 1
}

export const ConvertToCycle = (holds: HoldInterface[]): HoldInterface[] => {
    let holdCount = 0;
    let newHolds: HoldInterface[] = [];
    holds.forEach(hold => {
        if (hold.color === holdTypeToHoldColor[HoldTypes.feet]) {
            newHolds.push(hold);
            return;
        }
        newHolds.push({
            id: hold.id,
            svgPath: hold.svgPath,
            color: colors[holdCount % 30],
            length: hold.length,
            label: (holdCount + 1).toString()
        });
        holdCount = holdCount + 1;
    });
    return newHolds;
}