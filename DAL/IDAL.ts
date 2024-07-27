import { SQLiteDatabase } from "expo-sqlite";
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
}
export interface IDAL {
    walls: IBaseDAL<Wall>;
    users: IBaseDAL<User> & {
        GetWalls(params: {user_id: string}): Wall[]
    };
    problems: IBaseDAL<Problem>;
    groups: IBaseDAL<Group>;

    currentUser: User;
    convertToLocalImage(image: ImageSourcePropType): string;
    db: SQLiteDatabase | null;
}