import { Wall } from "../entities/wall";
import { UserWallTable, WallTable } from "../tables/tables";
import { BaseDAL } from "../BaseDAL";


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
        if (wall.owner === this._dal.currentUser.id) {
            await UserWallTable.insert({
                wall_id: wall.id,
                user_id: this._dal.currentUser.id,
                role: "owner"
            }, this._dal.db!);
        }
        return wall;
    }
}
