import { IDAL } from "./IDAL";
import { Group } from "./group";
import { Problem } from "./problem";
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
}

export class WallDAL extends BaseDAL<Wall> {
    public List(params: { isPublic?: boolean, name?: string, gym?: string }): Wall[] {
        return Object.values(this._objects)
            .filter(
                w => params.isPublic !== undefined ? w.isPublic === params.isPublic : true
                    && params.name !== undefined ? w.name.toLocaleLowerCase().includes(params.name.toLocaleLowerCase()) : true
                        && params.gym !== undefined ? w.gym.toLocaleLowerCase().includes(params.gym.toLocaleLowerCase()) : true

            );
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