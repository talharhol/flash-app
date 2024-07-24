import uuid from "react-native-uuid";
import { IDAL } from "../IDAL";
export interface EntityProps  { id?: string, dal?: IDAL };
export class Entity {
    id: string;
    protected dal?: IDAL;

    constructor({ id, dal }: EntityProps) {
        this.id = id || uuid.v4() as string;
        this.dal = dal;
    }

    setDAL = (dal: IDAL) => {
        this.dal = dal;
    }

    public getDAL(): IDAL {
        return this.dal!
    }

};