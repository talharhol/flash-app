import { createContext, useContext } from "react";
import * as SQLite from 'expo-sqlite';

import { Wall } from "./wall";
import { User } from "./user";
import { Problem } from "./problem";
import { Group } from "./group";
import { BaseDAL, GroupDAL, ProblemDAL, UserDAL, WallDAL } from "./BaseDAL";
import { IBaseDAL } from "./IDAL";

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

    private _userDal?: IBaseDAL<User>;
    private _wallDal?: IBaseDAL<Wall, { isPublic?: boolean, name?: string, gym?: string }>;
    private _problemDal?: IBaseDAL<Problem, { wallId?: string }>;
    private _groupDal?: IBaseDAL<Group, { userId?: string }>;

    public connect() {
        let users = [
            new User({ name: "Tal", image: require("../assets/images/climber.png") }),
            new User({ name: "Gozal", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
        ]
        let walls = [
            new Wall({ name: "Moon1", gym: "Tal", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true, dal: this }),
            new Wall({ name: "Moon2", gym: "Tal", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true, dal: this }),
            new Wall({ name: "Moon3", gym: "Rotem", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true, dal: this }),
            new Wall({ name: "Moon4", gym: "Rotem", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true, dal: this }),
            new Wall({ name: "Moon4", gym: "Rotem", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true, dal: this }),
            new Wall({ name: "Moon4", gym: "Rotem", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true, dal: this }),
            new Wall({ name: "Moon4", gym: "Rotem", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true, dal: this }),
            new Wall({ name: "Moon4", gym: "Rotem", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true, dal: this }),
            new Wall({ name: "Moon4", gym: "Rotem", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true, dal: this }),
            new Wall({ name: "Moon4", gym: "Rotem", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true, dal: this }),
        ]
        let problems = [
            new Problem({ wallId: walls[0].id, name: "David", grade: 5, holds: debugHolds, setter: users[0].id }),
            new Problem({ wallId: walls[0].id, name: "Moshe", grade: 6, holds: debugHolds, setter: users[1].id }),
            new Problem({ wallId: walls[0].id, name: "Moav", grade: 7, holds: debugHolds, setter: users[2].id }),
            new Problem({ wallId: walls[0].id, name: "Rotem", grade: 8, holds: debugHolds, setter: users[0].id }),
        ];
        let groups = [
            new Group({ name: "Group1", image: require("../assets/images/climber.png"), walls: [walls[0].id, walls[1].id], members: users.map(u => u.id), admins: [users[0].id], problems: [problems[0].id, problems[1].id] }),
            new Group({ name: "Group2", image: require("../assets/images/climber.png"), walls: [walls[0].id, walls[1].id], members: users.map(u => u.id), admins: [users[1].id], problems: [problems[0].id, problems[1].id] }),
            new Group({ name: "Group3", image: require("../assets/images/climber.png"), walls: [walls[0].id, walls[1].id], members: users.map(u => u.id), admins: [users[2].id], problems: [problems[0].id, problems[1].id] }),
            new Group({ name: "Group4", image: require("../assets/images/climber.png"), walls: [walls[0].id, walls[1].id], members: users.map(u => u.id), admins: [users[0].id], problems: [problems[0].id, problems[1].id] }),
        ];
        return SQLite.openDatabaseAsync('flashLocalDB.db').then(
            db => {
                this._db = db;
                users.forEach(u => this.users.Add(u));
                walls.forEach(w => this.walls.Add(w));
                problems.forEach(p => this.problems.Add(p));
                groups.forEach(g => this.groups.Add(g));
            }
        ).then(() => this.connected = true).catch(alert);
    }

    constructor() {
        if (!!DalService._instance) {
            return DalService._instance;
        }


        this._userDal = new UserDAL(this);
        this._wallDal = new WallDAL(this);
        this._problemDal = new ProblemDAL(this);
        this._groupDal = new GroupDAL(this);

        
        

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
        return Object.values(this.users.List({}))[0];
    }

    public get db() {
        return this._db;
    }
}

const dalService = DalService.Instance;

export default dalService;

export const DalContext = createContext(dalService);

export const useDal = () => useContext(DalContext);