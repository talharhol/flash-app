import { users } from "@/app/debugData";
import { ImageSourcePropType } from "react-native";
import uuid from "react-native-uuid";
export class Group {
    id: string;
    name: string;
    image: ImageSourcePropType;
    members: string[];
    admins: string[];
    walls: string[];
    problems: string[];
    constructor({ id, name, image, members, admins, walls, problems }: {id?: string, name: string, image: ImageSourcePropType, members?: string[], admins?: string[], walls?: string[], problems?: string[]}) {
        this.id = id || uuid.v4() as string;
        this.name = name;
        this.image = image;
        this.members = members || [];
        this.admins = admins || [];
        this.walls = walls || [];
        this.problems = problems || [];
    }

    public getMembers() {
        return this.members.map(uid => users.filter(u => u.id === uid)[0]);
    }

    public getDescription(): string {
        let members = this.getMembers();
        if (members.length > 3) {
            return `${members[0].name}, ${members[1].name}, ${members[2].name}... `;
        }
        return members.map(u => u.name).join(', ');
    }
};