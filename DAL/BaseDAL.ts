import { Image, ImageSourcePropType } from "react-native";
import * as FileSystem from 'expo-file-system';
import uuid from "react-native-uuid";

import { IDAL } from "./IDAL";
import { Group } from "./group";
import { Problem } from "./problem";
import { User } from "./user";
import { Wall } from "./wall";

export class BaseDAL<
    ObjType extends {
        id: string;
        setDAL?: (dal: IDAL) => void;
    }
> {
    protected _objects: { [key: string]: ObjType } = {};
    protected _dal: IDAL;

    constructor(dal: IDAL) {
        this._dal = dal;
    }

    public Add(obj: ObjType): ObjType {
        obj.setDAL?.(this._dal);
        return this._objects[obj.id] = obj;
    }

    public Remove(obj: ObjType): boolean {
        return delete this._objects[obj.id];
    }

    public Update(obj: ObjType): ObjType {
        return this._objects[obj.id] = obj;
    }

    public Get(params: { id: string }): ObjType {
        return this._objects[params.id];
    }

    public List(params: {}): ObjType[] {
        return Object.values(this._objects);
    }

    protected convertToLocalImage(image: ImageSourcePropType): string {
        let localFileName = `${uuid.v4() as string}.png`;
        const imageSrc = Image.resolveAssetSource(image);
        FileSystem.downloadAsync(imageSrc.uri, FileSystem.documentDirectory + localFileName).catch(alert);
        return localFileName;
    }
}

export class UserDAL extends BaseDAL<User> {
    public Add(obj: User): User {
        obj = super.Add(obj);
        this._dal.db?.
        runAsync("INSERT INTO users (id, name, image) values (?, ?, ?)", 
        obj.id, obj.name, this.convertToLocalImage(obj.image)).catch(alert);
        return obj;
    }
}
export class WallDAL extends BaseDAL<Wall> {
    public List(params: { isPublic?: boolean, name?: string, gym?: string }): Wall[] {
        let v = Object.values(this._objects)
            .filter(
                w => (params.isPublic !== undefined ? w.isPublic === params.isPublic : true)
                    && (params.name !== undefined ? w.name.toLocaleLowerCase().includes(params.name.toLocaleLowerCase()) : true)
                    && (params.gym !== undefined ? w.gym.toLocaleLowerCase().includes(params.gym.toLocaleLowerCase()) : true)

            );
        return v;
    }
}

export class GroupDAL extends BaseDAL<Group> {
    public List(params: { userId?: string }): Group[] {
        return Object.values(this._objects)
            .filter(
                i => params.userId !== undefined ? i.members.includes(params.userId) : true
            );
    }
}
export class ProblemDAL extends BaseDAL<Problem> {
    public List(params: { wallId?: string }): Problem[] {
        return Object.values(this._objects)
            .filter(
                i => params.wallId !== undefined ? i.wallId === params.wallId : true
            );
    }
}