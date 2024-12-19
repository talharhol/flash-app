import { User } from "../entities/user";
import { Wall } from "../entities/wall";
import { GroupMemberTable, UserTable, UserWallTable } from "../tables/tables";
import { BaseDAL } from "../BaseDAL";
import { collection, addDoc, Timestamp } from "firebase/firestore"; 


export class UserDAL extends BaseDAL<User> {

    public async Add(obj: User): Promise<User> {
        return await super.Add(obj);
    }

    public List(params: { groupId?: string }): User[] {
        let query = UserTable.query();
        if (params.groupId !== undefined) {
            query = query.Join(
                GroupMemberTable,
                GroupMemberTable.getField("user_id")!.eq(UserTable.getField("id")!)
            ).Filter(
                GroupMemberTable.getField("group_id")!.eq(params.groupId)
            );
        }
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

    public async AddWall(params: { wall_id: string, user_id: string }): Promise<void> {
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
