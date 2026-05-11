import { Image, ImageResolvedAssetSource, ImageSourcePropType } from "react-native";
import { HoldInterface } from "../hold";
import { Entity, EntityProps } from "./BaseEntity";
import { GeoPoint } from "firebase/firestore";


export type WallProps = EntityProps & { name: string, gym: string, image: ImageSourcePropType, angle?: number, configuredHolds?: HoldInterface[], isPublic?: boolean, owner: string, lat?: number, lng?: number, remoteImage?: {[key: string]: string} }

export class Wall extends Entity {
    name: string;
    gym: string;
    image: ImageResolvedAssetSource;
    angle?: number;
    configuredHolds: HoldInterface[];
    isPublic: boolean;
    owner: string
    lat?: number;
    lng?: number;
    remoteImage?: {[key: string]: string};

    constructor({ name, gym, image, angle, configuredHolds, isPublic, owner, lat, lng, remoteImage, ...props }: WallProps) {
        super(props);
        this.name = name;
        this.gym = gym;
        this.image = Image.resolveAssetSource(image);
        this.angle = angle;
        this.configuredHolds = configuredHolds || [];
        this.isPublic = Boolean(isPublic ?? false);
        this.owner = owner
        this.lat = lat;
        this.lng = lng;
        this.remoteImage = remoteImage;
    }

    public toRemoteDoc(): { [key: string]: any} {
        const doc: { [key: string]: any } = {
            ...super.toRemoteDoc(),
            name: this.name,
            gym: this.gym,
            angle: this.angle ?? -1,
            configuredHolds: this.configuredHolds.map(hold => { return {...hold}}),
            owner: this.owner,
            isPublic: this.isPublic
        };
        if (this.lat !== undefined && this.lng !== undefined) {
            doc.location = new GeoPoint(this.lat, this.lng);
        }
        return doc;
    }

    protected async uploadAssets(data: { [key: string]: any }): Promise<{ [key: string]: any }> {
        this.remoteImage = await this.uploadImage(this.image);
        this.dal!.walls.UpdateLocal(this);
        return {
            ...data,
            image: this.remoteImage,
        }
    }

    public shouldPushToRemote(): boolean {
        let isBelongsToGroup = (this.owner === this.gym && this.name === "Anonimus");
        return this.isPublic || isBelongsToGroup
    }

    get fullName() {
        if (this.isPublic)
            return `${this.name}@${this.gym}`;
        return this.name;
    }

    get walls(): Wall[] {
        return this.dal!.users.GetWalls({user_id: this.id});
    }
    public static fromRemoteDoc(data: {[key: string]: any}, old?: Wall): Wall {
        const imageChanged = old?.remoteImage ? JSON.stringify(data.image) !== JSON.stringify(old.remoteImage) : false;
        let image = {uri: data.image.commpressed};
        if (imageChanged) {
            let isInWalls = old?.dal!.currentUser.walls.some(w => w.id === old.id);
            if (isInWalls) {
                image = {uri: data.image.full};
            }
        } else {
            image = old?.image ?? {uri: data.image.commpressed};
        }
        
        return new this({
            id: data.id,
            name: data.name,
            gym: data.gym,
            angle: data.angle >= 0 ? data.angle : undefined,
            configuredHolds: data.configuredHolds,
            owner: data.owner,
            isPublic: Boolean(data.isPublic),
            image: image,
            lat: data.location?.latitude,
            lng: data.location?.longitude,
            remoteImage: data.image,
        });
    };

    public async fetchFullImage(): Promise<void> {
        if (this.remoteImage === undefined || !this.remoteImage.full) return;
        this.image = Image.resolveAssetSource(
            { 
                uri: await this.dal!.convertToLocalImage({uri: this.remoteImage.full})
            }
        );
        await this.dal!.walls.Update(this);
    }
};