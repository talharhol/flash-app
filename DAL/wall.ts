import { ImageSourcePropType } from "react-native";
import uuid from "react-native-uuid";
import { IDAL } from "./IDAL";
export class Wall {
    id: string;
    name: string;
    gym: string;
    image: ImageSourcePropType;
    angle?: number;
    configuredHolds: {svgPath: string; id: string}[];
    isPublic: boolean;
    private dal?: IDAL;
    constructor({ id, name, gym, image, angle, configuredHolds, isPublic, dal }: {id?: string, name: string, gym: string, image: ImageSourcePropType, angle?: number, configuredHolds?: {svgPath: string; id: string}[], isPublic?: boolean, dal?: IDAL}) {
        this.id = id || uuid.v4() as string;
        this.name = name;
        this.gym = gym;
        this.image = image;
        this.angle = angle;
        this.configuredHolds = configuredHolds || [];
        this.isPublic = isPublic || false;
        this.dal = dal;
    }

    setDAL = (dal: IDAL) => {
        this.dal = dal;
    }

    get fullName() {
        return `${this.name}@${this.gym}`
    }
};