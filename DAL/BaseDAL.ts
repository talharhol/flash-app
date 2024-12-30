import { IDAL } from "./IDAL";
import { BaseTable } from "./tables/BaseTable";
import { Entity } from "./entities/BaseEntity";
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from "firebase/firestore";

export class BaseDAL<
    ObjType extends Entity
> {
    protected _objects: { [key: string]: ObjType } = {};
    protected _dal: IDAL;
    public table: typeof BaseTable;
    protected remoteCollection?: string;

    constructor(dal: IDAL, table: typeof BaseTable, remoteCollection?: string) {
        this.table = table
        this._dal = dal;
        this.remoteCollection = remoteCollection;
    }

    public async AddToLocal(obj: ObjType): Promise<void> {
        await this.table.insert(obj.toTable(this.table), this._dal.db!).catch(console.log);
    }

    public async AddToRemote(obj: ObjType): Promise<void> {
        if (!!this.remoteCollection) obj.addToRemote(this.remoteCollection);
    }

    public async Add(obj: ObjType): Promise<ObjType> {
        obj.setDAL(this._dal);
        this._objects[obj.id] = obj;
        await this.AddToLocal(obj);
        await this.AddToRemote(obj);
        return obj;
    }

    public async Remove(obj: ObjType): Promise<void> {
        await this.table.delete([this.table.getField("id")!.eq(obj.id)], this._dal.db!);
        delete this._objects[obj.id];
        if (!!this.remoteCollection) obj.deleteInRemote(this.remoteCollection).catch(console.error);
    }
    public async UpdateLocal(obj: ObjType): Promise<void> {
        let data = obj.toTable(this.table);
        delete data.id; // we never want to update the id
        data.updated_at = undefined // in order to update this field to the default value (Date.now)
        await this.table.update(
            [
                this.table.getField("id")!.eq(obj.id)
            ], data, this._dal.db!
        )
    }
    
    public async UpdateRemote(obj: ObjType): Promise<void> {
        if (!!this.remoteCollection) await obj.updateInRemote(this.remoteCollection);
    }

    public async Update(obj: ObjType): Promise<ObjType> {
        await this.UpdateLocal(obj);
        this.UpdateRemote(obj);
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

    public async Delete(params: { [key: string]: any }): Promise<void> {
        await this.table.delete(
            Object.keys(params)
            .filter( k => this.table.getField(k) !== undefined )
            .map(
                k => this.table.getField(k)!.eq(params[k])
            ),
            this._dal.db!
        );
    }

    public async FetchSingleDoc(id: string): Promise<{[key: string]: any}> {
        return (await getDoc(doc(this._dal.remoteDB, this.remoteCollection!, id))).data()!;
    }

    public async FetchFromRemote(since: Timestamp): Promise<void> {
        if (!this.remoteCollection) return;
        console.log(`fetching ${this.remoteCollection}`)
        const q = query(
            collection(this._dal.remoteDB, this.remoteCollection), 
            where("updated_at", ">=", since ),
            where("isPublic", "==", true ),
        ); 
        let docs = await getDocs(q);
        docs.forEach(
            doc => {
                let remoteData = doc.data();
                let existingEntity = this.List({id: doc.id})[0];
                if (remoteData.is_deleted === true) {
                    if (existingEntity) this.Remove(existingEntity);
                } else {
                    let entityObj = this.table.entity.fromRemoteDoc(remoteData, existingEntity);
                    if (existingEntity !== undefined)
                        this.UpdateLocal(entityObj as ObjType);
                    else 
                        this.AddToLocal(entityObj as ObjType);
                }
            }
        );
    }

    public dropCache(id: string) {
        delete this._objects[id];
    }
}
