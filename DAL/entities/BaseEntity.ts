import uuid from "react-native-uuid";
import { IDAL } from "../IDAL";
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

};