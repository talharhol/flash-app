import { Group } from "./group";
import { Problem } from "./problem";
import { User } from "./user";
import { Wall } from "./wall";
export interface IBaseDAL<ObjType extends { id: string }, ListParams = {}, GetParams extends { id?: string } = { id?: string }> {
    Get(params: GetParams): ObjType;
    Add(obj: ObjType): ObjType;

    Remove(obj: ObjType): boolean;

    Update(obj: ObjType): ObjType;

    List(params: ListParams): ObjType[];
}
export interface IDAL {
    walls: IBaseDAL<Wall>;
    users: IBaseDAL<User>;
    problems: IBaseDAL<Problem>;
    groups: IBaseDAL<Group>;

    currentUser: User;
}