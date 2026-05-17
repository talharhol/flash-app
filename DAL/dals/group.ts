import { Group, UpdatedData } from "../entities/group";
import { BaseDAL } from "../BaseDAL";
import { GroupMemberTable, GroupProblemTable, GroupTable, GroupWallTable, WallTable } from "../tables/tables";
import { Wall } from "../entities/wall";
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";
import { Problem } from "../entities/problem";



export class GroupDAL extends BaseDAL<Group> {
    public async AddProblem(params: { problem_id: string, group_id: string }): Promise<void> {
        await GroupProblemTable.insert({
            problem_id: params.problem_id,
            group_id: params.group_id
        }, this._dal.db!).catch(e => console.error(`failed adding problem ${params.problem_id}`, e));
    }

    public async AddWall(params: { wall_id: string, group_id: string }): Promise<void> {
        this._dal.walls.Get({id: params.wall_id}).fetchFullImage().catch(console.error);
        await GroupWallTable.insert({
            wall_id: params.wall_id,
            group_id: params.group_id
        }, this._dal.db!).catch(e => console.error(`failed adding wall ${params}`, e));
    }

    public List({userId, ...params}: { userId?: string } & { [ket: string]: any }): Group[] {
        let query = GroupTable.query();
        Object.keys(params)
         .filter(k => params[k] !== undefined)
         .map(
            k => {
                    query.Filter(GroupTable.getField(k)!.eq(params[k]));
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
            return this.Get({id: r.id})
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

    private fetchExistingGroupState(groupId: string): { walls: string[]; members: string[]; admins: string[]; problems: string[] } {
        const walls = GroupWallTable.query()
            .Filter(GroupWallTable.getField("group_id")!.eq(groupId))
            .Select([GroupWallTable.getField("wall_id")!])
            .All<{ wall_id: string }>(this._dal.db!)
            .map(w => w.wall_id);

        const members = GroupMemberTable.query()
            .Filter(GroupMemberTable.getField("group_id")!.eq(groupId))
            .Select([GroupMemberTable.getField("user_id")!])
            .All<{ user_id: string }>(this._dal.db!)
            .map(u => u.user_id);

        const admins = GroupMemberTable.query()
            .Filter(GroupMemberTable.getField("group_id")!.eq(groupId))
            .Filter(GroupMemberTable.getField("role")!.eq("admin"))
            .Select([GroupMemberTable.getField("user_id")!])
            .All<{ user_id: string }>(this._dal.db!)
            .map(u => u.user_id);

        const problems = GroupProblemTable.query()
            .Filter(GroupProblemTable.getField("group_id")!.eq(groupId))
            .Select([GroupProblemTable.getField("problem_id")!])
            .All<{ problem_id: string }>(this._dal.db!)
            .map(p => p.problem_id);

        return { walls, members, admins, problems };
    }

    private async syncWallRecords(obj: Group, existingWalls: string[]): Promise<{ added: string[]; removed: string[] }> {
        const added = obj.walls.filter(w => !existingWalls.includes(w));
        const removed = existingWalls.filter(w => !obj.walls.includes(w));

        await Promise.all(added.map(w => this.AddWall({ wall_id: w, group_id: obj.id })));
        if (removed.length > 0) {
            await GroupWallTable.delete(
                [GroupWallTable.getField("group_id")!.eq(obj.id), GroupWallTable.getField("wall_id")!.in(removed)],
                this._dal.db!
            ).catch(console.error);
            const removedWalls = this._dal.walls.List({ ids: removed });
            await Promise.all(
                removedWalls
                    .filter(w => !w.isPublic)
                    .map(w => this._dal.walls.Remove(w).catch(console.error))
            );
        }
        return { added, removed };
    }

    private async syncMemberRecords(obj: Group, existingMembers: string[], existingAdmins: string[]): Promise<{ added: string[]; removed: string[] }> {
        const added = obj.members.filter(u => !existingMembers.includes(u));
        const removed = existingMembers.filter(u => !obj.members.includes(u));

        await Promise.all(added.map(u => this.AddMember({
            user_id: u,
            group_id: obj.id,
            role: obj.admins.includes(u) ? "admin" : "member",
        })));

        // Update role for existing members whose admin status changed
        const retained = obj.members.filter(u => existingMembers.includes(u));
        await Promise.all(
            retained
                .filter(u => obj.admins.includes(u) !== existingAdmins.includes(u))
                .map(u => GroupMemberTable.update(
                    [GroupMemberTable.getField("group_id")!.eq(obj.id), GroupMemberTable.getField("user_id")!.eq(u)],
                    { role: obj.admins.includes(u) ? "admin" : "member" },
                    this._dal.db!
                ).catch(console.error))
        );

        if (removed.length > 0) {
            await GroupMemberTable.delete(
                [GroupMemberTable.getField("group_id")!.eq(obj.id), GroupMemberTable.getField("user_id")!.in(removed)],
                this._dal.db!
            ).catch(console.error);
        }
        return { added, removed };
    }

    private async syncProblemRecords(obj: Group, existingProblems: string[]): Promise<{ added: string[]; removed: string[] }> {
        const added = obj.problems.filter(p => !existingProblems.includes(p));
        const removed = existingProblems.filter(p => !obj.problems.includes(p));

        await Promise.all(added.map(p => this.AddProblem({ problem_id: p, group_id: obj.id })));
        if (removed.length > 0) {
            await GroupProblemTable.delete(
                [GroupProblemTable.getField("group_id")!.eq(obj.id), GroupProblemTable.getField("problem_id")!.in(removed)],
                this._dal.db!
            ).catch(console.error);
        }
        return { added, removed };
    }

    private computeAdminDiff(obj: Group, existingAdmins: string[]): { added: string[]; removed: string[] } {
        return {
            added: obj.admins.filter(u => !existingAdmins.includes(u)),
            removed: existingAdmins.filter(u => !obj.admins.includes(u)),
        };
    }

    public async UpdateLocal(obj: Group): Promise<UpdatedData> {
        await super.UpdateLocal(obj);

        const existing = this.fetchExistingGroupState(obj.id);

        const [wallDiff, memberDiff, problemDiff] = await Promise.all([
            this.syncWallRecords(obj, existing.walls),
            this.syncMemberRecords(obj, existing.members, existing.admins),
            this.syncProblemRecords(obj, existing.problems),
        ]);

        return {
            walls: wallDiff,
            problems: problemDiff,
            membes: memberDiff,
            admins: this.computeAdminDiff(obj, existing.admins),
        };
    }

    private async resolveGroupWalls(entityObj: Group): Promise<void> {
        const wallsToRemove = new Set<string>();
        await Promise.all(
            entityObj.walls.map(async wall_id => {
                if (this._dal.walls.List({ id: wall_id }).length > 0) return;
                const remoteWall = await this._dal.walls.FetchSingleDoc(wall_id);
                if (remoteWall === undefined || remoteWall.is_deleted) {
                    wallsToRemove.add(wall_id);
                } else {
                    await this._dal.walls.AddToLocal(Wall.fromRemoteDoc(remoteWall));
                }
            })
        ).catch(console.error);
        entityObj.walls = entityObj.walls.filter(id => !wallsToRemove.has(id));
    }

    private async resolveGroupProblems(entityObj: Group): Promise<void> {
        const problemsToRemove = new Set<string>();
        await Promise.all(
            entityObj.problems.map(async pid => {
                if (this._dal.problems.List({ id: pid }).length > 0) return;
                const remoteProblem = await this._dal.problems.FetchSingleDoc(pid);
                if (remoteProblem === undefined || remoteProblem.is_deleted) {
                    problemsToRemove.add(pid);
                } else {
                    try {
                        await this._dal.problems.AddToLocal(Problem.fromRemoteDoc(remoteProblem));
                    } catch {
                        console.log(`failed adding problem ${pid}, removing`);
                        problemsToRemove.add(pid);
                    }
                }
            })
        ).catch(console.error);
        entityObj.problems = entityObj.problems.filter(id => !problemsToRemove.has(id));
    }

    private async syncGroupDoc(remoteData: any, docId: string): Promise<void> {
        const existingEntity = this.List({ id: docId })[0];
        if (remoteData.is_deleted === true) {
            if (existingEntity) await this.Remove(existingEntity).catch(console.error);
            return;
        }
        const entityObj = Group.fromRemoteDoc(remoteData, existingEntity);
        await this.resolveGroupWalls(entityObj);
        await this.resolveGroupProblems(entityObj);
        if (existingEntity !== undefined) {
            await this.UpdateLocal(entityObj as Group);
        } else {
            await this.AddToLocal(entityObj as Group);
        }
    }

    public async FetchFromRemote(since: Timestamp): Promise<void> {
        if (!this.remoteCollection || !this._dal.isLogin) return;
        console.log(`fetching ${this.remoteCollection}`);
        const q = query(
            collection(this._dal.remoteDB, this.remoteCollection),
            where("updated_at", ">=", since),
            where("members", "array-contains", this._dal.currentUser.id)
        );
        const docs = await getDocs(q);
        await Promise.all(
            docs.docs.map(async doc => {
                try {
                    await this.syncGroupDoc(doc.data(), doc.id);
                } catch (e) {
                    console.error(e);
                }
            })
        );
    }
}