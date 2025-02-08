import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from "@/components/general/ThemedView";
import React, { useReducer, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BolderProblemPreview from '../../general/BolderProblemPreview';
import { Ionicons } from '@expo/vector-icons';
import DisplayBolderProblemModal from '../../general/modals/DisplayBolderProblemModal';
import FilterProblemssModal from '@/components/general/modals/FilterBoldersModal';
import { Problem, ProblemFilter } from '@/DAL/entities/problem';
import { useDal } from '@/DAL/DALService';

const ViewGroupScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal();
    const group = dal.groups.Get({ id: useLocalSearchParams().id as string });
    const [_, updateGUI] = useReducer(i => i + 1, 0);
    const [displayedProblem, setDisplayedProblem] = useState<string | null>(null);
    const [filterProblemsModal, setFilterProblemsModal] = useState(false);
    const [filters, setFilters] = useState<ProblemFilter>({
        minGrade: 1,
        maxGrade: 15,
        name: "",
        setters: []
    });
    const deleteProblem = (problem: Problem) => {
        dal.problems.Remove(problem).then(updateGUI);
    }

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={styles.headerContainer}>
                    <Ionicons
                        onPress={() => router.push({ pathname: "/SelectWallScreen", params: { id: group.id } })}
                        name='add-circle-outline' size={35} color={'#A1CEDC'} style={{ position: "absolute", left: 10, padding: 5 }} />
                    <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>{group.name}</ThemedText>
                    <Ionicons
                        onPress={() => setFilterProblemsModal(true)}
                        name='filter' size={35} color={'#A1CEDC'} style={{ position: "absolute", right: 10, padding: 5 }} />
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
                    onFiltersChange={setFilters}
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