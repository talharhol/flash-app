import { groups, problems, walls } from "@/app/debugData";
import { Group } from "@/DAL/group";
import { Problem } from "@/DAL/problem";
import { Wall } from "@/DAL/wall";

export function GetWall({ id } : { id?: string }): Wall {
    return walls.filter(w => w.id === id)[0]
}

export function GetGroup({ id } : { id?: string }): Group {
    return groups.filter(w => w.id === id)[0]
}

export function GetProblem({ id } : { id?: string }): Problem {
    return problems.filter(w => w.id === id)[0]
}