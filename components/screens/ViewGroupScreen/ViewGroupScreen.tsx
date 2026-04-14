import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from "@/components/general/ThemedView";
import React, { useReducer, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BolderProblemPreview from '../../general/BolderProblemPreview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
        <View style={{ flex: 1 }}>
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
                <View style={viewMode === 'grid' ? { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 } : {}}>
                    {
                        group.FilterProblems(filters).map(problem => (
                            <View key={problem.id} style={viewMode === 'grid' ? { width: '50%', alignItems: 'center' } : {}}>
                                <BolderProblemPreview
                                    dal={dal}
                                    compact={viewMode === 'grid'}
                                    onPress={() => setDisplayedProblem(problem.id)}
                                    wall={dal.walls.Get({ id: problem.wallId })}
                                    problem={problem}
                                    deleteProblem={deleteProblem}
                                />
                            </View>
                        ))
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

export default ViewGroupScreen;