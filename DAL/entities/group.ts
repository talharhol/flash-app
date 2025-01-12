import { ImageResolvedAssetSource, ImageSourcePropType, Image } from "react-native";
import { Entity, EntityProps } from "./BaseEntity";
import { Problem, ProblemFilter } from "./problem";
import { Wall } from "./wall";
import { BaseTable } from "../tables/BaseTable";

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

    public async AddProblem(params: {problem_id: string}): Promise<void> {
        this.problems.push(params.problem_id);
        await this.dal!.groups.AddProblem({
            problem_id: params.problem_id,
            group_id: this.id
        });
        this.dal!.groups.UpdateRemote(this).catch(console.error);
    }

    public async AddWall(params: {wall_id: string}): Promise<void> {
        this.walls.push(params.wall_id);
        await this.dal!.groups.AddWall({
            wall_id: params.wall_id,
            group_id: this.id
        });
        this.dal!.groups.UpdateRemote(this).catch(console.error);
    }

    public async AddMember(params: {user_id: string, role?: string}): Promise<void> {
        this.members.push(params.user_id);
        if (params.role === "admin") this.admins.push(params.user_id);
        await this.dal!.groups.AddMember({
            ...params,
            group_id: this.id,
        });
        this.dal!.groups.UpdateRemote(this).catch(console.error);
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

    public static fromRemoteDoc(data: {[key: string]: any}, old?: Group): Group {
        let image = {uri: data.image.full}; // we fetch only groups relevant to user -> we can download full quality rightaway
        if (!!old) image = old.image; // do not download image again
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

    public toTable(table: typeof BaseTable):  { [key: string]: any } {
        let data: { [key: string]: any } = {
            id: this.id,
            name: this.name,
            image: this.image
        };
        Object.keys(data).map(k => {
            // removeing all unrelated data
            if (k.startsWith("_")) delete data[k];
            else if (table.getField(k) === undefined) delete data[k];
        });
        return data
    }
};