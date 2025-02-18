import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from "@/components/general/ThemedView";
import React, { useReducer, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BolderProblemPreview from '../../general/BolderProblemPreview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DisplayBolderProblemModal from '../../general/modals/DisplayBolderProblemModal';
import FilterProblemssModal from '@/components/general/modals/FilterBoldersModal';
import { Problem, ProblemFilter } from '@/DAL/entities/problem';
import { useDal } from '@/DAL/DALService';
import { Colors } from '@/constants/Colors';

const ViewWallScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal();
    const wall = dal.walls.Get({ id: useLocalSearchParams().id as string });
    const [displayedProblem, setDisplayedProblem] = useState<string | null>(null);
    const [filterProblemsModal, setFilterProblemsModal] = useState(false);
    const [_, updateGUI] = useReducer(i => i + 1, 0);
    const [filters, setFilters] = useState<ProblemFilter>({
        minGrade: 1,
        maxGrade: 15,
        name: "",
        setters: [],
        isPublic: true,
        type: undefined,
    });

    const deleteProblem = (problem: Problem) => {
        dal.problems.Remove(problem).then(updateGUI);
    }

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={styles.headerContainer}>
                    <MaterialCommunityIcons
                        onPress={() => router.push({ pathname: "/CreateBolderProblem", params: { id: wall.id } })}
                        name='plus-thick' size={35} color={Colors.backgroundExtraLite} style={{ position: "absolute", left: 10, padding: 5 }} />
                    <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>{wall.name}@{wall.gym}</ThemedText>
                    <MaterialCommunityIcons
                        onPress={() => setFilterProblemsModal(true)}
                        name='filter-plus' size={35} color={Colors.backgroundExtraLite} style={{ position: "absolute", right: 10, padding: 5 }} />
                </ThemedView>
            }>
            {
                filterProblemsModal &&
                <FilterProblemssModal
                    dal={dal}
                    closeModal={() => setFilterProblemsModal(false)}
                    initialFilters={filters}
                    onFiltersChange={setFilters}
                    wallId={wall.id}
                />
            }
            {
                displayedProblem &&
                <DisplayBolderProblemModal
                    problem={dal.problems.Get({ id: displayedProblem })}
                    closeModal={setDisplayedProblem.bind(this, null)} />
            }
            {
                dal.problems.List({ wallId: wall.id, ...filters }).map(problem =>
                    <BolderProblemPreview
                        key={problem.id}
                        dal={dal}
                        onPress={() => setDisplayedProblem(problem.id)}
                        wall={wall}
                        problem={problem}
                        deleteProblem={deleteProblem}
                    />
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

export default ViewWallScreen;