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
        let data = this.table.fromEntity(obj);
        delete data.id; // we never want to update the id
        data.updated_at = undefined // in order to update this field to the default value (Date.now)
        await this.table.update(
            [
                this.table.getField("id")!.eq(obj.id)
            ], data, this._dal.db!
        )
        return this._objects[obj.id] = obj;
    }

    public Get(params: { [ket: string]: any }): ObjType {
        if (this._objects[params.id]) {
            return this._objects[params.id];
        }
        let result = this.table.getFirst(
            ...this.table.filter(
                Object.keys(params).map(k => this.table.getField(k)!.eq(params[k]))
            ),
            this._dal.db!
        );
        let entity = this.table.toEntity(result!);
        entity.setDAL(this._dal);
        return entity as ObjType;
    }

    public List(params: { [ket: string]: any }): ObjType[] {
        let results = this.table.getAll<{ [ket: string]: any }>(
            ...this.table.filter(
                Object.keys(params)
                    .filter(k => params[k] !== undefined)
                    .map(k => this.table.getField(k)!.eq(params[k]))
            ),
            this._dal.db!
        );
        return results.map(r => {
            let entity = this.table.toEntity(r);
            entity.setDAL(this._dal);
            return entity
        }) as ObjType[];
    }

    public async Delete(params: { [ket: string]: any }): Promise<void> {
        let filters = this.table.fromEntity(params);
        await this.table.delete(
            Object.keys(filters).map(
                k => this.table.getField(k)!.eq(params[k])
            ), 
            this._dal.db!
        );
    }
}

export class UserDAL extends BaseDAL<User> {
    public GetWalls(params: { user_id: string, role?: string, isPublic?: boolean }): Wall[] {
        let filters = [
            UserWallTable.getField("user_id")!.eq(params.user_id),
        ];
        if (params.role !== undefined) filters.push(UserWallTable.getField("role")!.eq(params.role));
        let results = UserWallTable.getAll<{ wall_id: string }>(
            ...UserWallTable.filter(
                filters,
                [UserWallTable.getField("wall_id")!]
            ), this._dal.db!
        );

        return this._dal.walls.List({
            ids: results.map(w => w.wall_id),
            isPublic: params.isPublic === undefined ? true : params.isPublic
        });
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

    public async RemoveGroup(params: { group_id: string, user_id: string }): Promise<void> {
        await GroupMemberTable.delete(
            [
                GroupMemberTable.getField("user_id")!.eq(params.user_id),
                GroupMemberTable.getField("group_id")!.eq(params.group_id),
            ], this._dal.db!);
    }


}

export class WallDAL extends BaseDAL<Wall> {
    public List(params: {
        isPublic?: boolean,
        name?: string,
        gym?: string,
        userId?: string,
        ids?: string[]
    }): Wall[] {
        let filters = [];
        let selectedIds: string[] = [];
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
        if (params.ids) {
            selectedIds = selectedIds.concat(params.ids);
        }
        if (params.userId) {
            let walls = this._dal.db!.getAllSync<{ wall_id: string }>(
                ...UserWallTable.filter(
                    [UserWallTable.getField("user_id")!.eq(params.userId)],
                    [UserWallTable.getField("wall_id")!]
                )
            ).map(w => w.wall_id);
            selectedIds = selectedIds.concat(walls);
        }
        if (params.ids || params.userId) {
            filters.push(
                WallTable.getField("id")!.in(selectedIds)
            );
        }

        let results = this.table.getAll<{ [key: string]: any }>(
            ...WallTable.filter(filters), this._dal.db!
        )

        return results.map(r => {
            let entity = WallTable.toEntity(r, Wall);
            entity.setDAL(this._dal);
            return entity
        });
    }

    public async Add(obj: Wall): Promise<Wall> {
        let wall = await super.Add(obj);
        await UserWallTable.insert({
            wall_id: wall.id,
            user_id: this._dal.currentUser.id,
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
        let groups = GroupMemberTable.getAll<{ group_id: string }>(...GroupMemberTable.filter(
            [
                GroupMemberTable.getField("user_id")!.eq(params.userId),
            ],
            [GroupMemberTable.getField("group_id")!]
        ), this._dal.db!);
        return groups.map(g => this.Get({ id: g.group_id }));
    }

    public Get(params: { id: string; }): Group {
        let group = GroupTable.getFirst<{ [ket: string]: any }>(
            ...GroupTable.filter([GroupTable.getField("id")!.eq(params.id)]),
            this._dal.db!
        )!;

        let walls = GroupWallTable.getAll<{ wall_id: string }>(
            ...GroupWallTable.filter(
                [GroupWallTable.getField("group_id")!.eq(params.id)],
                [GroupWallTable.getField("wall_id")!]
            ),
            this._dal.db!
        );
        let problems = GroupProblemTable.getAll<{ problem_id: string }>(
            ...GroupProblemTable.filter(
                [GroupProblemTable.getField("group_id")!.eq(params.id)],
                [GroupProblemTable.getField("problem_id")!]
            ), this._dal.db!
        );
        let members = GroupMemberTable.getAll<{ user_id: string }>(
            ...GroupMemberTable.filter(
                [GroupMemberTable.getField("group_id")!.eq(params.id)],
                [GroupMemberTable.getField("user_id")!]
            ), this._dal.db!
        );
        let admins = GroupMemberTable.getAll<{ user_id: string }>(
            ...GroupMemberTable.filter(
                [
                    GroupMemberTable.getField("group_id")!.eq(params.id),
                    GroupMemberTable.getField("role")!.eq("admin")
                ],
                [GroupMemberTable.getField("user_id")!]
            ), this._dal.db!
        );

        return new Group({
            id: group["id"],
            name: "name",
            image: group["image"],
            admins: admins!.map(u => u.user_id),
            members: members!.map(u => u.user_id),
            walls: walls!.map(w => w.wall_id),
            problems: problems!.map(p => p.problem_id),
            dal: this._dal
        })
    }
}

export class ProblemDAL extends BaseDAL<Problem> {

}