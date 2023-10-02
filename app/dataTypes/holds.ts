import uuid from "react-native-uuid";
export enum HoldTypes {
    start,
    feet,
    top,
};
const holdTypeToHoldColor: Record<HoldTypes, string> = {
    [HoldTypes.feet]: "#FFC90C",
    [HoldTypes.start]: "#19F02F",
    [HoldTypes.top]: "#FF0C0C",
};
const holdTypeToTitle: Record<HoldTypes, string> = {
    [HoldTypes.feet]: "Feet",
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
