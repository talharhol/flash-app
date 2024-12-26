import { SQLiteDatabase, SQLiteRunResult } from "expo-sqlite";
import { Group } from "./entities/group";
import { Problem } from "./entities/problem";
import { User } from "./entities/user";
import { Wall } from "./entities/wall";
import { ImageSourcePropType } from "react-native";
import { ProblemDAL } from "./dals/problem";
import { GroupDAL } from "./dals/group";
import { UserDAL } from "./dals/user";
import { WallDAL } from "./dals/wall";
import { Firestore } from "firebase/firestore";
import { RemoteStorage } from "./remoteStorage";

export interface IDAL {
    walls: WallDAL;
    users: UserDAL;
    problems: ProblemDAL;
    groups: GroupDAL;

    currentUser: User;
    convertToLocalImage(image: ImageSourcePropType): string;
    db: SQLiteDatabase | null;
    remoteDB: Firestore;
    remoteStorage: RemoteStorage;
    compressImage(uri: string): Promise<string>;
}