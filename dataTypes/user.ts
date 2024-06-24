import { ImageSourcePropType } from "react-native";
import uuid from "react-native-uuid";
export class User {
    id: string;
    name: string;
    image: ImageSourcePropType;
    constructor({ id, name, image }: {id?: string, name: string, image: ImageSourcePropType }) {
        this.id = id || uuid.v4() as string;
        this.name = name;
        this.image = image;
    }
};