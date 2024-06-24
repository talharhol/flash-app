import { ImageSourcePropType } from "react-native";
import uuid from "react-native-uuid";
export class Wall {
    id: string;
    name: string;
    gym: string;
    image: ImageSourcePropType;
    angle?: number;
    configuredHolds: {svgPath: string; id: string}[];
    constructor({ id, name, gym, image, angle, configuredHolds }: {id?: string, name: string, gym: string, image: ImageSourcePropType, angle?: number, configuredHolds?: {svgPath: string; id: string}[] }) {
        this.id = id || uuid.v4() as string;
        this.name = name;
        this.gym = gym;
        this.image = image;
        this.angle = angle;
        this.configuredHolds = configuredHolds || [];
    }
};