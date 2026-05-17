import { Problem } from "../entities/problem";
import { And, Filter } from "../tables/BaseTable";
import { GroupProblemTable, ProblemTable, UserTickTable } from "../tables/tables";
import { BaseDAL } from "../BaseDAL";
import { and, collection, Query, query, Timestamp, where, or } from "firebase/firestore";
import { ProblemFilter } from "../IDAL";


export class ProblemDAL extends BaseDAL<Problem> {
    public List(params: { wallId?: string, wallVersion?: number, groupId?: string, id?: string } & ProblemFilter): Problem[] {
        let filters: Filter[] = [];
        if (params.id !== undefined) filters.push(ProblemTable.getField("id")!.eq(params.id));
        if (params.minGrade !== undefined) filters.push(ProblemTable.getField("grade")!.ge(params.minGrade));
        if (params.maxGrade !== undefined) filters.push(ProblemTable.getField("grade")!.le(params.maxGrade));
        if (params.name !== undefined) filters.push(ProblemTable.getField("name")!.like(params.name));
        if (params.wallId !== undefined) {
            filters.push(ProblemTable.getField("wall_id")!.eq(params.wallId));
            const version = params.wallVersion ?? this._dal.walls.Get({ id: params.wallId }).version;
            filters.push(ProblemTable.getField("wall_version")!.eq(version));
        }
        if (params.setters !== undefined && params.setters.length > 0) filters.push(ProblemTable.getField("owner_id")!.in(params.setters));
        if (params.type !== undefined) filters.push(ProblemTable.getField("type")!.eq(params.type));
        let query = ProblemTable.query(filters);
        const activeTags = params.tags ?? [];
        if (activeTags.length > 0) {
            if (activeTags.includes("unsent")) {
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
                    UserTickTable.getField("tag")!.in(activeTags)
                ).Distinct();
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
        let walls = this._dal.users.GetWalls({ user_id: this._dal.currentUser.id });
        if (extraData?.wallId) {
            walls = walls.concat(this._dal.walls.Get({ id: extraData.wallId }));
        }

        const wallFilters = walls.length > 0
            ? walls.map(wall => and(where("wallId", "==", wall.id), where("wallVersion", "==", wall.version)))
            : [and(where("wallId", "==", "This Wall Does Not Exist"), where("wallVersion", "==", -1))];

        return query(
            collection(this._dal.remoteDB, this.remoteCollection!),
            and(
                where("updated_at", ">=", since),
                where("isPublic", "==", true),
                or(...wallFilters)
            )
        );
    }
}