import { ActivityIndicator, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from "@/components/general/ThemedView";
import React, { useEffect, useReducer, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BolderProblemPreview from '../../general/BolderProblemPreview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DisplayBolderProblemModal from '../../general/modals/DisplayBolderProblemModal';
import FilterProblemssModal from '@/components/general/modals/FilterBoldersModal';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';
import { Problem } from '@/DAL/entities/problem';
import { useDal } from '@/DAL/DALService';
import { Colors } from '@/constants/Colors';
import { ProblemFilter } from '@/DAL/IDAL';

const ViewWallScreen: React.FC = () => {
    const router = useRouter();
    const { id, problemId } = useLocalSearchParams<{ id: string; problemId?: string }>();

    // Declare updateGUI before useDal so we can pass it as the update callback.
    // This ensures auth state changes (updateScreen) trigger a re-render here.
    const [_, updateGUI] = useReducer(i => i + 1, 0);
    const dal = useDal(updateGUI);

    const [displayedProblem, setDisplayedProblem] = useState<string | null>(problemId ?? null);
    const [filterProblemsModal, setFilterProblemsModal] = useState(false);
    const [filters, setFilters] = useState<ProblemFilter>({});
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    useEffect(() => {
        if (problemId) setDisplayedProblem(problemId);
    }, [problemId]);

    useEffect(() => {
        if (dal.currentUser.name !== "tmp") {
            setFilters(dal.currentUser.getLastFilters({ id }));
        }
    }, [dal.currentUser.name]);

    // Wait for Firebase auth — currentUser is "tmp" until login completes
    if (dal.currentUser.name === "tmp") {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }

    const isInUserWalls = dal.currentUser.walls.some(w => w.id === id);

    if (!isInUserWalls) {
        return (
            <ActionValidationModal
                closeModal={() => {}}
                cancelAction={() => router.navigate("/")}
                approveAction={() => { dal.currentUser.addWall(id).then(updateGUI); }}
                text="This wall isn't in your collection. Would you like to add it?"
            />
        );
    }

    const wall = dal.walls.Get({ id });

    const handleFiltersChange = (f: ProblemFilter) => {
        setFilters(f);
        dal.currentUser.setFilters({ id: wall.id, filters: f });
    };

    const deleteProblem = (problem: Problem) => {
        dal.problems.Remove(problem).then(updateGUI);
    };

    return (
        <View style={{ flex: 1 }}>
            <ParallaxScrollView
                headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
                headerImage={
                    <ThemedView style={styles.headerContainer}>
                        <MaterialCommunityIcons
                            onPress={() => router.push({ pathname: "/CreateBolderProblem", params: { id: wall.id } })}
                            name='plus-thick' size={35} color={Colors.backgroundExtraLite} style={{ position: "absolute", left: 10, padding: 5, zIndex: 1 }} />
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
                        onFiltersChange={handleFiltersChange}
                        wallId={wall.id}
                    />
                }
                {
                    displayedProblem &&
                    <DisplayBolderProblemModal
                        problem={dal.problems.Get({ id: displayedProblem })}
                        closeModal={setDisplayedProblem.bind(this, null)} />
                }
                <View style={viewMode === 'grid' ? { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 } : {rowGap: 12}}>
                    {
                        dal.problems.List({ wallId: wall.id, ...filters }).map(problem =>
                            <View key={problem.id} style={viewMode === 'grid' ? { width: '50%', alignItems: 'center' } : {}}>
                                <BolderProblemPreview
                                    dal={dal}
                                    compact={viewMode === 'grid'}
                                    onPress={() => setDisplayedProblem(problem.id)}
                                    wall={wall}
                                    problem={problem}
                                    deleteProblem={deleteProblem}
                                />
                            </View>
                        )
                    }
                </View>
            </ParallaxScrollView>
            <View style={styles.fab}>
                <MaterialCommunityIcons
                    onPress={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
                    name={viewMode === 'grid' ? 'view-list' : 'view-grid'}
                    size={28} color={Colors.backgroundExtraLite} />
            </View>
        </View>
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
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: Colors.backgroundExtraDark,
        borderRadius: 28,
        padding: 10,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
});

export default ViewWallScreen;