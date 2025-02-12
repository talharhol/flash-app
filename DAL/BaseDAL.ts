import { IDAL } from "./IDAL";
import { BaseTable } from "./tables/BaseTable";
import { Entity } from "./entities/BaseEntity";
import { collection, query, where, getDocs, Timestamp, getDoc, doc, Query } from "firebase/firestore";

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
        try {
            await this.table.insert(obj.toTable(this.table), this._dal.db!);
            this._dal.updateScreen();
        } catch (e) {
            console.error(`failed adding object to table ${this.table.tableName}`, e);
            throw `failed adding object to table ${this.table.tableName}`
        };
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


    public async RemoveLocal(obj: ObjType): Promise<void> {
        await this.table.delete([this.table.getField("id")!.eq(obj.id)], this._dal.db!);
        delete this._objects[obj.id];
        this._dal.updateScreen();
    }
    public async RemoveRemote(obj: ObjType): Promise<void> {
        if (!!this.remoteCollection) await obj.deleteInRemote(this.remoteCollection);

    }
    public async Remove(obj: ObjType): Promise<void> {
        await this.RemoveLocal(obj);
        this.RemoveRemote(obj).catch(console.error);
    }


    public async UpdateLocal(obj: ObjType): Promise<any> {
        let data = obj.toTable(this.table);
        delete data.id; // we never want to update the id
        data.updated_at = undefined // in order to update this field to the default value (Date.now)
        await this.table.update(
            [
                this.table.getField("id")!.eq(obj.id)
            ], data, this._dal.db!
        );
        this._dal.updateScreen();
    }

    public async UpdateRemote(obj: ObjType, extaData?: any): Promise<void> {
        if (!!this.remoteCollection) await obj.updateInRemote(this.remoteCollection, extaData);
    }

    public async Update(obj: ObjType): Promise<ObjType> {
        let updatedData = await this.UpdateLocal(obj);
        this.UpdateRemote(obj, updatedData);
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

    public async FetchSingleDoc(id: string): Promise<{ [key: string]: any }> {
        return (await getDoc(doc(this._dal.remoteDB, this.remoteCollection!, id))).data()!;
    }

    protected getRemoteFetchQuery(since: Timestamp): Query {
        return query(
            collection(this._dal.remoteDB, this.remoteCollection!),
            where("updated_at", ">=", since),
            where("isPublic", "==", true),
        );
    }

    public async FetchFromRemote(since: Timestamp): Promise<void> {
        if (!this.remoteCollection) return;
        console.log(`fetching ${this.remoteCollection}`)
        const q = this.getRemoteFetchQuery(since);
        let docs = await getDocs(q);
        docs.forEach(
            doc => {
                try {
                    let remoteData = doc.data();
                    let existingEntity = this.List({ id: doc.id })[0];
                    if (remoteData.is_deleted === true) {
                        if (existingEntity) this.Remove(existingEntity).catch(console.error);
                    } else {
                        let entityObj = this.table.entity.fromRemoteDoc(remoteData, existingEntity);
                        if (existingEntity !== undefined)
                            this.UpdateLocal(entityObj as ObjType).catch(console.error);
                        else
                            this.AddToLocal(entityObj as ObjType).catch(console.error);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        );
    }

    public dropCache(id: string) {
        delete this._objects[id];
    }
}
