import uuid from "react-native-uuid";
import { Hold } from "./hold";
export class Problem {
    id: string;
    name: string;
    wallId: string;
    grade: number;
    holds: Hold[];
    constructor({ id, name, wallId, grade, holds }: {id?: string, name: string, wallId: string, grade: number, holds: Hold[] }) {
        this.id = id || uuid.v4() as string;
        this.name = name;
        this.wallId = wallId;
        this.grade = grade;
        this.holds = holds;
    }
};