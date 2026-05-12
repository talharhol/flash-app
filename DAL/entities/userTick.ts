import { IDAL } from "../IDAL";
import { Entity, EntityProps } from "./BaseEntity";

export type TickTag = string;
export const BUILT_IN_TAGS = ["project", "sent"] as const;

export type UserTickProps = EntityProps & { userId: string; problemId: string; tag: TickTag };

export class UserTick extends Entity {
    userId: string;
    problemId: string;
    tag: TickTag;

    constructor({ userId, problemId, tag, ...props }: UserTickProps) {
        super(props);
        this.userId = userId;
        this.problemId = problemId;
        this.tag = tag;
    }

    public toRemoteDoc(): { [key: string]: any } {
        return {
            ...super.toRemoteDoc(),
            isPublic: false,
            userId: this.userId,
            problemId: this.problemId,
            tag: this.tag,
        };
    }

    public static fromRemoteDoc(data: { [key: string]: any }, old?: Entity, dal?: IDAL): UserTick {
        return new this({
            id: data.id,
            userId: data.userId,
            problemId: data.problemId,
            tag: data.tag,
        });
    }
}
