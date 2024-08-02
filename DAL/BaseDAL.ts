import { IDAL } from "./IDAL";
import { Group } from "./entities/group";
import { Problem } from "./entities/problem";
import { User } from "./entities/user";
import { Wall } from "./entities/wall";
import { BaseTable } from "./tables/BaseTable";
import { Entity } from "./entities/BaseEntity";
import { GroupMemberTable, GroupProblemTable, GroupTable, GroupWallTable, ProblemTable, UserWallTable, WallTable } from "./tables/tables";

export class BaseDAL<
    ObjType extends Entity
> {
    protected _objects: { [key: string]: ObjType } = {};
    protected _dal: IDAL;
    public table: typeof BaseTable;

    constructor(dal: IDAL, table: typeof BaseTable) {
        this.table = table
        this._dal = dal;
    }

    public async Add(obj: ObjType): Promise<ObjType> {
        obj.setDAL(this._dal);
        this._objects[obj.id] = obj;
        await this.table.insertFromEntity(obj).catch(console.log);
        return obj;
    }

    public async Remove(obj: ObjType): Promise<void> {
        await this.table.delete([this.table.getField("id")!.eq(obj.id)], this._dal.db!)
        delete this._objects[obj.id];
    }

    public async Update(obj: ObjType): Promise<ObjType> {
        // todo update in DB
        return this._objects[obj.id] = obj;
    }

    public Get(params: { id: string }): ObjType {
        if (this._objects[params.id]) {
            return this._objects[params.id];
        }
        let result = this._dal.db!.getFirstSync<{ [ket: string]: any }>(
            ...this.table.filter([this.table.getField("id")!.eq(params.id)])
        );
        if (!result) {
            console.log("PROBLEMMMMMMMMMMMMMMMMMMMMMM");
            return null
        }
        let entity = this.table.toEntity(result!);
        entity.setDAL(this._dal);
        return entity as ObjType;
    }

    public List(params: {}): ObjType[] {
        let results = this._dal.db!.getAllSync<{ [ket: string]: any }>(
            ...this.table.filter([])
        );
        return results.map(r => {
            let entity = this.table.toEntity(r);
            entity.setDAL(this._dal);
            return entity
        }) as ObjType[];
    }

    public async Delete(params: { id: string }): Promise<void> {
        await this.table.delete([this.table.getField("id")!.eq(params.id)], this._dal.db!);
    }
}

export class UserDAL extends BaseDAL<User> {
    public GetWalls(params: { user_id: string, role?: string }): Wall[] {
        let filters = [UserWallTable.getField("user_id")!.eq(params.user_id)];
        if (params.role !== undefined) filters.push(UserWallTable.getField("role")!.eq(params.role));
        let results = this._dal.db!.getAllSync<{ wall_id: string }>(
            ...UserWallTable.filter(
                filters,
                [UserWallTable.getField("wall_id")!]
            )
        );

        return results.map((w => {
            return this._dal.walls.Get({ id: w.wall_id });
        })).filter(w => !!w)
    }

    public async AddWall(params: { wall_id: string, user_id: string }): Promise<void> {
        await UserWallTable.insert({
            wall_id: params.wall_id,
            user_id: params.user_id,
            role: "viewer"
        }, this._dal.db!);
    }

    public async RemoveWall(params: { wall_id: string, user_id: string }): Promise<void> {
        await UserWallTable.delete(
            [
                UserWallTable.getField("user_id")!.eq(params.user_id),
                UserWallTable.getField("wall_id")!.eq(params.wall_id),
                UserWallTable.getField("role")!.eq("viewer"),
            ], this._dal.db!);
    }


    public async asyncRemoveWall(params: { wall_id: string, user_id: string }): Promise<void> {
        let results = await this._dal.db!.getAllAsync<{ wall_id: string }>(
            ...UserWallTable.filter(
                [UserWallTable.getField("user_id")!.eq(params.user_id)],
                [UserWallTable.getField("wall_id")!]
            )
        )
        await UserWallTable.delete(
            [
                UserWallTable.getField("wall_id")!.in(results.map(r => r.wall_id)),
                UserWallTable.getField("role")!.neq("owner")
            ],
            this._dal.db!
        )
    }
}

