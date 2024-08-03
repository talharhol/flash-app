import { ImageSourcePropType } from "react-native";
import { HoldInterface } from "../hold";
import { Entity, EntityProps } from "./BaseEntity";

export type WallProps = EntityProps & { name: string, gym: string, image: ImageSourcePropType, angle?: number, configuredHolds?: { svgPath: string; id: string }[], isPublic?: boolean, owner: string }

export class Wall extends Entity {
    name: string;
    gym: string;
    image: ImageSourcePropType;
    angle?: number;
    configuredHolds: HoldInterface[];
    isPublic: boolean;
    owner: string
    constructor({ name, gym, image, angle, configuredHolds, isPublic, owner, ...props }: WallProps) {
        super(props);
        this.name = name;
        this.gym = gym;
        this.image = image;
        this.angle = angle;
        this.configuredHolds = configuredHolds || [];
        this.isPublic = isPublic || false;
        this.owner = owner
    }

    get fullName() {
        return `${this.name}@${this.gym}`;
    }

    get walls(): Wall[] {
        return this.dal!.users.GetWalls({user_id: this.id});
    }
};