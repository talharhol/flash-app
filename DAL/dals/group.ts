import { Group } from "../entities/group";
import { BaseDAL } from "../BaseDAL";
import { GroupMemberTable, GroupProblemTable, GroupTable, GroupWallTable, WallTable } from "../tables/tables";
import { Wall } from "../entities/wall";
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";

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

    public List({userId, ...params}: { userId?: string } & { [ket: string]: any }): Group[] {
        let query = this.table.query();
        Object.keys(params)
         .filter(k => params[k] !== undefined)
         .map(
            k => {
                    query.Filter(this.table.getField(k)!.eq(params[k]));
                }
            )
        if (userId !== undefined) {
            query.Join(
                GroupMemberTable, 
                GroupMemberTable.getField("group_id")!.eq(this.table.getField("id")!)
            ).Filter(
                GroupMemberTable.getField("user_id")!.eq(userId)
            )
        }
        let results = query.All<{ [key: string]: any; }>(this._dal.db!);
        return results.map(r => {
            let entity = this.table.toEntity(r);
            entity.setDAL(this._dal);
            return entity
        }) as Group[];
    }

    public async AddToLocal(obj: Group): Promise<void> {
        await super.AddToLocal(obj);
        await Promise.all([
            this.AddMembers(obj),
            this.AddWalls(obj),
            this.AddProblems(obj),
        ]);
    }

    private async AddWalls(obj: Group): Promise<void> {
        await Promise.all(
            obj.walls.map(wallId => {
                GroupWallTable.insert({
                    wall_id: wallId,
                    group_id: obj.id,
                }, this._dal.db!).catch(console.log)
            })
        );
    }
    private async AddMembers(obj: Group): Promise<void> {
        await Promise.all(
            obj.members.map(userId => {
                return GroupMemberTable.insert({
                    user_id: userId,
                    group_id: obj.id,
                    role: obj.admins.includes(userId) ? "admin" : "member"
                }, this._dal.db!).catch(console.log)
            })
        );
    }
    private async AddProblems(obj: Group): Promise<void> {
        await Promise.all(
            obj.problems.map(problemId => {
                return GroupProblemTable.insert({
                    problem_id: problemId,
                    group_id: obj.id,
                }, obj.getDAL().db!).catch(console.log)
            })
        );
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
            id: group.id,
            name: group.name,
            image: group.image,
            admins: admins!.map(u => u.user_id),
            members: members!.map(u => u.user_id),
            walls: walls!.map(w => w.wall_id),
            problems: problems!.map(p => p.problem_id),
            dal: this._dal
        })
    }

    public GetPrivateWalls(obj: Group): Wall[] {
        return WallTable.query()
        .Join(GroupWallTable, GroupWallTable.getField("wall_id")!.eq(WallTable.getField("id")))
        .Filter(GroupWallTable.getField("group_id")!.eq(obj.id))
        .Filter(WallTable.getField("is_public")!.eq(false))
        .All<{ wall_id: string }>(this._dal.db!)
        .map(
            w => WallTable.toEntity(w)
        );
    }

    public async UpdateLocal(obj: Group): Promise<void> {
        await super.UpdateLocal(obj);
        GroupMemberTable.delete(
            [GroupMemberTable.getField("group_id")!.eq(obj.id)],
            this._dal.db!
        ).catch(console.log);
        let updateableWalls = this.GetPrivateWalls(obj);
        GroupWallTable.delete(
            [
                GroupWallTable.getField("group_id")!.eq(obj.id),
                GroupWallTable.getField("wall_id")!.in(updateableWalls.map(w => w.id))
            ],
            this._dal.db!
        ).catch(console.log);
        await Promise.all([
            this.AddMembers(obj),
            this.AddWalls(obj),
        ]);
    }

}