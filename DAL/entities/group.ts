import { ImageResolvedAssetSource, ImageSourcePropType, Image } from "react-native";
import { Entity, EntityProps } from "./BaseEntity";
import { Problem, ProblemFilter } from "./problem";
import { Wall } from "./wall";

export type GroupProps = EntityProps & {name: string, image: ImageSourcePropType, members?: string[], admins?: string[], walls?: string[], problems?: string[]}

export class Group extends Entity {
    name: string;
    image: ImageResolvedAssetSource;
    members: string[];
    admins: string[];
    walls: string[];
    problems: string[];
    private privateWalls?: Wall[];
    private publicWalls?: Wall[];
    constructor({ name, image, members, admins, walls, problems, ...props }: EntityProps) {
        super(props);
        this.name = name;
        this.image = Image.resolveAssetSource(image);
        this.members = members || [];
        this.admins = admins || [];
        this.walls = walls || [];
        this.problems = problems || [];
        this.privateWalls = undefined;
        this.publicWalls = undefined;
    }

    protected async uploadAssets(data: { [key: string]: any }): Promise<{ [key: string]: any }> {
        return {
            ...data,
            image: await this.uploadImage(this.image),
        };
    }

    public toRemoteDoc(): { [key: string]: any} {
        return {
            ...super.toRemoteDoc(),
            name: this.name,
            members: this.members,
            admins: this.admins,
            walls: this.walls,
            problems: this.problems,
        }
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

    public FilterProblems( params: ProblemFilter ): Problem[] {
        return this.dal!.problems.List({groupId: this.id, ...params})
    }

    public get PrivateWalls(): Wall[] {
        if (this.privateWalls === undefined)
            this.privateWalls = this.dal!.groups.GetPrivateWalls(this);
        return this.privateWalls;
    }

    public get PublicWalls(): Wall[] {
        if (this.publicWalls === undefined) {
            let pWalls = this.PrivateWalls.map(w => w.id);
            this.publicWalls = this.dal!.walls.List({ids: this.walls.filter(w => !pWalls.includes(w))});
        }
        return this.publicWalls;
    }

    public static fromRemoteDoc(data: {[key: string]: any}, old?: Wall): Entity {
        let image = {uri: data.image.commpressed};
        if (!!old) image = old.image;
        return new this({
            id: data.id,
            name: data.name,
            members: data.members,
            admins: data.admins,
            walls: data.walls,
            problems: data.problems,
            image: image
        });
    }
};