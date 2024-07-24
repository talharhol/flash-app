import uuid from "react-native-uuid";
import { BaseTable, Field } from "./BaseTable";
import { SQLiteRunResult } from "expo-sqlite";
import { User } from "../entities/user";
import { Wall } from "../entities/wall";
import { Problem } from "../entities/problem";
import { Group } from "../entities/group";

export class UserTable extends BaseTable {
    public static tableName: string = "user";
    public static fields: Field[] = [
        new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
        new Field({ name: "name", type: "TEXT", notNull: true }),
        new Field({ name: "image", type: "TEXT", notNull: true }),
    ];

    public static insertFromObj(obj: User): Promise<SQLiteRunResult> {
        return this.insert({
            id: obj.id,
            name: obj.name,
            image: obj.getDAL().convertToLocalImage(obj.image)
        }, obj.getDAL().db!)
    }
}

export class WallTable extends BaseTable {
    public static tableName: string = "wall";
    public static fields: Field[] = [
        new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
        new Field({ name: "name", type: "TEXT", notNull: true }),
        new Field({ name: "gym", type: "TEXT", notNull: true }),
        new Field({ name: "owner_id", type: "TEXT", notNull: true, fk: UserTable.getField('id')}),
        new Field({ name: "image", type: "TEXT", notNull: true }),
        new Field({ name: "angel", type: "INTEGER" }),
        new Field({ name: "is_public", type: "BOOLEAN" }),
        new Field({ name: "holds", type: "TEXT" }),
    ];
    public static insertFromObj(obj: Wall): Promise<SQLiteRunResult> {
        return this.insert({
            id: obj.id,
            name: obj.name,
            gym: obj.gym,
            owner_id: obj.getDAL().currentUser.id,
            image: obj.getDAL().convertToLocalImage(obj.image),
            angel: obj.angle,
            is_public: obj.isPublic,
            holds: JSON.stringify(obj.configuredHolds)
        }, obj.getDAL().db!);
    }

}

export class ProblemTable extends BaseTable {
    public static tableName: string = "problem";
    public static fields: Field[] = [
        new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
        new Field({ name: "name", type: "TEXT", notNull: true }),
        new Field({ name: "owner_id", type: "TEXT", notNull: true, fk: UserTable.getField('id') }),
        new Field({ name: "wall_id", type: "TEXT", notNull: true, fk: WallTable.getField('id') }),
        new Field({ name: "is_public", type: "BOOLEAN", default_: () => true, notNull: true }),
        new Field({ name: "holds", type: "TEXT", notNull: true }),
        new Field({ name: "grade", type: "INTEGER", notNull: true }),
    ];

    public static insertFromObj(obj: Problem): Promise<SQLiteRunResult> {
        return this.insert({
            id: obj.id,
            name: obj.name,
            owner_id: obj.getDAL().currentUser.id,
            wall_id: obj.wallId,
            is_public: obj.isPublic,
            holds: JSON.stringify(obj.holds),
            grade: obj.grade
        }, obj.getDAL().db!);
    }
}

export class GroupTable extends BaseTable {
    public static tableName: string = "group";
    public static fields: Field[] = [
        new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
        new Field({ name: "name", type: "TEXT", notNull: true }),
        new Field({ name: "image", type: "TEXT", notNull: true }),
    ];

    public static insertFromObj(obj: Group): Promise<any> {
        return this.insert({
            id: obj.id,
            name: obj.name,
            image: obj.getDAL().convertToLocalImage(obj.image),
        }, obj.getDAL().db!).then(() => {
            obj.members.map(userId => {
                GroupMemberTable.insert({
                    user_id: userId,
                    group_id: obj.id,
                    role: userId in obj.admins ? "admin" : "member"
                }, obj.getDAL().db!)
            });
            obj.walls.map(wallId => {
                GroupWallTable.insert({
                    wall_id: wallId,
                    group_id: obj.id,
                }, obj.getDAL().db!)
            });
            obj.problems.map(problemId => {
                GroupProblemTable.insert({
                    problem_id: problemId,
                    group_id: obj.id,
                }, obj.getDAL().db!)
            });
        });

        
    }
}

export class GroupMemberTable extends BaseTable {
    public static tableName: string = "group_member";
    public static fields: Field[] = [
        new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
        new Field({ name: "role", type: "TEXT", default_: () => "member", notNull: true }),
        new Field({ name: "user_id", type: "TEXT", notNull: true, fk: UserTable.getField('id') }),
        new Field({ name: "group_id", type: "TEXT", notNull: true, fk: GroupTable.getField('id') }),
    ];
}

export class GroupWallTable extends BaseTable {
    public static tableName: string = "group_wall";
    public static fields: Field[] = [
        new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
        new Field({ name: "wall_id", type: "TEXT", notNull: true, fk: WallTable.getField('id') }),
        new Field({ name: "group_id", type: "TEXT", notNull: true, fk: GroupTable.getField('id') }),
    ];
}

export class GroupProblemTable extends BaseTable {
    public static tableName: string = "group_problem";
    public static fields: Field[] = [
        new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
        new Field({ name: "problem_id", type: "TEXT", notNull: true, fk: ProblemTable.getField('id') }),
        new Field({ name: "group_id", type: "TEXT", notNull: true, fk: GroupTable.getField('id') }),
    ];
}

