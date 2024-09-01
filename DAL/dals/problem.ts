import { Problem, ProblemFilter } from "../entities/problem";
import { Filter } from "../tables/BaseTable";
import { GroupProblemTable, ProblemTable } from "../tables/tables";
import { BaseDAL } from "../BaseDAL";


export class ProblemDAL extends BaseDAL<Problem> {
    public List(params: { wallId?: string, groupId?: string } & ProblemFilter): Problem[] {
        let filters: Filter[] = [
            ProblemTable.getField("grade")!.ge(params.minGrade),
            ProblemTable.getField("grade")!.le(params.maxGrade),
            ProblemTable.getField("name")!.like(params.name),
        ];
        if (params.wallId !== undefined) filters.push(
            ProblemTable.getField("wall_id")!.eq(params.wallId)
        );
        if (params.setters.length > 0) filters.push(
            ProblemTable.getField("owner_id")!.in(params.setters)
        );
        if (params.isPublic !== undefined) filters.push(
            ProblemTable.getField("is_public")!.eq(params.isPublic)
        );
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
}