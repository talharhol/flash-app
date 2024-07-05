import uuid from "react-native-uuid";
import { Hold } from "./hold";
export class Problem {
    id: string;
    name: string;
    wallId: string;
    grade: number;
    holds: Hold[];
    setter: string;
    constructor({ id, name, wallId, grade, holds, setter }: { id?: string, name: string, wallId: string, grade: number, holds: Hold[], setter: string}) {
        this.id = id || uuid.v4() as string;
        this.name = name;
        this.wallId = wallId;
        this.grade = grade;
        this.holds = holds;
        this.setter = setter;
    }
};

export interface ProblemFilter {
    minGrade: number;
    maxGrade: number;
    name: string;
    setters: string[];
}

export function FilterProblems(filter: ProblemFilter) {
    return function filterProblem(problem: Problem) {
        return (
            problem.grade >= filter.minGrade
            && problem.grade <= filter.maxGrade
            && problem.name.includes(filter.name)
            && filter.setters.length > 0 ? filter.setters.includes(problem.setter) : true
        )
    }
}