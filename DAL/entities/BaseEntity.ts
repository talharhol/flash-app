import uuid from "react-native-uuid";
import { IDAL } from "../IDAL";
import { BaseTable } from "../tables/BaseTable";
import { collection, serverTimestamp, updateDoc, setDoc, doc } from "firebase/firestore"; 
import { ImageResolvedAssetSource } from "react-native";


export type EntityProps = {[key: string]: any} & { id?: string, dal?: IDAL };

export class Entity {
    id: string;
    protected dal?: IDAL;

    constructor(data: EntityProps) {
        this.id = data.id || uuid.v4() as string;
        this.dal = data.dal;
    }

    setDAL = (dal: IDAL) => {
        this.dal = dal;
    }

    public getDAL(): IDAL {
        return this.dal!
    }

    public toTable(table: typeof BaseTable):  { [key: string]: any } {
        let data = Object.assign<{}, { [key: string]: any }>({}, this);
        delete data.dal
        delete data.setDAL
        delete data.getDAL
        Object.keys(data).map(k => {
            // removeing all unrelated data
            if (k.startsWith("_")) delete data[k];
            else if (table.getField(k) === undefined) delete data[k];
        });
        return data
    }

    public toRemoteDoc(): { [key: string]: any } {
        return { "id": this.id };
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

    public async addToRemote(collectionName: string): Promise<void> {
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

    public async updateInRemote(collectionName: string): Promise<void> {
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

};