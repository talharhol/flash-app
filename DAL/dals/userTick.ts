import { UserTick, TickTag } from "../entities/userTick";
import { UserTickTable } from "../tables/tables";
import { BaseDAL } from "../BaseDAL";
import { collection, Query, query, Timestamp, where } from "firebase/firestore";


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

    public getForProblem(problemId: string): UserTick | undefined {
        return this.List({ userId: this._dal.currentUser.id, problemId })[0];
    }

    public async setTick(problemId: string, tag: TickTag): Promise<void> {
        const existing = this.getForProblem(problemId);
        if (existing) {
            existing.tag = tag;
            await this.Update(existing);
        } else {
            const tick = new UserTick({
                userId: this._dal.currentUser.id,
                problemId,
                tag,
            });
            await this.Add(tick);
        }
    }

    public async removeTick(problemId: string): Promise<void> {
        const existing = this.getForProblem(problemId);
        if (existing) await this.Remove(existing);
    }

    protected getRemoteFetchQuery(since: Timestamp): Query {
        return query(
            collection(this._dal.remoteDB, this.remoteCollection!),
            where("updated_at", ">=", since),
            where("userId", "==", this._dal.currentUser.id),
        );
    }
}
