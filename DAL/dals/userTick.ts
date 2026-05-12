import { UserTick, TickTag } from "../entities/userTick";
import { UserTickTable } from "../tables/tables";
import { BaseDAL } from "../BaseDAL";
import { collection, Query, query, Timestamp, where } from "firebase/firestore";

const BUILT_IN_TAGS = ["project", "sent"];

export class UserTickDAL extends BaseDAL<UserTick> {

    public List(params: { userId?: string; problemId?: string; tag?: TickTag }): UserTick[] {
        let filters = Object.keys(params)
            .filter(k => (params as any)[k] !== undefined)
            .map(k => UserTickTable.getField(k)!.eq((params as any)[k]));
        let results = UserTickTable.getAll<{ [key: string]: any }>(
            ...UserTickTable.filter(filters),
            this._dal.db!
        );
        return results.map(r => {
            let entity = UserTickTable.toEntity(r, UserTick);
            entity.setDAL(this._dal);
            return entity as UserTick;
        });
    }

    public getTicksForProblem(problemId: string): UserTick[] {
        return this.List({ userId: this._dal.currentUser.id, problemId });
    }

    public getUserCustomTags(): string[] {
        const ticks = this.List({ userId: this._dal.currentUser.id });
        const unique = [...new Set(ticks.map(t => t.tag))];
        return unique.filter(t => !BUILT_IN_TAGS.includes(t));
    }

    public async toggleTick(problemId: string, tag: TickTag): Promise<void> {
        const existing = this.List({ userId: this._dal.currentUser.id, problemId, tag })[0];
        if (existing) {
            await this.Remove(existing);
        } else {
            const tick = new UserTick({
                userId: this._dal.currentUser.id,
                problemId,
                tag,
            });
            await this.Add(tick);
        }
    }

    public async removeTick(problemId: string, tag?: TickTag): Promise<void> {
        if (tag !== undefined) {
            const existing = this.List({ userId: this._dal.currentUser.id, problemId, tag })[0];
            if (existing) await this.Remove(existing);
        } else {
            const ticks = this.getTicksForProblem(problemId);
            for (const tick of ticks) await this.Remove(tick);
        }
    }

    protected getRemoteFetchQuery(since: Timestamp): Query {
        return query(
            collection(this._dal.remoteDB, this.remoteCollection!),
            where("updated_at", ">=", since),
            where("userId", "==", this._dal.currentUser.id),
        );
    }
}
