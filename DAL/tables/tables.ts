
import { Image, ImageSourcePropType } from "react-native";
import * as FileSystem from 'expo-file-system';
import uuid from "react-native-uuid";
import { BaseTable, Field } from "./BaseTable";
import { SQLiteDatabase } from "expo-sqlite";
import { User } from "../entities/user";
import { Wall } from "../entities/wall";
import { Problem } from "../entities/problem";
import { Group } from "../entities/group";
import { Entity } from "../entities/BaseEntity";

function convertToLocalImage(image: ImageSourcePropType): string {
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


export class UserTable extends BaseTable {
    public static entity: typeof Entity = User;
    public static tableName: string = "user";
    public static fields: Field[] = [
        ...BaseTable.getDefaultFields(),
        new Field({ name: "name", type: "TEXT", notNull: true }),
        new Field(
            {
                name: "image", type: "TEXT", notNull: true,
                dumper: convertToLocalImage,
                loader: (image) => {
                    return {
                        uri: image
                    }
                }
            }
        ),
    ];
}

export class WallTable extends BaseTable {
    public static entity: typeof Entity = Wall;
    public static tableName: string = "wall";
    public static fields: Field[] = [
        ...BaseTable.getDefaultFields(),
        new Field({ name: "name", type: "TEXT", notNull: true }),
        new Field({ name: "gym", type: "TEXT", notNull: true }),
        new Field(
            {
                name: "image", type: "TEXT", notNull: true,
                dumper: convertToLocalImage,
                loader: (image) => {
                    return {
                        uri: image
                    }
                }
            }
        ),
        new Field({ name: "angle", type: "INTEGER" }),
        new Field({ name: "is_public", type: "BOOLEAN", notNull: true, alias: "isPublic" }),
        new Field({
            name: "holds", type: "TEXT",
            dumper: JSON.stringify,
            loader: JSON.parse,
            alias: "configuredHolds"
        }),
        new Field({ name: "owner", type: "TEXT" }),
    ];
}

export class ProblemTable extends BaseTable {
    public static entity: typeof Entity = Problem;
    public static tableName: string = "problem";
    public static fields: Field[] = [
        ...BaseTable.getDefaultFields(),
        new Field({ name: "name", type: "TEXT", notNull: true }),
        new Field({ name: "owner_id", type: "TEXT", notNull: true, fk: UserTable.getField('id'), alias: "setter" }),
        new Field({ name: "wall_id", type: "TEXT", notNull: true, fk: WallTable.getField('id'), alias: "wallId" }),
        new Field({ name: "is_public", type: "BOOLEAN", default_: () => true, notNull: true, alias: "isPublic" }),
        new Field({
            name: "holds", type: "TEXT",
            dumper: JSON.stringify,
            loader: JSON.parse,
        }),
        new Field({ name: "grade", type: "INTEGER", notNull: true }),
    ];
}

export class GroupTable extends BaseTable {
    public static entity: typeof Entity = Group;
    public static tableName: string = "group_table";
    public static fields: Field[] = [
        ...BaseTable.getDefaultFields(),
        new Field({ name: "name", type: "TEXT", notNull: true }),
        new Field(
            {
                name: "image", type: "TEXT", notNull: true,
                dumper: convertToLocalImage,
                loader: (image) => {
                    return {
                        uri: image
                    }
                }
            }
        ),
    ];
}

export class GroupMemberTable extends BaseTable {
    public static tableName: string = "group_member";
    public static fields: Field[] = [
        ...BaseTable.getDefaultFields(),
        new Field({ name: "role", type: "TEXT", default_: () => "member", notNull: true }),
        new Field({ name: "user_id", type: "TEXT", notNull: true, fk: UserTable.getField('id') }),
        new Field({ name: "group_id", type: "TEXT", notNull: true, fk: GroupTable.getField('id') }),
    ];
}

export class GroupWallTable extends BaseTable {
    public static tableName: string = "group_wall";
    public static fields: Field[] = [
        ...BaseTable.getDefaultFields(),
        new Field({ name: "wall_id", type: "TEXT", notNull: true, fk: WallTable.getField('id') }),
        new Field({ name: "group_id", type: "TEXT", notNull: true, fk: GroupTable.getField('id') }),
    ];
    public static insert(data: { [key: string]: any; }, db: SQLiteDatabase): Promise<any> {
        return super.insert(data, db);
    }
}

export class GroupProblemTable extends BaseTable {
    public static tableName: string = "group_problem";
    public static fields: Field[] = [
        ...BaseTable.getDefaultFields(),
        new Field({ name: "problem_id", type: "TEXT", notNull: true, fk: ProblemTable.getField('id') }),
        new Field({ name: "group_id", type: "TEXT", notNull: true, fk: GroupTable.getField('id') }),
    ];
}

export class UserWallTable extends BaseTable {
    public static tableName: string = "user_wall";
    public static fields: Field[] = [
        ...BaseTable.getDefaultFields(),
        new Field({ name: "role", type: "TEXT", default_: () => "viewer", notNull: true }),
        new Field({ name: "user_id", type: "TEXT", notNull: true, fk: UserTable.getField('id') }),
        new Field({ name: "wall_id", type: "TEXT", notNull: true, fk: WallTable.getField('id') }),
    ];
}