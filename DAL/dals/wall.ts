import { Wall } from "../entities/wall";
import { UserWallTable, WallTable } from "../tables/tables";
import { BaseDAL } from "../BaseDAL";
import { Filter, Query } from "../tables/BaseTable";
import { Image } from "react-native";
import uuid from "react-native-uuid";


export class WallDAL extends BaseDAL<Wall> {
    public GetListQuery(params: {
        isPublic?: boolean,
        name?: string,
        gym?: string,
        userId?: string,
        ids?: string[],
        id?: string,
        lat?: number,
        lng?: number,
        latest?: boolean,
        activeWallId?: string,
    }): Query {
        let filters: Filter[] = [];
        let selectedIds: string[] = [];
        if (params.id !== undefined) selectedIds.push(params.id);
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
        if (selectedIds.length > 0 || params.ids !== undefined || params.userId !== undefined) {
            filters.push(
                WallTable.getField("id")!.in(selectedIds)
            );
        }
        if (params.latest) {
            filters.push(
                WallTable.getField("active_wall_id")!.isNull()
            );
        }
        if (params.activeWallId !== undefined) {
            filters.push(
                WallTable.getField("active_wall_id")!.eq(params.activeWallId)
            );
        }

        let query = WallTable.query(filters);
        if (params.lat !== undefined && params.lng !== undefined) {
            let latField = WallTable.getField("lat")!.toSQL();
            let lngField = WallTable.getField("lng")!.toSQL();
            let cosLat = Math.cos(params.lat * Math.PI / 180);
            let f = {
                sql: `IFNULL((${latField} - ?) * (${latField} - ?) + (${lngField} - ?) * (${lngField} - ?) * ? * ?, 9e18)`,
                value: [params.lat, params.lat, params.lng, params.lng, cosLat, cosLat]
            };
            query.Sort(f, "ASC");
        }
        return query;
    }
    public List(params: {
        isPublic?: boolean,
        name?: string,
        gym?: string,
        userId?: string,
        ids?: string[],
        id?: string,
        lat?: number,
        lng?: number,
        latest?: boolean,
        activeWallId?: string,
    }): Wall[] {
        let query = this.GetListQuery(params);
        let results = query.All<{ [key: string]: any }>(this._dal.db!);
        return results.map(r => {
            let entity = WallTable.toEntity(r, Wall);
            entity.setDAL(this._dal);
            return entity
        });
    }

    public async AddToLocal(wall: Wall): Promise<void> {
        await super.AddToLocal(wall);
        if (wall.owner === this._dal.currentUser.id) {
            await this._dal.users.AddWall( {wall_id: wall.id, user_id: this._dal.currentUser.id}, "owner" );
        }
    }

    public async replaceWallImage(wallId: string, newImageUri: string): Promise<void> {
        const wall = this.Get({ id: wallId });

        const archiveWall = new Wall({
            id: uuid.v4() as string,
            name: wall.name,
            gym: wall.gym,
            image: wall.image,
            angle: wall.angle,
            configuredHolds: [...wall.configuredHolds],
            isPublic: wall.isPublic,
            owner: wall.owner,
            lat: wall.lat,
            lng: wall.lng,
            remoteImage: {},
            version: wall.version,
            activeWallId: wall.id,
        });
        archiveWall.setDAL(this._dal);
        await this.Add(archiveWall);

        wall.image = Image.resolveAssetSource({ uri: newImageUri });
        wall.configuredHolds = [];
        wall.version = wall.version + 1;
        if (wall.isPublic) {
            wall.remoteImage = await wall.uploadImage(wall.image);
        }
        await this.Update(wall);
    }
}
