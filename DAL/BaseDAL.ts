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
        obj.setDAL(this._dal);
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

    protected getRemoteFetchQuery(since: Timestamp, extraData?: any): Query {
        return query(
            collection(this._dal.remoteDB, this.remoteCollection!),
            where("updated_at", ">=", since),
            where("isPublic", "==", true),
        );
    }

    public async FetchFromRemote(since: Timestamp, extraData?: any): Promise<void> {
        if (!this.remoteCollection) return;
        console.log(`fetching ${this.remoteCollection}`)
        const q = this.getRemoteFetchQuery(since, extraData);
        let docs = await getDocs(q);

        const toUpdate: ObjType[] = [];
        const toAdd: ObjType[] = [];
        const toDelete: ObjType[] = [];

        docs.forEach(doc => {
            try {
                let remoteData = doc.data();
                let existingEntity = this.List({ id: doc.id })[0];
                if (remoteData.is_deleted === true) {
                    if (existingEntity) toDelete.push(existingEntity);
                } else {
                    let entityObj = this.table.entity.fromRemoteDoc(remoteData, existingEntity) as ObjType;
                    if (existingEntity !== undefined)
                        toUpdate.push(entityObj);
                    else
                        toAdd.push(entityObj);
                }
            } catch (e) {
                console.error(e);
            }
        });

        await Promise.all(toUpdate.map(e => this.UpdateLocal(e).catch(console.error)));
        await Promise.all(toAdd.map(e => this.AddToLocal(e).catch(console.error)));
        await Promise.all(toDelete.map(e => this.RemoveLocal(e).catch(console.error)));
    }

    public dropCache(id: string) {
        delete this._objects[id];
    }
}
