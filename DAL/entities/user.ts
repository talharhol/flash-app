import { ImageSourcePropType, Image } from "react-native";
import { Entity, EntityProps } from "./BaseEntity";

export type UserProps = EntityProps & {name: string, image?: ImageSourcePropType }

export class User extends Entity {
    name: string;
    protected _image?: ImageSourcePropType;
    constructor({ name, image, ...props }: UserProps) {
        super(props)
        this.name = name;
        this._image = image;
    }

    public get groups() {
        return this.dal!.groups.List({userId: this.id})
    }
    
    public get walls() {
        return this.dal!.walls.List({userId: this.id})
    }

    public get ownedWalls() {
        return this.dal!.users.GetWalls({user_id: this.id, role: "owner"})
    }

    public get viewerWalls() {
        return this.dal!.users.GetWalls({user_id: this.id, role: "viewer"})
    }

    public addWall(id: string) {
        return this.dal!.users.AddWall({wall_id: id, user_id: this.id})
    }

    public removeWall(id: string) {
        return this.dal!.users.RemoveWall({wall_id: id, user_id: this.id})
    }

    public removeGroup(id: string) {
        return this.dal!.users.RemoveGroup({group_id: id, user_id: this.id});
    }

    get image(): ImageSourcePropType {
        return this._image ?? require("../../assets/images/climber.png")
    }

    protected async uploadAssets(data: { [key: string]: any }): Promise<{ [key: string]: any }> {
        let image = {};
        if (!!this._image) image = await this.uploadImage(Image.resolveAssetSource(this._image));
        
        return {
            ...data,
            image: image,
        };
    }

    public toRemoteDoc(): { [key: string]: any} {
        return {
            ...super.toRemoteDoc(),
            name: this.name,
        }
    }

    public static fromRemoteDoc(data: {[key: string]: any}, old?: User): Entity {
        let image = undefined;
        if (!!data.image.commpressed) image = {uri: data.image.commpressed}
        if (!!old) image = old._image ?? image;
        return new this({
            id: data.id,
            name: data.name,
            image: image
        });
    }
};