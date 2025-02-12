import { Problem, ProblemFilter } from "../entities/problem";
import { Filter } from "../tables/BaseTable";
import { GroupProblemTable, ProblemTable } from "../tables/tables";
import { BaseDAL } from "../BaseDAL";
import { collection, getDocs, Query, query, Timestamp, where } from "firebase/firestore";


export class ProblemDAL extends BaseDAL<Problem> {
    public List(params: { wallId?: string, groupId?: string, id?: string } & ProblemFilter): Problem[] {
        let filters: Filter[] = [];
        if (params.id !== undefined) filters.push(ProblemTable.getField("id")!.eq(params.id));
        if (params.minGrade !== undefined) filters.push(ProblemTable.getField("grade")!.ge(params.minGrade));
        if (params.maxGrade !== undefined) filters.push(ProblemTable.getField("grade")!.le(params.maxGrade));
        if (params.name !== undefined) filters.push(ProblemTable.getField("name")!.like(params.name));
        if (params.wallId !== undefined) filters.push(ProblemTable.getField("wall_id")!.eq(params.wallId));
        if (params.setters !== undefined && params.setters.length > 0) filters.push(ProblemTable.getField("owner_id")!.in(params.setters));
        if (params.isPublic !== undefined) filters.push(ProblemTable.getField("is_public")!.eq(params.isPublic));
        let query = ProblemTable.query(filters);
        if (params.groupId !== undefined) {
            query = query.Join(
                GroupProblemTable,
                GroupProblemTable.getField("problem_id")!.eq(ProblemTable.getField("id")!)
            );
            query.Filter(GroupProblemTable.getField("group_id")!.eq(params.groupId))
        }
        let results = query.All<{ [key: string]: any; }>(this._dal.db!);
        return results.map(r => {
            let entity = ProblemTable.toEntity(r);
            entity.setDAL(this._dal);
            return entity
        }) as Problem[];
    }
    
    protected getRemoteFetchQuery(since: Timestamp): Query {
        return query(
            collection(this._dal.remoteDB, this.remoteCollection!),
            where("updated_at", ">=", since),
            where("isPublic", "==", true),
            where(
                "wallId", 
                "in", 
                this._dal.users.GetWalls({ user_id: this._dal.currentUser.id }).map(w => w.id).concat([""])
            )
        );
    }
}