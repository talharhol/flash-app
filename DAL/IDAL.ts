import { Group } from "./group";
import { Problem } from "./problem";
import { User } from "./user";
import { Wall } from "./wall";

export interface IDAL {
    getWalls: (params: { isPublic?: boolean, name?: string, gym?: string }) => Wall[];

    getGroups: (params: { userId?: string }) => Group[];

    getUsers: (params: {}) => User[];

    getProblems: (params: { wallId?: string }) => Problem[];

    getWall: (params: { id?: string }) => Wall

    getGroup: (params: { id?: string }) => Group

    getUser: (params: { id?: string }) => User

    getProblem: (params: { id?: string }) => Problem 

    deleteWall: (params: { id?: string }) => boolean

    deleteGroup: (params: { id?: string }) => boolean

    deleteUser: (params: { id?: string }) => boolean;

    deleteProblem: (params: { id?: string }) => boolean;

    addWall: (obj: Wall) => Wall;

    addGroup: (obj: Group) => Group;

    addUser: (obj: User) => User;

    addProblem: (obj: Problem) => Problem;
}