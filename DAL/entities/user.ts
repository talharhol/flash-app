import { ImageSourcePropType } from "react-native";
import { Entity, EntityProps } from "./BaseEntity";

export class User extends Entity {
    name: string;
    image: ImageSourcePropType;
    constructor({ name, image, ...props }: {name: string, image: ImageSourcePropType } & EntityProps) {
        super(props)
        this.name = name;
        this.image = image;
    }

    public get groups() {
        return this.dal!.groups.List({userId: this.id})
    }
    
    public get walls() {
        return this.dal!.walls.List({userId: this.id})
    }
};