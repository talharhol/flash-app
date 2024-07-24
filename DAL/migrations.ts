import * as SQLite from 'expo-sqlite';
import dalService from './DALService';
import uuid from "react-native-uuid";
import { BaseTable, Field } from './tables/BaseTable';



export async function runMigrations() {
    const db = await SQLite.openDatabaseAsync('flashLocalDB.db');
    let currentVersion = await getCurrentVersion(db);
    while (currentVersion < migrations.length) {
        await migrations[currentVersion](db)
        currentVersion += 1;
        alert("run migrtion")
    }
    await db.execAsync(`PRAGMA user_version = ${migrations.length}`);
    await dalService.connect();
}

async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
    let dbResult = await db.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version'
    );
    return dbResult!.user_version;
}


const migrations = [
    async (db: SQLite.SQLiteDatabase) => {
        class User extends BaseTable {
            public static tableName: string = "user";
            public static fields: Field[] = [
                new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
                new Field({ name: "name", type: "TEXT", notNull: true }),
                new Field({ name: "image", type: "TEXT", notNull: true }),
            ];
        }
        
        class Wall extends BaseTable {
            public static tableName: string = "wall";
            public static fields: Field[] = [
                new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
                new Field({ name: "name", type: "TEXT", notNull: true }),
                new Field({ name: "gym", type: "TEXT", notNull: true }),
                new Field({ name: "owner_id", type: "TEXT", notNull: true, fk: User.getField('id') }),
                new Field({ name: "image", type: "TEXT", notNull: true }),
                new Field({ name: "angel", type: "INTEGER" }),
                new Field({ name: "is_public", type: "BOOLEAN" }),
                new Field({ name: "holds", type: "TEXT" }),
            ];
        }
        
        class Problem extends BaseTable {
            public static tableName: string = "problem";
            public static fields: Field[] = [
                new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
                new Field({ name: "name", type: "TEXT", notNull: true }),
                new Field({ name: "owner_id", type: "TEXT", notNull: true, fk: User.getField('id') }),
                new Field({ name: "wall_id", type: "TEXT", notNull: true, fk: Wall.getField('id') }),
                new Field({ name: "is_public", type: "BOOLEAN", default_: () => true, notNull: true }),
                new Field({ name: "holds", type: "TEXT", notNull: true }),
                new Field({ name: "grade", type: "INTEGER", notNull: true }),
            ];
        }
        
        class Group extends BaseTable {
            public static tableName: string = "group_table";
            public static fields: Field[] = [
                new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
                new Field({ name: "name", type: "TEXT", notNull: true }),
                new Field({ name: "image", type: "TEXT", notNull: true }),
            ];
        }
        
        class GroupMember extends BaseTable {
            public static tableName: string = "group_member";
            public static fields: Field[] = [
                new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
                new Field({ name: "role", type: "TEXT", default_: () => "member", notNull: true }),
                new Field({ name: "user_id", type: "TEXT", notNull: true, fk: User.getField('id') }),
                new Field({ name: "group_id", type: "TEXT", notNull: true, fk: Group.getField('id') }),
            ];
        }
        
        class GroupWall extends BaseTable {
            public static tableName: string = "group_wall";
            public static fields: Field[] = [
                new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
                new Field({ name: "wall_id", type: "TEXT", notNull: true, fk: Wall.getField('id') }),
                new Field({ name: "group_id", type: "TEXT", notNull: true, fk: Group.getField('id') }),
            ];
        }
        
        class GroupProblem extends BaseTable {
            public static tableName: string = "group_problem";
            public static fields: Field[] = [
                new Field({ name: "id", type: "TEXT", pk: true, default_: uuid.v4, notNull: true }),
                new Field({ name: "problem_id", type: "TEXT", notNull: true, fk: Problem.getField('id') }),
                new Field({ name: "group_id", type: "TEXT", notNull: true, fk: Group.getField('id') }),
            ];
        }

        await User.createTable(db);
        await Wall.createTable(db);
        await Problem.createTable(db);
        await Group.createTable(db);
        await GroupMember.createTable(db);
        await GroupWall.createTable(db);
        await GroupProblem.createTable(db);
    },    
];
