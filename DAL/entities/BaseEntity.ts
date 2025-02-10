import uuid from "react-native-uuid";
import { IDAL } from "../IDAL";
import { BaseTable } from "../tables/BaseTable";
import { collection, serverTimestamp, updateDoc, setDoc, doc } from "firebase/firestore"; 
import { ImageResolvedAssetSource } from "react-native";


export type EntityProps = {[key: string]: any} & { id?: string, dal?: IDAL, created_at?: number, updated_at?: number };

export class Entity {
    id: string;
    protected dal?: IDAL;
    createdAt: number;
    updatedAt: number;


    constructor(data: EntityProps) {
        this.id = data.id ?? uuid.v4() as string;
        this.dal = data.dal;
        this.updatedAt = data.updated_at ?? Date.now();
        this.createdAt = data.created_at ?? Date.now();
    }

    setDAL = (dal: IDAL) => {
        this.dal = dal;
    }

    public getDAL(): IDAL {
        return this.dal!
    }

    public toTable(table: typeof BaseTable):  { [key: string]: any } {
        let data = Object.assign<{}, { [key: string]: any }>({}, this);
        delete data.dal;
        delete data.setDAL;
        delete data.getDAL;
        delete data.createdAt;
        delete data.updatedAt;

        Object.keys(data).map(k => {
            // removeing all unrelated data
            if (k.startsWith("_")) delete data[k];
            else if (table.getField(k) === undefined) delete data[k];
        });
        return data
    }

    public toRemoteDoc(): { [key: string]: any } {
        return { "id": this.id, "isPublic": true };
    }

    protected async uploadImage(image: ImageResolvedAssetSource): Promise<{ commpressed: string, full: string }> {
        let commpressed = "";
        try {
            commpressed = await this.dal!.remoteStorage.uploadFile(
                await this.dal!.compressImage(image.uri), `wall/${this.id}/compresses`
            );
        }
        catch (e) {
            console.log(e);
        }
        return {
            commpressed: commpressed,
            full: await this.dal!.remoteStorage.uploadFile(
                image.uri, `wall/${this.id}/full`
            )
        };
    }

    protected async uploadAssets(data: { [key: string]: any }): Promise<{ [key: string]: any }> {
        return data
    }

    public shouldPushToRemote(): boolean {
        return true;
    }

    public async addToRemote(collectionName: string): Promise<void> {
        if (!this.shouldPushToRemote()) return;
        let dal = this.getDAL();
        try {
            let remoteDoc = await this.uploadAssets(this.toRemoteDoc());
            await setDoc(
                doc(dal.remoteDB, collectionName, this.id), 
                {
                    "updated_at": serverTimestamp(),
                    ...remoteDoc
                }
            );
        }
        catch (e) {
            console.log(e);
            alert("failed to push to server");
        }
    }

    public async deleteInRemote(collectionName: string): Promise<void> {
        if (!this.shouldPushToRemote()) return;
        let dal = this.getDAL();
        try {
            await updateDoc(
                doc(dal.remoteDB, collectionName, this.id), 
                {
                    "updated_at": serverTimestamp(),
                    "is_deleted": true
                }
            );
        }
        catch (e) {
            console.log(e);
            alert("failed to push update to server");
        }
    }

    public async updateInRemote(collectionName: string, extaData?: any): Promise<void> {
        if (!this.shouldPushToRemote()) return;
        let dal = this.getDAL();
        try {
            let remoteDoc = this.toRemoteDoc();
            await updateDoc(
                doc(dal.remoteDB, collectionName, this.id), 
                {
                    "updated_at": serverTimestamp(),
                    ...remoteDoc
                }
            );
        }
        catch (e) {
            console.log(e);
            alert("failed to push update to server");
        }
    }

    public static fromRemoteDoc(data: {[key: string]: any}, old?: Entity): Entity {
        return new this(data);
    }

};