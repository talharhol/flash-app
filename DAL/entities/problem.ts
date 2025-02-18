import { HoldInterface } from "../hold";
import { Entity, EntityProps } from "./BaseEntity";
import { Wall } from "./wall";

export type ProblemProps = EntityProps &  { name: string, wallId: string, grade: number, holds: HoldInterface[], setter: string, isPublic?: boolean, type: string};

export class Problem extends Entity {
    name: string;
    wallId: string;
    grade: number;
    holds: HoldInterface[];
    setter: string;
    isPublic: boolean;
    type: string;
    constructor({ name, wallId, grade, holds, setter, isPublic, type, ...props }: ProblemProps) {
        super(props);
        this.name = name;
        this.wallId = wallId;
        this.grade = grade;
        this.holds = holds;
        this.setter = setter;
        this.isPublic = isPublic ?? true;
        this.type = type;
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
            type: this.type,
        }
    }

    public shouldPushToRemote(): boolean {
        return this.wall.shouldPushToRemote();
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
            isPublic: data.isPublic,
            type: data.type
        })
    }
};

export interface ProblemFilter {
    minGrade?: number;
    maxGrade?: number;
    name?: string;
    setters?: string[];
    isPublic?: boolean;
    type?: string;
}