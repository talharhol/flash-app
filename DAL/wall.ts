import { ImageSourcePropType } from "react-native";
import uuid from "react-native-uuid";
export class Wall {
    id: string;
    name: string;
    gym: string;
    image: ImageSourcePropType;
    angle?: number;
    configuredHolds: {svgPath: string; id: string}[];
    isPublic: boolean;
    constructor({ id, name, gym, image, angle, configuredHolds, isPublic }: {id?: string, name: string, gym: string, image: ImageSourcePropType, angle?: number, configuredHolds?: {svgPath: string; id: string}[], isPublic?: boolean}) {
        this.id = id || uuid.v4() as string;
        this.name = name;
        this.gym = gym;
        this.image = image;
        this.angle = angle;
        this.configuredHolds = configuredHolds || [];
        this.isPublic = isPublic || false;
    }

    get fullName() {
        return `${this.name}@${this.gym}`
    }
};