import { ImageSourcePropType, Image } from "react-native";
import { Entity, EntityProps } from "./BaseEntity";
import { ProblemFilter } from "../IDAL";

export type UserProps = EntityProps & { name?: string, image?: ImageSourcePropType }

export class User extends Entity {
    name: string;
    protected _image?: ImageSourcePropType;
    constructor({ name, image, ...props }: UserProps) {
        super(props)
        this.name = name ?? `u${Date.now() % 1e8}${Math.floor(1000 + Math.random() * 8999)}`;
        this._image = image;
    }

    public get groups() {
        return this.dal!.groups.List({ userId: this.id })
    }

    public get walls() {
        return this.dal!.walls.List({ userId: this.id })
    }

    public get ownedWalls() {
        return this.dal!.users.GetWalls({ user_id: this.id, role: "owner" })
    }

    public get viewerWalls() {
        return this.dal!.users.GetWalls({ user_id: this.id, role: "viewer" })
    }

    public async addWall(id: string, role?: string, updateRemote?: boolean) {
        updateRemote = updateRemote ?? true;
        await this.dal!.users.AddWall({ wall_id: id, user_id: this.id }, role);
        if (updateRemote) this.dal!.users.UpdateRemote(this).catch(console.error);
    }

    public async removeWall(id: string, updateRemote?: boolean) {
        updateRemote = updateRemote ?? true;
        await this.dal!.users.RemoveWall({ wall_id: id, user_id: this.id });
        if (updateRemote) this.dal!.users.UpdateRemote(this).catch(console.error);
    }

    public async removeGroup(id: string, updateRemote?: boolean) {
        updateRemote = updateRemote ?? true;
        await this.dal!.users.RemoveGroup({ group_id: id, user_id: this.id });
        if (updateRemote) this.dal!.users.UpdateRemote(this).catch(console.error);
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

    public toRemoteDoc(): { [key: string]: any } {
        return {
            ...super.toRemoteDoc(),
            name: this.name,
            owenedWalls: this.ownedWalls.filter(w => w.shouldPushToRemote()).map(w => w.id),
            viewerWalls: this.viewerWalls.filter(w => w.shouldPushToRemote()).map(w => w.id),
        }
    }

    public static fromRemoteDoc(data: { [key: string]: any }, old?: User): Entity {
        let image: ImageSourcePropType | undefined = undefined;
        if (!!data.image.commpressed) image = { uri: data.image.commpressed }
        if (!!old) image = old._image ?? image;
        return new this({
            id: data.id,
            name: data.name,
            image: image
        });
    }

    public get lastPulled(): number {
        return this.getDAL().users.getLastPulled(this);
    }

    public set lastPulled(value: number) {
        this.getDAL().users.setLastPulled(this, value).catch(console.error);
    }

    public get shouldFetchUserData(): boolean {
        return this.getDAL().users.getShouldFetchUserData(this);
    }

    public set shouldFetchUserData(value: boolean) {
        this.getDAL().users.setShouldFetchUserData(this, value).catch(console.error);
    }

    public get loginCount(): number {
        return this.getDAL().users.getLoginCount(this);
    }

    public set loginCount(value: number) {
        this.getDAL().users.setLoginCount(this, value).catch(console.error);
    }

    public getLastFilters(params: { id: string }): ProblemFilter {
        let filters = this.getDAL().users.getFilters(this);
        return filters[params.id] ?? {
            minGrade: 1,
            maxGrade: 15,
            name: "",
            setters: [],
            isPublic: true,
            type: undefined,
        };
    }

    public setFilters(params: { id: string, filters: ProblemFilter }) {
        let filters = this.getDAL().users.getFilters(this);
        filters[params.id] = filters;
        this.getDAL().users.setFilters(this, filters);
    }
    
};