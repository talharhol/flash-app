import { ImageSourcePropType } from "react-native";
import uuid from "react-native-uuid";
import { IDAL } from "../IDAL";
import { Entity, EntityProps } from "./BaseEntity";
import { GroupProblemTable } from "../tables/tables";

export class Group extends Entity {
    name: string;
    image: ImageSourcePropType;
    members: string[];
    admins: string[];
    walls: string[];
    problems: string[];
    constructor({ name, image, members, admins, walls, problems, ...props }: {name: string, image: ImageSourcePropType, members?: string[], admins?: string[], walls?: string[], problems?: string[]} & EntityProps) {
        super(props)
        this.name = name;
        this.image = image;
        this.members = members || [];
        this.admins = admins || [];
        this.walls = walls || [];
        this.problems = problems || [];
    }

    public getMembers() {
        if (this.dal === undefined) {
            return [];
        } 
            return this.members.map(uid => this.dal!.users.Get({id: uid}));
        
    }

    public getDescription(): string {
        let members = this.getMembers();
        if (members.length > 3) {
            return `${members[0].name}, ${members[1].name}, ${members[2].name}... `;
        }
        return members.map(u => u.name).join(', ');
    }

    public AddProblem(params: {problem_id: string}) {
        return GroupProblemTable.insert({
            problem_id: params.problem_id,
            group_id: this.id
        }, this.dal!.db!).catch(console.log);
    }
};