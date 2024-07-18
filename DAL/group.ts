import { ImageSourcePropType } from "react-native";
import uuid from "react-native-uuid";
import { IDAL } from "./IDAL";

export class Group {
    id: string;
    name: string;
    image: ImageSourcePropType;
    members: string[];
    admins: string[];
    walls: string[];
    problems: string[];
    dal?: IDAL;
    constructor({ id, name, image, members, admins, walls, problems, dal }: {id?: string, name: string, image: ImageSourcePropType, members?: string[], admins?: string[], walls?: string[], problems?: string[], dal?: IDAL}) {
        this.id = id || uuid.v4() as string;
        this.name = name;
        this.image = image;
        this.members = members || [];
        this.admins = admins || [];
        this.walls = walls || [];
        this.problems = problems || [];
        this.dal = dal
    }
    
    setDAL = (dal: IDAL) => {
        this.dal = dal;
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
};