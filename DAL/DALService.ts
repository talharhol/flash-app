import { createContext, useContext } from "react";
import * as SQLite from 'expo-sqlite';

import { Wall } from "./entities/wall";
import { User } from "./entities/user";
import { Problem } from "./entities/problem";
import { Group } from "./entities/group";
import { GroupDAL, ProblemDAL, UserDAL, WallDAL } from "./BaseDAL";
import { IBaseDAL } from "./IDAL";
import { GroupTable, ProblemTable, UserTable, WallTable } from "./tables/tables";
import { Image, ImageSourcePropType } from "react-native";
import * as FileSystem from 'expo-file-system';
import uuid from "react-native-uuid";

const debugHolds = [
    { color: "red", "id": "aea90438-79f4-411d-adaa-37c5009c6c3e", "svgPath": "M 91.28268432617188, 134.17945861816406 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" },
    { color: "blue", "id": "71be8fa1-4155-4bf4-a98b-20c9da286b77", "svgPath": "M 109.63833618164062, 132.369140625 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" },
    { color: "green", "id": "220cd227-8ec2-4d73-beac-c7dc9f8376ac", "svgPath": "M 127.99398803710938, 132.59544372558594 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" },
    { color: "yellow", "id": "7cc4a9fb-52e9-4b78-8565-0f19f2e57224", "svgPath": "M 92.06600189208984, 151.09469604492188 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" },
    { color: "red", "id": "eebc54d2-3399-4fa1-813e-a11329f52942", "svgPath": "M 110.31720733642578, 149.3409423828125 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" },
];
class DalService {
    private static _instance: DalService;

    private _db: SQLite.SQLiteDatabase | null = null;
    public connected: boolean = false;

    private _userDal?: UserDAL;
    private _wallDal?: WallDAL;
    private _problemDal?: ProblemDAL;
    private _groupDal?: GroupDAL;

    private _currentUser?: User;

    public connect() {
        
        return SQLite.openDatabaseAsync('flashLocalDB.db').then(
            db => {
                db.execAsync("PRAGMA foreign_keys = ON").catch(console.log);
                this._db = db;                
            }
        ).then(() => this.connected = true).catch(alert);
    }

    constructor() {
        if (!!DalService._instance) {
            return DalService._instance;
        }
        this._userDal = new UserDAL(this, UserTable);
        this._wallDal = new WallDAL(this, WallTable);
        this._problemDal = new ProblemDAL(this, ProblemTable);
        this._groupDal = new GroupDAL(this, GroupTable);

        DalService._instance = this;
    }

    public get walls() {
        return this._wallDal!
    }
    public get users() {
        return this._userDal!
    }
    public get groups() {
        return this._groupDal!
    }
    public get problems() {
        return this._problemDal!
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    public get currentUser() {
        if (this._currentUser) return this._currentUser;
        
        let user = this.users.List({})[0];
        if (user === undefined) {
            user = new User({
                name: "tal",
                image: require("../assets/images/climber.png")
            });
            this.users.Add(user);
        }
        user.setDAL(this);
        this._currentUser = user;
        return user;
    }

    public convertToLocalImage(image: ImageSourcePropType): string {
        let localFileName = FileSystem.documentDirectory + `${uuid.v4() as string}.png`;
        const imageSrc = Image.resolveAssetSource(image);
        if (imageSrc.uri.startsWith("http")) {
            FileSystem.downloadAsync(
                imageSrc.uri,
                localFileName
            ).catch(alert);
        } else {
            FileSystem.copyAsync({
                from: imageSrc.uri,
                to: localFileName
            }).catch(alert);
        }
        
        return localFileName;
    }

    public get db() {
        return this._db;
    }
}

const dalService = DalService.Instance;

export default dalService;

export const DalContext = createContext(dalService);

export const useDal = () => useContext(DalContext);