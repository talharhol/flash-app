import { useDal } from '@/DAL/DALService';
import { getGradeMap, GradeMap } from '@/constants/consts';

export function useGrades(): GradeMap {
    const dal = useDal();
    return getGradeMap(dal.currentUser.gradingSystem);
}
