import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from "@/components/general/ThemedView";
import React, { useReducer, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BolderProblemPreview from '../../general/BolderProblemPreview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DisplayBolderProblemModal from '../../general/modals/DisplayBolderProblemModal';
import FilterProblemssModal from '@/components/general/modals/FilterBoldersModal';
import { Problem } from '@/DAL/entities/problem';
import { useDal } from '@/DAL/DALService';
import { Colors } from '@/constants/Colors';
import { ProblemFilter } from '@/DAL/IDAL';

const ViewGroupScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal();
    const group = dal.groups.Get({ id: useLocalSearchParams().id as string });
    const [_, updateGUI] = useReducer(i => i + 1, 0);
    const [displayedProblem, setDisplayedProblem] = useState<string | null>(null);
    const [filterProblemsModal, setFilterProblemsModal] = useState(false);
    const [filters, setFilters] = useState<ProblemFilter>(
        dal.currentUser.getLastFilters({ id: group.id })
    );

    const handleFiltersChange = (f: ProblemFilter) => {
        setFilters(f);
        dal.currentUser.setFilters({ id: group.id, filters: f });
    };
    const deleteProblem = async (problem: Problem) => {
        await group.RemoveProblem({ problem_id: problem.id });
        updateGUI();
    }

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={styles.headerContainer}>
                    <MaterialCommunityIcons
                        onPress={() => router.push({ pathname: "/SelectWallScreen", params: { id: group.id } })}
                        name='plus-thick' size={35} color={Colors.backgroundExtraLite} style={{ position: "absolute", left: 10, padding: 5 }} />
                    <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>{group.name}</ThemedText>
                    <MaterialCommunityIcons
                        onPress={() => setFilterProblemsModal(true)}
                        name='filter-plus' size={35} color={Colors.backgroundExtraLite} style={{ position: "absolute", right: 10, padding: 5 }} />
                </ThemedView>
            }>
            {
                displayedProblem &&
                <DisplayBolderProblemModal
                    problem={dal.problems.Get({ id: displayedProblem })}
                    closeModal={() => setDisplayedProblem(null)} />
            }
            {
                filterProblemsModal &&
                <FilterProblemssModal
                    dal={dal}
                    closeModal={() => setFilterProblemsModal(false)}
                    initialFilters={filters}
                    onFiltersChange={handleFiltersChange}
                    groupId={group.id}
                />
            }
            {
                group.FilterProblems(filters).map(problem => {
                    return (
                        <BolderProblemPreview
                            key={problem.id}
                            dal={dal}
                            onPress={() => setDisplayedProblem(problem.id)}
                            wall={dal.walls.Get({ id: problem.wallId })}
                            problem={problem}
                            deleteProblem={deleteProblem}
                        />
                    )
                }
                )
            }
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        width: "100%",
        flexDirection: "row",
    },
});

export default ViewGroupScreen;