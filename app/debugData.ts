import { Group } from "@/dataTypes/group"
import { Hold, HoldType, HoldTypes } from "../dataTypes/hold"
import { Problem } from "../dataTypes/problem"
import { Wall } from "../dataTypes/wall"
import { User } from "@/dataTypes/user"
interface Grades {
    [key: number]: string;
  }
export const grades: Grades = {
    0: '5A',
    1: '5A+',
    2: '5B',
    3: '5B+',
    4: '5C',
    5: '5C+',
    6: '6A',
    7: '6A+',
    8: '6B',
    9: '6B+',
    10: '6C',
    11: '6C+',
    12: '7A',
    13: '7A+',
    14: '7B',
    15: '7B+',
    16: '7C',
    17: '7C+',
    18: '8A',
    19: '8A+',
    20: '8B',
    21: '8B+',
    22: '8C',
    23: '8C+',
    24: '9A'
}

export var users = [
    new User({ name: "Tal", image: require("../assets/images/climber.png") }),
    new User({ name: "Gozal", image: require("../assets/images/climber.png") }),
    new User({ name: "Maayan", image: require("../assets/images/climber.png") }),
]

export var walls = [
    new Wall({ name: "Moon", gym: "Tal", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: [{ "id": "aea90438-79f4-411d-adaa-37c5009c6c3e", "svgPath": "M 91.28268432617188, 134.17945861816406 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "71be8fa1-4155-4bf4-a98b-20c9da286b77", "svgPath": "M 109.63833618164062, 132.369140625 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "220cd227-8ec2-4d73-beac-c7dc9f8376ac", "svgPath": "M 127.99398803710938, 132.59544372558594 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "7cc4a9fb-52e9-4b78-8565-0f19f2e57224", "svgPath": "M 92.06600189208984, 151.09469604492188 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "eebc54d2-3399-4fa1-813e-a11329f52942", "svgPath": "M 110.31720733642578, 149.3409423828125 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "dd0c2aa7-2820-4fe1-a057-2899bfa3dd19", "svgPath": "M 128.5161895751953, 147.41746520996094 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "b2fa8567-c4bf-4fd5-bd51-76178614a90a", "svgPath": "M 91.9354476928711, 166.8218994140625 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "1fc82f0d-715e-4cae-8178-1a83aa2e74de", "svgPath": "M 110.4216537475586, 167.1613311767578 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }], isPublic: true }),
    new Wall({ name: "Moon", gym: "Tal", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: [{ "id": "aea90438-79f4-411d-adaa-37c5009c6c3e", "svgPath": "M 91.28268432617188, 134.17945861816406 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "71be8fa1-4155-4bf4-a98b-20c9da286b77", "svgPath": "M 109.63833618164062, 132.369140625 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "220cd227-8ec2-4d73-beac-c7dc9f8376ac", "svgPath": "M 127.99398803710938, 132.59544372558594 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "7cc4a9fb-52e9-4b78-8565-0f19f2e57224", "svgPath": "M 92.06600189208984, 151.09469604492188 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "eebc54d2-3399-4fa1-813e-a11329f52942", "svgPath": "M 110.31720733642578, 149.3409423828125 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "dd0c2aa7-2820-4fe1-a057-2899bfa3dd19", "svgPath": "M 128.5161895751953, 147.41746520996094 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "b2fa8567-c4bf-4fd5-bd51-76178614a90a", "svgPath": "M 91.9354476928711, 166.8218994140625 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "1fc82f0d-715e-4cae-8178-1a83aa2e74de", "svgPath": "M 110.4216537475586, 167.1613311767578 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }], isPublic: true }),
    new Wall({ name: "Moon", gym: "Tal", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: [{ "id": "aea90438-79f4-411d-adaa-37c5009c6c3e", "svgPath": "M 91.28268432617188, 134.17945861816406 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "71be8fa1-4155-4bf4-a98b-20c9da286b77", "svgPath": "M 109.63833618164062, 132.369140625 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "220cd227-8ec2-4d73-beac-c7dc9f8376ac", "svgPath": "M 127.99398803710938, 132.59544372558594 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "7cc4a9fb-52e9-4b78-8565-0f19f2e57224", "svgPath": "M 92.06600189208984, 151.09469604492188 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "eebc54d2-3399-4fa1-813e-a11329f52942", "svgPath": "M 110.31720733642578, 149.3409423828125 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "dd0c2aa7-2820-4fe1-a057-2899bfa3dd19", "svgPath": "M 128.5161895751953, 147.41746520996094 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "b2fa8567-c4bf-4fd5-bd51-76178614a90a", "svgPath": "M 91.9354476928711, 166.8218994140625 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "1fc82f0d-715e-4cae-8178-1a83aa2e74de", "svgPath": "M 110.4216537475586, 167.1613311767578 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }], isPublic: true }),
    new Wall({ name: "Moon", gym: "Tal", image: require("../assets/images/Wall.png"), angle: 40, configuredHolds: [{ "id": "aea90438-79f4-411d-adaa-37c5009c6c3e", "svgPath": "M 91.28268432617188, 134.17945861816406 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "71be8fa1-4155-4bf4-a98b-20c9da286b77", "svgPath": "M 109.63833618164062, 132.369140625 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "220cd227-8ec2-4d73-beac-c7dc9f8376ac", "svgPath": "M 127.99398803710938, 132.59544372558594 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "7cc4a9fb-52e9-4b78-8565-0f19f2e57224", "svgPath": "M 92.06600189208984, 151.09469604492188 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "eebc54d2-3399-4fa1-813e-a11329f52942", "svgPath": "M 110.31720733642578, 149.3409423828125 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "dd0c2aa7-2820-4fe1-a057-2899bfa3dd19", "svgPath": "M 128.5161895751953, 147.41746520996094 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "b2fa8567-c4bf-4fd5-bd51-76178614a90a", "svgPath": "M 91.9354476928711, 166.8218994140625 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }, { "id": "1fc82f0d-715e-4cae-8178-1a83aa2e74de", "svgPath": "M 110.4216537475586, 167.1613311767578 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }], isPublic: true }),
]

