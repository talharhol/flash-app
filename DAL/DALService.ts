import { createContext, useContext } from "react";
import { Wall } from "./wall";
import { User } from "./user";
import { Problem } from "./problem";
import { Group } from "./group";
const debugHolds = [
    { color: "red", "id": "aea90438-79f4-411d-adaa-37c5009c6c3e", "svgPath": "M 91.28268432617188, 134.17945861816406 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" },
    { color: "red", "id": "71be8fa1-4155-4bf4-a98b-20c9da286b77", "svgPath": "M 109.63833618164062, 132.369140625 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" },
    { color: "red", "id": "220cd227-8ec2-4d73-beac-c7dc9f8376ac", "svgPath": "M 127.99398803710938, 132.59544372558594 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" },
    { color: "red", "id": "7cc4a9fb-52e9-4b78-8565-0f19f2e57224", "svgPath": "M 92.06600189208984, 151.09469604492188 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" },
    { color: "red", "id": "eebc54d2-3399-4fa1-813e-a11329f52942", "svgPath": "M 110.31720733642578, 149.3409423828125 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" },
    { color: "red", "id": "dd0c2aa7-2820-4fe1-a057-2899bfa3dd19", "svgPath": "M 128.5161895751953, 147.41746520996094 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" },
];
class DalService {
    private static _instance: DalService;
    private _users: { [key: string]: User } = {}
    private _walls: { [key: string]: Wall } = {}
    private _problems: { [key: string]: Problem } = {}
    private _groups: { [key: string]: Group } = {}
    constructor() {
        if (!!DalService._instance) {
            return DalService._instance;
        }
        let users = [
            new User({ name: "Tal", image: require("../assets/images/climber.png") }),
            new User({ name: "Gozal", image: require("../assets/images/climber.png") }),
            new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
        ]
        let walls = [
            new Wall({ name: "Moon", gym: "Tal", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true }),
            new Wall({ name: "Moon", gym: "Tal", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true }),
            new Wall({ name: "Moon", gym: "Tal", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true }),
            new Wall({ name: "Moon", gym: "Tal", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: debugHolds, isPublic: true }),
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
        users.forEach(u => this._users[u.id] = u);
        walls.forEach(u => this._walls[u.id] = u);
        problems.forEach(u => this._problems[u.id] = u);
        groups.forEach(u => this._groups[u.id] = u);
        DalService._instance = this;
    }

    public getWalls: (params: { isPublic?: boolean, name?: string, gym?: string }) => Wall[] = (params) => {
        return Object.values(this._walls)
            .filter(
                w => params.isPublic !== undefined ? w.isPublic === params.isPublic : true
                    && params.name !== undefined ? w.name.includes(params.name) : true
                        && params.gym !== undefined ? w.gym.includes(params.gym) : true

            );
    }

    public getGroups: (params: { userId?: string }) => Group[] = (params) => {
        return Object.values(this._groups)
            .filter(
                g => params.userId !== undefined ? g.members.includes(params.userId) : true
            );
    }

    public getUsers: (params: {}) => User[] = (params) => {
        return Object.values(this._users);
    }

    public getProblems: (params: { wallId?: string }) => Problem[] = (params) => {
        return Object.values(this._problems)
            .filter(
                p => params.wallId !== undefined ? p.wallId === params.wallId : true
            );
    }

    public getWall: (params: { id?: string }) => Wall = (params) => {
        return this._walls[params.id!]
    }

    public getGroup: (params: { id?: string }) => Group = (params) => {
        return this._groups[params.id!]
    }

    public getUser: (params: { id?: string }) => User = (params) => {
        return this._users[params.id!]
    }

    public getProblem: (params: { id?: string }) => Problem = (params) => {
        return this._problems[params.id!]
    }

    public deleteWall: (params: { id?: string }) => boolean = (params) => {
        return delete this._walls[params.id!]
    }

    public deleteGroup: (params: { id?: string }) => boolean = (params) => {
        return delete this._groups[params.id!]
    }

    public deleteUser: (params: { id?: string }) => boolean = (params) => {
        return delete this._users[params.id!]
    }

    public deleteProblem: (params: { id?: string }) => boolean = (params) => {
        return delete this._problems[params.id!]
    }

    public addWall: (obj: Wall) => Wall = (obj) => {
        return this._walls[obj.id] = obj
    }

    public addGroup: (obj: Group) => Group = (obj) => {
        return this._groups[obj.id] = obj
    }

    public addUser: (obj: User) => User = (obj) => {
        return this._users[obj.id] = obj
    }

    public addProblem: (obj: Problem) => Problem = (obj) => {
        return this._problems[obj.id] = obj
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }
}

const dalService = DalService.Instance;

export default dalService;

export const DalContext = createContext(dalService);

export const useDal = () => useContext(DalContext);