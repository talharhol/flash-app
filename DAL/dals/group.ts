import { Group } from "../entities/group";
import { BaseDAL } from "../BaseDAL";
import { GroupMemberTable, GroupProblemTable, GroupTable, GroupWallTable, WallTable } from "../tables/tables";
import { Wall } from "../entities/wall";
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";
import { grades } from "@/constants/consts";
import { Problem } from "../entities/problem";

export class GroupDAL extends BaseDAL<Group> {
    public async AddProblem(params: { problem_id: string, group_id: string }): Promise<void> {
        await GroupProblemTable.insert({
            problem_id: params.problem_id,
            group_id: params.group_id
        }, this._dal.db!).catch(console.log);
    }

    public async AddWall(params: { wall_id: string, group_id: string }): Promise<void> {
        this._dal.walls.Get({id: params.wall_id}).fetchFullImage().catch(console.error);
        await GroupWallTable.insert({
            wall_id: params.wall_id,
            group_id: params.group_id
        }, this._dal.db!).catch(console.error);
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
                this.AddWall({ wall_id: wallId, group_id: obj.id})
            })
        );
    }

    public async AddMember(params: {user_id: string, group_id: string, role?: string}): Promise<void> {
        await GroupMemberTable.insert({
            user_id: params.user_id,
            group_id: params.group_id,
            role: params.role ?? "member"
        }, this._dal.db!).catch(console.error)
    }
    
    private async AddMembers(obj: Group): Promise<void> {
        await Promise.all(
            obj.members.map(async (userId: string) => {
                await this.AddMember({
                    user_id: userId,
                    group_id: obj.id,
                    role: obj.admins.includes(userId) ? "admin" : "member"
                })
            })
        );
    }

    private async AddProblems(obj: Group): Promise<void> {
        await Promise.all(
            obj.problems.map(async (problemId: string) => {
                this.AddProblem({problem_id: problemId, group_id: obj.id})
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
        let existingWalls = GroupWallTable.query().Filter(
            GroupWallTable.getField("group_id")!.eq(obj.id)
        ).Select([GroupWallTable.getField("wall_id")!])
        .All<{wall_id: string}>(this._dal.db!)
        .map(w => w.wall_id);
        let existingUsers = GroupMemberTable.query().Filter(
            GroupMemberTable.getField("group_id")!.eq(obj.id)
        ).Select([GroupMemberTable.getField("user_id")!])
        .All<{user_id: string}>(this._dal.db!)
        .map(w => w.user_id);
        let existingProblems = GroupProblemTable.query().Filter(
            GroupProblemTable.getField("group_id")!.eq(obj.id)
        ).Select([GroupProblemTable.getField("problem_id")!])
        .All<{problem_id: string}>(this._dal.db!)
        .map(p => p.problem_id);
        
        await Promise.all(
            obj.walls.filter(w => !existingWalls.includes(w)).map(
                w => this.AddWall({wall_id: w, group_id: obj.id})
            )
        );
        await Promise.all(
            obj.members.filter(u => !existingUsers.includes(u)).map(
                u => this.AddMember({
                    user_id: u,
                    group_id: obj.id,
                    role: obj.admins.includes(u) ? "admin" : "member"
                })
            )
        );
        await Promise.all(
            obj.problems.filter(p => !existingProblems.includes(p)).map(
                p => this.AddProblem({problem_id: p, group_id: obj.id})
            )
        );
        
        await GroupWallTable.delete(
            [
                GroupWallTable.getField("group_id")!.eq(obj.id),
                GroupWallTable.getField("wall_id")!.in(
                    existingWalls.filter(w => !obj.walls.includes(w))
                )
            ],
            this._dal.db!
        ).catch(console.error);
        
        await GroupMemberTable.delete(
            [
                GroupMemberTable.getField("group_id")!.eq(obj.id),
                GroupMemberTable.getField("user_id")!.in(
                    existingUsers.filter(u => !obj.members.includes(u))
                )
            ],
            this._dal.db!
        ).catch(console.error);

        await GroupProblemTable.delete(
            [
                GroupProblemTable.getField("group_id")!.eq(obj.id),
                GroupProblemTable.getField("problem_id")!.in(
                    existingProblems.filter(p => !obj.problems.includes(p))
                )
            ],
            this._dal.db!
        ).catch(console.error);
    }

    public async FetchFromRemote(since: Timestamp): Promise<void> {
        if (!this.remoteCollection || !this._dal.isLogin) return;
        console.log(`fetching ${this.remoteCollection}`)
        const q = query(
            collection(this._dal.remoteDB, this.remoteCollection), 
            where("updated_at", ">=", since ),
            where("isPublic", "==", true ),
            where("members", "array-contains", this._dal.currentUser.id)
        );
        let docs = await getDocs(q);
        docs.forEach(
            async doc => {
                let remoteData = doc.data();
                let existingEntity = this.List({id: doc.id})[0];
                if (remoteData.is_deleted === true) {
                    if (existingEntity) this.Remove(existingEntity);
                } else {
                    let entityObj = this.table.entity.fromRemoteDoc(remoteData, existingEntity) as Group;
                    await Promise.all(
                        entityObj.walls.map(
                            async wall_id => {
                                let walls = this._dal.walls.List({id: wall_id});
                                if (walls.length === 0) {
                                    await this._dal.walls.AddToLocal(
                                        Wall.fromRemoteDoc(await this._dal.walls.FetchSingleDoc(wall_id)) 
                                    )
                                }                                 
                            }
                        )
                    );
                    await Promise.all(
                        entityObj.problems.map(
                            async pid => {
                                let problems = this._dal.problems.List({id: pid});
                                if (problems.length === 0) {
                                    await this._dal.problems.AddToLocal(
                                        Problem.fromRemoteDoc(await this._dal.problems.FetchSingleDoc(pid)) 
                                    )
                                }
                            }
                        )
                    );
                    if (existingEntity !== undefined)
                        await this.UpdateLocal(entityObj as Group);
                    else 
                        await this.AddToLocal(entityObj as Group);
                }
            }
        );
    }
}