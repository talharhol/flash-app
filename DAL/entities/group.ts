import { ImageSourcePropType } from "react-native";
import { Entity, EntityProps } from "./BaseEntity";

export type GroupProps = EntityProps & {name: string, image: ImageSourcePropType, members?: string[], admins?: string[], walls?: string[], problems?: string[]}

export class Group extends Entity {
    name: string;
    image: ImageSourcePropType;
    members: string[];
    admins: string[];
    walls: string[];
    problems: string[];
    constructor({ name, image, members, admins, walls, problems, ...props }: EntityProps) {
        super(props);
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
        return this.dal!.groups.AddProblem({
            problem_id: params.problem_id,
            group_id: this.id
        })
    }

    public AddWall(params: {wall_id: string}) {
        return this.dal!.groups.AddWall({
            wall_id: params.wall_id,
            group_id: this.id
        })
    }
};