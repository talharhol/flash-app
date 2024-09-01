import { SQLiteDatabase, SQLiteRunResult } from "expo-sqlite";
import { Group } from "./entities/group";
import { Problem } from "./entities/problem";
import { User } from "./entities/user";
import { Wall } from "./entities/wall";
import { ImageSourcePropType } from "react-native";
export interface IBaseDAL<ObjType extends { id: string }, ListParams = {}, GetParams extends { id?: string } = { id?: string }> {
    Get(params: GetParams): ObjType;

    Add(obj: ObjType): Promise<ObjType>;

    Remove(obj: ObjType): Promise<void>;

    Update(obj: ObjType): Promise<ObjType>;

    List(params: ListParams): ObjType[];

    Delete(params: { id: string }): Promise<void>;
}
export interface IDAL {
    walls: IBaseDAL<Wall>;
    users: IBaseDAL<User> & {
        GetWalls(params: { user_id: string, role?: string, isPublic?: boolean }): Wall[];
        AddWall(params: { wall_id: string, user_id: string }): Promise<void>;
        RemoveWall(params: { wall_id: string, user_id: string }): Promise<void>;
        RemoveGroup(params: { group_id: string, user_id: string }): Promise<void>;
    };
    problems: IBaseDAL<Problem>;
    groups: IBaseDAL<Group> & {
        AddProblem(params: {
            problem_id: string;
            group_id: string;
        }): Promise<void>
        AddWall(params: {
            wall_id: string;
            group_id: string;
        }): Promise<void>
        GetPrivateWalls(obj: Group): Wall[]
    };

    currentUser: User;
    convertToLocalImage(image: ImageSourcePropType): string;
    db: SQLiteDatabase | null;
}