export type Grade = 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24;
export type GradingSystem = 'french' | 'v';
type GradeMap = { [K in Grade]: string };

export const grades: GradeMap = {
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

export const vGrades: GradeMap = {
    0: 'V0',
    1: 'V0+',
    2: 'V1',
    3: 'V1+',
    4: 'V2',
    5: 'V2+',
    6: 'V3',
    7: 'V3+',
    8: 'V4',
    9: 'V4+',
    10: 'V5',
    11: 'V5+',
    12: 'V6',
    13: 'V7',
    14: 'V8',
    15: 'V8+',
    16: 'V9',
    17: 'V10',
    18: 'V11',
    19: 'V12',
    20: 'V13',
    21: 'V14',
    22: 'V15',
    23: 'V16',
    24: 'V17'
}

export function getGradeMap(system: GradingSystem): GradeMap {
    return system === 'v' ? vGrades : grades;
}
