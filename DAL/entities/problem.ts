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
};

export interface ProblemFilter {
    minGrade: number;
    maxGrade: number;
    name: string;
    setters: string[];
    isPublic?: boolean
}

export function FilterProblems(filter: ProblemFilter) {
    return function filterProblem(problem: Problem) {
        return (
            problem.grade >= filter.minGrade
            && problem.grade <= filter.maxGrade
            && problem.name.includes(filter.name)
            && (filter.setters.length > 0 ? filter.setters.includes(problem.setter) : true)
            && (filter.isPublic !== undefined ? problem.isPublic == filter.isPublic : true)
        )
    }
}