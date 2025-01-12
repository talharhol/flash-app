import { createContext, useContext, useEffect, useState } from "react";
import * as SQLite from 'expo-sqlite';

import { User } from "./entities/user";
import { GroupTable, ProblemTable, UserTable, WallTable } from "./tables/tables";
import { Image, ImageSourcePropType } from "react-native";
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from "expo-image-manipulator";
import uuid from "react-native-uuid";
import { GroupDAL } from "./dals/group";
import { UserDAL } from "./dals/user";
import { WallDAL } from "./dals/wall";
import { ProblemDAL } from "./dals/problem";
import { Firestore } from "firebase/firestore";
import { Auth, NextOrObserver, User as AuthUser } from "firebase/auth";
import { auth, app, db } from "../firebaseConfig"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { RemoteStorage } from "./remoteStorage";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { EventEmitter } from 'events';


class DalService extends EventEmitter {
    private static _instance: DalService;

    private _db: SQLite.SQLiteDatabase | null = null;
    private _remoteDB: Firestore = db;
    private _remoteAuth: Auth = auth;
    public connected: boolean = false;

    private _userDal?: UserDAL;
    private _wallDal?: WallDAL;
    private _problemDal?: ProblemDAL;
    private _groupDal?: GroupDAL;
    private _remoteStorage?: RemoteStorage;

    private _currentUser?: User;

    private async loadUpdates() {
        let last = Timestamp.fromMillis(this.users.lastPulled);
        let cur = Timestamp.now();
        while (true) {
            if (this.currentUser.name === "tmp") await new Promise(resolve => setTimeout(resolve, 500));
            else {
                await new Promise(resolve => setTimeout(resolve, 500));
                break;
            }
        }
        while (true) {
            try {
                console.log("Running...");
                cur = Timestamp.now();
                await this.users.FetchFromRemote(last).catch(console.error);
                await this.walls.FetchFromRemote(last).catch(console.error);
                await this.problems.FetchFromRemote(last).catch(console.error);
                await this.groups.FetchFromRemote(last).catch(console.error);
                if (this.users.shouldFetchUserData) await this.users.FetchUserData().catch(console.error);
                last = cur;
                this.users.lastPulled = last.toMillis();
            } catch (e) {
                console.error(e);
            }
            await new Promise(resolve => setTimeout(resolve, 300 * 1000));
        }

    }

    public async connect() {
        try {
            let db = await SQLite.openDatabaseAsync('flashLocalDB.db');
            await db.execAsync("PRAGMA foreign_keys = ON").catch(console.log);
            this._db = db;
            this.connected = true;
            this.loadUpdates().catch(console.error);
        }
        catch (e) {
            console.log(e);
        }

    }

    constructor() {
        if (!!DalService._instance) {
            return DalService._instance;
        }
        super();
        this._userDal = new UserDAL(this, UserTable, "user");
        this._wallDal = new WallDAL(this, WallTable, "wall");
        this._problemDal = new ProblemDAL(this, ProblemTable, "problem");
        this._groupDal = new GroupDAL(this, GroupTable, "group");
        this._remoteStorage = new RemoteStorage(app);
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
        if (!this.isLogin) {
            let user = new User({ name: "tmp" });
            user.setDAL(this);
            return user;
        }

        let user = this.users.List({ id: this._remoteAuth.currentUser!.uid })[0];
        if (user === undefined) {
            user = new User({
                id: this._remoteAuth.currentUser!.uid,
                name: this._remoteAuth.currentUser!.email || "User"
            });
            user.setDAL(this);
            this._currentUser = user;
            this.users.AddToLocal(user).then(
                _ => {
                    this.users.CreateConfig(
                        { user_id: user.id, last_pulled: 0, should_fetch_user_data: true }
                    ).then(_ => {
                        this.users.FetchSingleDoc(user.id)
                            .then(
                                data => {
                                    if (!data) {
                                        console.log("adding user to remote");
                                        this.users.AddToRemote(user).then(_ => console.log("added!"));
                                    } else {
                                        this.users.shouldFetchUserData = true;
                                    }
                                })
                    })
                }
            );
        }
        return user;
    }

    public async convertToLocalImage(image: ImageSourcePropType, localFileName?: string): Promise<string> {
        localFileName = FileSystem.documentDirectory + (localFileName ?? `${uuid.v4() as string}.png`);
        const imageSrc = Image.resolveAssetSource(image);
        try {
            if (imageSrc.uri.startsWith("http")) {
                await FileSystem.downloadAsync(
                    imageSrc.uri,
                    localFileName
                );
            } else {
                await FileSystem.copyAsync({
                    from: imageSrc.uri,
                    to: localFileName
                });
            }
        }
        catch (e) {
            console.error("fail to save image to disk", e);
        }
        return localFileName;
    }

    public async compressImage(uri: string): Promise<string> {
        const compressed = await ImageManipulator.manipulateAsync(uri, [],
            { compress: 0.1, format: ImageManipulator.SaveFormat.JPEG }
        );

        return compressed.uri;
    }

    public async signin(email: string, password: string) {
        await signInWithEmailAndPassword(this._remoteAuth, email, password);
    }

    public async signout() {
        if (this.isLogin) {
            await this._remoteAuth.signOut()
        }

    }

    public async signup(email: string, password: string) {
        await createUserWithEmailAndPassword(this._remoteAuth, email, password);
    }

    public onAuthStateChanged(callback: NextOrObserver<AuthUser | null>) {
        this._remoteAuth.onAuthStateChanged(callback)
    }

    public get db() {
        return this._db;
    }

    public get remoteDB() {
        return this._remoteDB;
    }

    public get isLogin() {
        return !!this._remoteAuth.currentUser
    }

    public get remoteStorage(): RemoteStorage {
        return this._remoteStorage!;
    }

    public updateScreen() {
        this.emit('update');
    }

}

const dalService = DalService.Instance;

export default dalService;

export const DalContext = createContext(dalService);

export const useDal = (update?: () => void) => {
    useEffect(() => {
        const handleUpdate = () => update?.();
        dalService.on('update', handleUpdate); // Subscribe to updates

        return () => {
            dalService.off('update', handleUpdate); // Cleanup subscription
        };
    }, []);

    return dalService;

    return useContext(DalContext);
} 