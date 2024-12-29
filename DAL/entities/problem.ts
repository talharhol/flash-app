import { HoldInterface } from "../hold";
import { Entity, EntityProps } from "./BaseEntity";
import { Wall } from "./wall";

export type ProblemProps = EntityProps &  { name: string, wallId: string, grade: number, holds: HoldInterface[], setter: string, isPublic?: boolean};

export class Problem extends Entity {
    name: string;
    wallId: string;
    grade: number;
    holds: HoldInterface[];
    setter: string;
    isPublic: boolean;
    constructor({ name, wallId, grade, holds, setter, isPublic, ...props }: ProblemProps) {
        super(props);
        this.name = name;
        this.wallId = wallId;
        this.grade = grade;
        this.holds = holds;
        this.setter = setter;
        this.isPublic = isPublic ?? true;
    }

    public toRemoteDoc(): { [key: string]: any} {
        return {
            ...super.toRemoteDoc(),
            name: this.name,
            wallId: this.wallId,
            grade: this.grade,
            holds: this.holds.map(h => {return {...h}}),
            setter: this.setter,
            isPublic: this.isPublic,
        }
    }

    public async addToRemote(collectionName: string): Promise<void> {
        if (!this.wall.shouldPushToRemote()) return;
        return super.addToRemote(collectionName);
    } 

    get wall(): Wall {
        return this.dal!.walls.Get({id: this.wallId})
    }

    public static fromRemoteDoc(data: {[key: string]: any}, old?: Entity): Problem {
        return new this({
            id: data.id,
            name: data.name,
            wallId: data.wallId,
            grade: data.grade,
            holds: data.holds,
            setter: data.setter,
            isPublic: data.isPublic
        })
    }
};

export interface ProblemFilter {
    minGrade?: number;
    maxGrade?: number;
    name?: string;
    setters?: string[];
    isPublic?: boolean
}

export function FilterProblems(filter: ProblemFilter) {
    return function filterProblem(problem: Problem) {
        return (
            (filter.minGrade !== undefined ? problem.grade >= filter.minGrade : true)
            && (filter.maxGrade !== undefined ? problem.grade <= filter.maxGrade : true)
            && (filter.name !== undefined ? problem.name.includes(filter.name) : true)
            && (filter.setters !== undefined ? (filter.setters.length > 0 ? filter.setters.includes(problem.setter) : true) : true)
            && (filter.isPublic !== undefined ? problem.isPublic == filter.isPublic : true)
        )
    }
}