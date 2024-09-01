import { createContext, useContext } from "react";
import * as SQLite from 'expo-sqlite';

import { User } from "./entities/user";
import { ProblemDAL, UserDAL, WallDAL } from "./BaseDAL";
import { GroupTable, ProblemTable, UserTable, WallTable } from "./tables/tables";
import { Image, ImageSourcePropType } from "react-native";
import * as FileSystem from 'expo-file-system';
import uuid from "react-native-uuid";
import { GroupDAL } from "./dals/group";


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