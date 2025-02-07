import { User } from "../entities/user";
import { Wall } from "../entities/wall";
import { GroupMemberTable, UserConfigTable, UserTable, UserWallTable } from "../tables/tables";
import { BaseDAL } from "../BaseDAL";


export class UserDAL extends BaseDAL<User> {
    public List(params: { groupId?: string } & { [ket: string]: any }): User[] {
        let query = UserTable.query();
        if (params.groupId !== undefined) {
            query = query.Join(
                GroupMemberTable,
                GroupMemberTable.getField("user_id")!.eq(UserTable.getField("id")!)
            ).Filter(
                GroupMemberTable.getField("group_id")!.eq(params.groupId)
            );
        }
        delete params.groupId;
        Object.keys(params)
         .filter(k => params[k] !== undefined)
         .map(
            k => {
                    query.Filter(this.table.getField(k)!.eq(params[k]));
                }
            )
        let results = query.All<{ [key: string]: any; }>(this._dal.db!);
        return results.map(r => {
            let entity = UserTable.toEntity(r, User);
            entity.setDAL(this._dal);
            return entity
        });

    }

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
            isPublic: params.isPublic,
        });
    }

    public async AddWall(params: { wall_id: string, user_id: string }, role?: string): Promise<void> {
        let existing = await UserWallTable.getAll(
            ...UserWallTable.filter(
                [
                    UserWallTable.getField("user_id")!.eq(params.user_id),
                    UserWallTable.getField("wall_id")!.eq(params.wall_id),
                ]
            ),
            this._dal.db!
        );
        if (existing.length === 0)
            await UserWallTable.insert({
                wall_id: params.wall_id,
                user_id: params.user_id,
                role: role ?? "viewer"
            }, this._dal.db!);
            let wall = this._dal.walls.Get({id: params.wall_id});
            wall.fetchFullImage().catch(console.error);
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

    public async FetchUserData(): Promise<void> {
        console.log("fetching user data")
        let currOwned = this._dal.currentUser.ownedWalls.map(w => w.id);
        let currViewer = this._dal.currentUser.viewerWalls.map(w => w.id);
        let remote = await this._dal.users.FetchSingleDoc(this._dal.currentUser.id);
        this._dal.currentUser.name = remote.name;
        await Promise.all(remote.owenedWalls.map(async (wallId: string) => {
            if (currOwned.includes(wallId)) return;
            await this._dal.currentUser.addWall(wallId, "owner", false).catch(e => console.error(`failed adding wall ${wallId} to user`, e));
        }));
        await Promise.all(remote.viewerWalls.map(async (wallId: string) => {
            if (currViewer.includes(wallId)) return;
            await this._dal.currentUser.addWall(wallId, "viewer", false).catch(e => console.error(`failed adding wall ${wallId} to user`, e));
        }));
        this._dal.currentUser.shouldFetchUserData = false;
        this.Update(this._dal.currentUser);
    }

    public async CreateConfig(params: {user_id: string, last_pulled?: number, should_fetch_user_data?: boolean, login_counter?: number}): Promise<void> {
        await UserConfigTable.insert(params, this._dal.db!);
    }

    public getLastPulled(user: User): number {
        let conig = UserConfigTable.query()
        .Filter(UserConfigTable.getField("user_id")!.eq(user.id))
        .Select([UserConfigTable.getField("last_pulled")!])
        .All<{last_pulled: number}>(this._dal.db!)[0];

        if (conig) return conig.last_pulled;
        return 0;
    }

    public async setLastPulled(user: User, value: number): Promise<void> {
        await UserConfigTable.update(
            [UserConfigTable.getField("user_id")!.eq(user.id)],
            { last_pulled: value },
            this._dal.db!
        );
    }

    public getShouldFetchUserData(user: User): boolean {
        let conig = UserConfigTable.query()
        .Filter(UserConfigTable.getField("user_id")!.eq(user.id))
        .Select([UserConfigTable.getField("should_fetch_user_data")!])
        .All<{should_fetch_user_data: boolean}>(this._dal.db!)[0];
        if (conig) return conig.should_fetch_user_data;
        return false;
    }

    public async setShouldFetchUserData(user: User, value: boolean): Promise<void> {
        await UserConfigTable.update(
            [UserConfigTable.getField("user_id")!.eq(user.id)],
            { should_fetch_user_data: value },
            this._dal.db!
        );
    }

    public getLoginCount(user: User): number {
        let conig = UserConfigTable.query()
        .Filter(UserConfigTable.getField("user_id")!.eq(user.id))
        .Select([UserConfigTable.getField("login_counter")!])
        .All<{login_counter: number}>(this._dal.db!)[0];

        if (conig) return conig.login_counter;
        return 0;
    }

    public async setLoginCount(user: User, value: number): Promise<void> {
        await UserConfigTable.update(
            [UserConfigTable.getField("user_id")!.eq(user.id)],
            { login_counter: value },
            this._dal.db!
        );
    }
}
