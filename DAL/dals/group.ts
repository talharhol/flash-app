import { Group } from "../entities/group";
import { BaseDAL } from "../BaseDAL";
import { GroupMemberTable, GroupProblemTable, GroupTable, GroupWallTable, WallTable } from "../tables/tables";
import { Wall } from "../entities/wall";

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

    public async Add(obj: Group): Promise<Group> {
        await super.Add(obj);
        await Promise.all([
            this.AddMembers(obj),
            this.AddWalls(obj),
            this.AddProblems(obj),
        ]);
        return obj;
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

    public async Update(obj: Group): Promise<Group> {
        await super.Update(obj);
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
        return obj;
    }
}