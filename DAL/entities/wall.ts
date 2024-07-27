import { ImageSourcePropType } from "react-native";
import uuid from "react-native-uuid";
import { IDAL } from "../IDAL";
import { HoldInterface } from "../hold";
import { Entity, EntityProps } from "./BaseEntity";
import { UserTable, UserWallTable } from "../tables/tables";
export class Wall extends Entity {
    name: string;
    gym: string;
    image: ImageSourcePropType;
    angle?: number;
    configuredHolds: HoldInterface[];
    isPublic: boolean;
    constructor({ name, gym, image, angle, configuredHolds, isPublic, ...props }: { name: string, gym: string, image: ImageSourcePropType, angle?: number, configuredHolds?: { svgPath: string; id: string }[], isPublic?: boolean } & EntityProps) {
        super(props);
        this.name = name;
        this.gym = gym;
        this.image = image;
        this.angle = angle;
        this.configuredHolds = configuredHolds || [];
        this.isPublic = isPublic || false;
    }

    get fullName() {
        return `${this.name}@${this.gym}`;
    }

    get walls(): Wall[] {
        return this.dal!.users.GetWalls({user_id: this.id});
    }
};