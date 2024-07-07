import uuid from "react-native-uuid";

interface Hold {
    id: string;
    color: string;
    svgPath: string;
}

export class Problem {
    id: string;
    name: string;
    wallId: string;
    grade: number;
    holds: Hold[];
    setter: string;
    isPublic: boolean;
    constructor({ id, name, wallId, grade, holds, setter, isPublic }: { id?: string, name: string, wallId: string, grade: number, holds: Hold[], setter: string, isPublic?: boolean}) {
        this.id = id || uuid.v4() as string;
        this.name = name;
        this.wallId = wallId;
        this.grade = grade;
        this.holds = holds;
        this.setter = setter;
        this.isPublic = isPublic ?? true;
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
            && filter.setters.length > 0 ? filter.setters.includes(problem.setter) : true
            && filter.isPublic !== undefined ? problem.isPublic == filter.isPublic : true
        )
    }
}