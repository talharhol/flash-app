import { Image, ImageSourcePropType } from "react-native";
import * as FileSystem from 'expo-file-system';
import uuid from "react-native-uuid";

import { IDAL } from "./IDAL";
import { Group } from "./entities/group";
import { Problem } from "./entities/problem";
import { User } from "./entities/user";
import { Wall } from "./entities/wall";
import { BaseTable } from "./tables/BaseTable";

export class BaseDAL<
    ObjType extends {
        id: string;
        setDAL?: (dal: IDAL) => void;
    }
> {
    protected _objects: { [key: string]: ObjType } = {};
    protected _dal: IDAL;
    public table: typeof BaseTable;

    constructor(dal: IDAL, table: typeof BaseTable) {
        this.table= table
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

    
}

export class UserDAL extends BaseDAL<User> {
    
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