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
import { EventEmitter } from 'events';
import { OAuthCredential } from "firebase/auth";

export interface IDAL extends EventEmitter {
    walls: WallDAL;
    users: UserDAL;
    problems: ProblemDAL;
    groups: GroupDAL;

    currentUser: User;
    convertToLocalImage(image: ImageSourcePropType, localFileName?: string): Promise<string>;
    db: SQLiteDatabase | null;
    remoteDB: Firestore;
    remoteStorage: RemoteStorage;
    isLogin: boolean;
    compressImage(uri: string): Promise<string>;
    updateScreen(): void;
    signin(params: {email?: string, password?: string, googleCredential?: OAuthCredential}): Promise<void>
    signup(params: {email?: string, password?: string, googleCredential?: OAuthCredential}): Promise<void>
} 