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

    public Add(obj: ObjType): ObjType {
        obj.setDAL(this._dal);
        this.table.insertFromEntity(obj).catch(console.log);
        this._objects[obj.id] = obj;
        return obj;
    }

    public Remove(obj: ObjType): boolean {
        // todo delete from DB
        return delete this._objects[obj.id];
    }

    public Update(obj: ObjType): ObjType {
        // todo update in DB
        return this._objects[obj.id] = obj;
    }

    public Get(params: { id: string }): ObjType {
        if (this._objects[params.id]) {
            return this._objects[params.id];
        }
        let result = this._dal.db!.getFirstSync<{[ket: string]: any}>(
            ...this.table.filter([this.table.getField("id")!.eq(params.id)])
        )
        let entity = this.table.toEntity(result!);
        entity.setDAL(this._dal);
        return entity as ObjType;
    }

    public List(params: {}): ObjType[] {
        let results = this._dal.db!.getAllSync<{[ket: string]: any}>(
            ...this.table.filter([])
        );
        return results.map(r => {
            let entity = this.table.toEntity(r);
            entity.setDAL(this._dal);
            return entity
        }) as ObjType[];
    }
}

export class UserDAL extends BaseDAL<User> {
    public GetWalls(params: {user_id: string}): Wall[] {
        let results = this._dal.db!.getAllSync<{ wall_id: string }>(
            ...UserWallTable.filter(
                [UserWallTable.getField("user_id")!.eq(params.user_id)],
                [UserWallTable.getField("wall_id")!]
            )
        )
        return results.map((w => {
            return this._dal.walls.Get({ id: w.wall_id });
        }))
    }
}

export class WallDAL extends BaseDAL<Wall> {
    public List(params: { isPublic?: boolean, name?: string, gym?: string }): Wall[] {
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
        let results = this._dal.db!.getAllSync<{[ket: string]: any}>(
            ...WallTable.filter(filters)
        );
        return results.map(r => {
            let entity = WallTable.toEntity(r);
            entity.setDAL(this._dal);
            return entity
        });
    }

    public Add(obj: Wall): Wall {
        let wall = super.Add(obj);
        UserWallTable.insert({
            wall_id: wall.id,
            user_id: this._dal.currentUser.id, // todo: use wall object
            role: "owner"
        }, this._dal.db!).then(() => wall);
        return wall;
    }
}

export class GroupDAL extends BaseDAL<Group> {
    public List(params: { userId: string }): Group[] {
        let groups = this._dal.db!.getAllSync<{group_id: string}>(
            ...GroupMemberTable.filter([GroupMemberTable.getField("user_id")!.eq(params.userId)])
        );
        
        return groups.map(g => this.Get({id: g.group_id}));
    }

    public Get(params: { id: string; }): Group {
        let group = this._dal.db!.getFirstSync<{[ket: string]: any}>(
            ...GroupTable.filter([GroupTable.getField("id")!.eq(params.id)])
        )!;
        let walls = this._dal.db!.getAllSync<{wall_id: string}>(
            ...GroupWallTable.filter([GroupWallTable.getField("group_id")!.eq(params.id)], [GroupWallTable.getField("wall_id")!])
        );
        let problems = this._dal.db!.getAllSync<{problem_id: string}>(
            ...GroupProblemTable.filter([GroupProblemTable.getField("group_id")!.eq(params.id)], [GroupProblemTable.getField("problem_id")!])
        );
        let members = this._dal.db!.getAllSync<{user_id: string}>(
            ...GroupMemberTable.filter([GroupMemberTable.getField("group_id")!.eq(params.id)], [GroupMemberTable.getField("user_id")!])
        );
        let admins = this._dal.db!.getAllSync<{user_id: string}>(
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
        let results = this._dal.db!.getAllSync<{[ket: string]: any}>(
            ...ProblemTable.filter(filters)
        );
        return results.map(r => {
            let entity = ProblemTable.toEntity(r);
            entity.setDAL(this._dal);
            return entity
        });
    }
}