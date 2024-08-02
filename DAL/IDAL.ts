import { SQLiteDatabase, SQLiteRunResult } from "expo-sqlite";
import { Group } from "./entities/group";
import { Problem } from "./entities/problem";
import { User } from "./entities/user";
import { Wall } from "./entities/wall";
import { ImageSourcePropType } from "react-native";
export interface IBaseDAL<ObjType extends { id: string }, ListParams = {}, GetParams extends { id?: string } = { id?: string }> {
    Get(params: GetParams): ObjType;

    Add(obj: ObjType): ObjType;

    Remove(obj: ObjType): boolean;

    Update(obj: ObjType): ObjType;

    List(params: ListParams): ObjType[];

    Delete(params: { id: string }): Promise<any>;
}
export interface IDAL {
    walls: IBaseDAL<Wall>;
    users: IBaseDAL<User> & {
        GetWalls(params: {user_id: string, role?: string}): Wall[];
        AddWall(params: {wall_id: string, user_id: string}): Promise<any>;
        RemoveWall(params: {wall_id: string, user_id: string}): Promise<any>;
    };
    problems: IBaseDAL<Problem>;
    groups: IBaseDAL<Group> & {
        AddProblem(params: {
            problem_id: string;
            group_id: string;
        }): Promise<void | SQLiteRunResult>
        AddWall(params: {
            wall_id: string;
            group_id: string;
        }): Promise<void | SQLiteRunResult>
    };

    currentUser: User;
    convertToLocalImage(image: ImageSourcePropType): string;
    db: SQLiteDatabase | null;
}