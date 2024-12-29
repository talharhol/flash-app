import { Image, ImageResolvedAssetSource, ImageSourcePropType } from "react-native";
import { HoldInterface } from "../hold";
import { Entity, EntityProps } from "./BaseEntity";


export type WallProps = EntityProps & { name: string, gym: string, image: ImageSourcePropType, angle?: number, configuredHolds?: { svgPath: string; id: string }[], isPublic?: boolean, owner: string }

export class Wall extends Entity {
    name: string;
    gym: string;
    image: ImageResolvedAssetSource;
    angle?: number;
    configuredHolds: HoldInterface[];
    isPublic: boolean;
    owner: string
    
    constructor({ name, gym, image, angle, configuredHolds, isPublic, owner, ...props }: WallProps) {
        super(props);
        this.name = name;
        this.gym = gym;
        this.image = Image.resolveAssetSource(image);
        this.angle = angle;
        this.configuredHolds = configuredHolds || [];
        this.isPublic = isPublic ?? false;
        this.owner = owner
    }

    public toRemoteDoc(): { [key: string]: any} {
        return {
            ...super.toRemoteDoc(),
            name: this.name,
            gym: this.gym,
            angle: this.angle ?? -1,
            configuredHolds: this.configuredHolds.map(hold => { return {...hold}}),
            owner: this.owner,
            isPublic: this.isPublic
        }
    }

    protected async uploadAssets(data: { [key: string]: any }): Promise<{ [key: string]: any }> {
        return {
            ...data,
            image: await this.uploadImage(this.image),
        }
    }

    public shouldPushToRemote(): boolean {
        let isBelongsToGroup = (this.owner === this.gym && this.name === "Anonimus");
        return this.isPublic || isBelongsToGroup
    }

    public async addToRemote(collectionName: string): Promise<void> {
        if (!this.shouldPushToRemote()) return;
        return super.addToRemote(collectionName);
    }

    get fullName() {
        return `${this.name}@${this.gym}`;
    }

    get walls(): Wall[] {
        return this.dal!.users.GetWalls({user_id: this.id});
    }
    public static fromRemoteDoc(data: {[key: string]: any}, old?: Wall): Entity {
        let image = {uri: data.image.commpressed};
        if (!!old) image = old.image;
        return new this({
            id: data.id,
            name: data.name,
            gym: data.gym,
            angle: data.angle >= 0 ? data.angle : undefined,
            configuredHolds: data.configuredHolds,
            owner: data.owner,
            isPublic: data.isPublic,
            image: image
        });
    }
};