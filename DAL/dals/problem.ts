import { Problem } from "../entities/problem";
import { And, Filter } from "../tables/BaseTable";
import { GroupProblemTable, ProblemTable, UserTickTable } from "../tables/tables";
import { BaseDAL } from "../BaseDAL";
import { collection, Query, query, Timestamp, where } from "firebase/firestore";
import { ProblemFilter } from "../IDAL";


export class ProblemDAL extends BaseDAL<Problem> {
    public List(params: { wallId?: string, groupId?: string, id?: string } & ProblemFilter): Problem[] {
        let filters: Filter[] = [];
        if (params.id !== undefined) filters.push(ProblemTable.getField("id")!.eq(params.id));
        if (params.minGrade !== undefined) filters.push(ProblemTable.getField("grade")!.ge(params.minGrade));
        if (params.maxGrade !== undefined) filters.push(ProblemTable.getField("grade")!.le(params.maxGrade));
        if (params.name !== undefined) filters.push(ProblemTable.getField("name")!.like(params.name));
        if (params.wallId !== undefined) filters.push(ProblemTable.getField("wall_id")!.eq(params.wallId));
        if (params.setters !== undefined && params.setters.length > 0) filters.push(ProblemTable.getField("owner_id")!.in(params.setters));
        if (params.type !== undefined) filters.push(ProblemTable.getField("type")!.eq(params.type));
        let query = ProblemTable.query(filters);
        if (params.tag !== undefined) {
            if (params.tag === "unsent") {
                query = query.Join(
                    UserTickTable,
                    And(
                        UserTickTable.getField("problem_id")!.eq(ProblemTable.getField("id")!),
                        UserTickTable.getField("user_id")!.eq(this._dal.currentUser.id),
                        UserTickTable.getField("tag")!.eq("sent")
                    ),
                    "LEFT JOIN"
                );
                query.Filter(UserTickTable.getField("problem_id")!.isNull());
            } else {
                query = query.Join(
                    UserTickTable,
                    UserTickTable.getField("problem_id")!.eq(ProblemTable.getField("id")!)
                ).Filter(
                    UserTickTable.getField("user_id")!.eq(this._dal.currentUser.id)
                ).Filter(
                    UserTickTable.getField("tag")!.eq(params.tag)
                );
            }
        }
        if (params.groupId !== undefined) {
            query = query.Join(
                GroupProblemTable,
                GroupProblemTable.getField("problem_id")!.eq(ProblemTable.getField("id")!)
            );
            query.Filter(GroupProblemTable.getField("group_id")!.eq(params.groupId));
            params.isPublic = false; // group has only private problems
        }
        if (params.isPublic !== undefined) query.Filter(ProblemTable.getField("is_public")!.eq(params.isPublic));
        let results = query.All<{ [key: string]: any; }>(this._dal.db!);
        return results.map(r => {
            let entity = ProblemTable.toEntity(r);
            entity.setDAL(this._dal);
            return entity
        }) as Problem[];
    }
    
    protected getRemoteFetchQuery(since: Timestamp, extraData?: { wallId: string }): Query {
        let walls: string[] = [];
        if (extraData?.wallId) walls.push(extraData.wallId);
        else walls = this._dal.users.GetWalls({ user_id: this._dal.currentUser.id }).map(w => w.id);

        if (walls.length === 0) walls.push("");

        return query(
            collection(this._dal.remoteDB, this.remoteCollection!),
            where("updated_at", ">=", since),
            where("isPublic", "==", true),
            where("wallId", "in", walls)
        );
    }
}