export var holds = [
    new Hold({ type: new HoldType(HoldTypes.start), svgPath: "M 91.28268432617188, 134.17945861816406 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }),
    new Hold({ type: new HoldType(HoldTypes.feet), svgPath: "M 109.63833618164062, 132.369140625 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }),
    new Hold({ type: new HoldType(HoldTypes.top), svgPath: "M 127.99398803710938, 132.59544372558594 a 10,10 0 1,0 20,0 a 10,10 0 1,0 -20,0" }),
]

export var problems = [
    new Problem({ wallId: walls[0].id, name: "David", grade: 5, holds: holds, setter: users[0].id }),
    new Problem({ wallId: walls[0].id, name: "Moshe", grade: 6, holds: holds, setter: users[1].id }),
    new Problem({ wallId: walls[0].id, name: "Moav", grade: 7, holds: holds, setter: users[2].id }),
    new Problem({ wallId: walls[0].id, name: "Rotem", grade: 8, holds: holds, setter: users[0].id }),
];


export var groups = [
    new Group({ name: "Group1", image: require("../assets/images/climber.png"), walls: [walls[0].id, walls[1].id], members: users.map(u => u.id), admins: [users[0].id], problems: [problems[0].id, problems[1].id ]}),
    new Group({ name: "Group2", image: require("../assets/images/climber.png"), walls: [walls[0].id, walls[1].id], members: users.map(u => u.id), admins: [users[1].id], problems: [problems[0].id, problems[1].id ] }),
    new Group({ name: "Group3", image: require("../assets/images/climber.png"), walls: [walls[0].id, walls[1].id], members: users.map(u => u.id), admins: [users[2].id], problems: [problems[0].id, problems[1].id ] }),
    new Group({ name: "Group4", image: require("../assets/images/climber.png"), walls: [walls[0].id, walls[1].id], members: users.map(u => u.id), admins: [users[0].id], problems: [problems[0].id, problems[1].id ] }),
];

export const currentUser = users[0];