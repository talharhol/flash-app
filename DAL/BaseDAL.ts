import { IDAL } from "./IDAL";
import { BaseTable } from "./tables/BaseTable";
import { Entity } from "./entities/BaseEntity";

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