export class WallDAL extends BaseDAL<Wall> {
    public List(params: { isPublic?: boolean, name?: string, gym?: string, userId?: string }): Wall[] {
        let filters = [];
        if (params.isPublic) {
            filters.push(
                WallTable.getField("is_public")!.eq(params.isPublic)
            );
        }
        if (params.name) {
            filters.push(
                WallTable.getField("name")!.like(params.name)
            );
        }
        if (params.gym) {
            filters.push(
                WallTable.getField("gym")!.like(params.gym)
            );
        }
        if (params.userId) {
            let walls = this._dal.db!.getAllSync<{ wall_id: string }>(
                ...UserWallTable.filter(
                    [UserWallTable.getField("user_id")!.eq(params.userId)],
                    [UserWallTable.getField("wall_id")!]
                )
            ).map(w => w.wall_id);
            filters.push(
                WallTable.getField("id")!.in(walls)
            );
        }

        let results = this._dal.db!.getAllSync<{ [ket: string]: any }>(
            ...WallTable.filter(filters)
        );
        return results.map(r => {
            let entity = WallTable.toEntity(r);
            entity.setDAL(this._dal);
            return entity
        });
    }

    public async Add(obj: Wall): Promise<Wall> {
        let wall = await super.Add(obj);
        await UserWallTable.insert({
            wall_id: wall.id,
            user_id: this._dal.currentUser.id, // todo: use wall object
            role: "owner"
        }, this._dal.db!);
        return wall;
    }
}

export class GroupDAL extends BaseDAL<Group> {
    public async AddProblem(params: { problem_id: string, group_id: string }): Promise<void> {
        await GroupProblemTable.insert({
            problem_id: params.problem_id,
            group_id: params.group_id
        }, this._dal.db!).catch(console.log);
    }

    public async AddWall(params: { wall_id: string, group_id: string }): Promise<void> {
        await GroupWallTable.insert({
            wall_id: params.wall_id,
            group_id: params.group_id
        }, this._dal.db!).catch(console.log);
    }

    public List(params: { userId: string }): Group[] {
        let groups = this._dal.db!.getAllSync<{ group_id: string }>(
            ...GroupMemberTable.filter(
                [
                    GroupMemberTable.getField("user_id")!.eq(params.userId),
                    GroupMemberTable.getField("role")!.eq("member"),
                ]
            )
        );

        return groups.map(g => this.Get({ id: g.group_id }));
    }

    public Get(params: { id: string; }): Group {
        let group = this._dal.db!.getFirstSync<{ [ket: string]: any }>(
            ...GroupTable.filter([GroupTable.getField("id")!.eq(params.id)])
        )!;
        let walls = this._dal.db!.getAllSync<{ wall_id: string }>(
            ...GroupWallTable.filter([GroupWallTable.getField("group_id")!.eq(params.id)], [GroupWallTable.getField("wall_id")!])
        );
        let problems = this._dal.db!.getAllSync<{ problem_id: string }>(
            ...GroupProblemTable.filter([GroupProblemTable.getField("group_id")!.eq(params.id)], [GroupProblemTable.getField("problem_id")!])
        );
        let members = this._dal.db!.getAllSync<{ user_id: string }>(
            ...GroupMemberTable.filter([GroupMemberTable.getField("group_id")!.eq(params.id)], [GroupMemberTable.getField("user_id")!])
        );
        let admins = this._dal.db!.getAllSync<{ user_id: string }>(
            ...GroupMemberTable.filter(
                [
                    GroupMemberTable.getField("group_id")!.eq(params.id),
                    GroupMemberTable.getField("role")!.eq("admin")
                ],
                [GroupMemberTable.getField("user_id")!]
            )
        );
        return new Group({
            id: group["id"],
            name: "name",
            image: {
                uri: group["image"]
            },
            admins: admins!.map(u => u.user_id),
            members: members!.map(u => u.user_id),
            walls: walls!.map(w => w.wall_id),
            problems: problems!.map(p => p.problem_id),
            dal: this._dal
        })
    }
}

export class ProblemDAL extends BaseDAL<Problem> {
    public List(params: { wallId: string, isPublic?: boolean }): Problem[] {
        let filters: [string, any][] = [
            ProblemTable.getField("wall_id")!.eq(params.wallId)
        ]
        if (params.isPublic !== undefined) {
            filters.push(ProblemTable.getField("is_public")!.eq(params.isPublic))
        }
        let results = this._dal.db!.getAllSync<{ [ket: string]: any }>(
            ...ProblemTable.filter(filters)
        );
        return results.map(r => {
            let entity = ProblemTable.toEntity(r);
            entity.setDAL(this._dal);
            return entity
        });
    }
}