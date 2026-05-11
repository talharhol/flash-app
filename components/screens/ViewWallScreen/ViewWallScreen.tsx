import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from "@/components/general/ThemedView";
import React, { useEffect, useReducer, useState } from 'react';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
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
    const pathname = usePathname();
    
    const router = useRouter();
    const { id, problemId } = useLocalSearchParams<{ id: string; problemId?: string }>();
    console.log("Viewing wall with id:", id);
    // Declare updateGUI before useDal so we can pass it as the update callback.
    // This ensures auth state changes (updateScreen) trigger a re-render here.
    const [_, updateGUI] = useReducer(i => i + 1, 0);
    const dal = useDal(updateGUI);

    const [displayedProblem, setDisplayedProblem] = useState<string | null>(problemId ?? null);
    const [filterProblemsModal, setFilterProblemsModal] = useState(false);
    const [filters, setFilters] = useState<ProblemFilter>({});
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
    
    useEffect(() => {
        if (problemId) setDisplayedProblem(problemId);
    }, [problemId]);

    useEffect(() => {
        if (dal.currentUser.name !== "tmp") {
            setFilters(dal.currentUser.getLastFilters({ id }));
        }
    }, [dal.currentUser.name]);
    
    if (pathname !== "/ViewWall") {
        return null;
    }
    // Wait for Firebase auth — currentUser is "tmp" until login completes
    if (dal.currentUser.name === "tmp") {
        return <ActivityIndicator style={{ flex: 1 }} />;
    }
    
    const isInUserWalls = dal.currentUser.walls.some(w => w.id === id);

    if (!isInUserWalls) {
        return (
            <ActionValidationModal
                closeModal={() => {}}
                cancelAction={() => { console.log("Cancel action triggered", pathname); router.navigate("/"); }}
                approveAction={() => { dal.currentUser.addWall(id).then(updateGUI); }}
                text="This wall isn't in your collection. Would you like to add it?"
            />
        );
    }

    const wall = dal.walls.Get({ id });

    const archivedVersions = dal.walls.List({ activeWallId: wall.id });
    const allVersions = [...archivedVersions, wall].sort((a, b) => a.version - b.version);
    const hasVersions = allVersions.length > 1;
    const selectedWall = (selectedVersionId ? allVersions.find(v => v.id === selectedVersionId) : undefined) ?? wall;

    const problems = dal.problems.List({ wallId: wall.id, wallVersion: selectedWall.version, ...filters });

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
                        <View style={{ position: "absolute", right: 10, flexDirection: "row", alignItems: "center", gap: 4 }}>
                            {wall.owner === dal.currentUser.id && (
                                <MaterialCommunityIcons
                                    onPress={() => router.push({ pathname: "/ReplaceWallImage", params: { id: wall.id } })}
                                    name='image-edit-outline' size={32} color={Colors.backgroundExtraLite} style={{ padding: 5 }} />
                            )}
                            <MaterialCommunityIcons
                                onPress={() => setFilterProblemsModal(true)}
                                name='filter-plus' size={35} color={Colors.backgroundExtraLite} style={{ padding: 5 }} />
                        </View>
                    </ThemedView>
                }>
                {filterProblemsModal &&
                    <FilterProblemssModal
                        dal={dal}
                        closeModal={() => setFilterProblemsModal(false)}
                        initialFilters={filters}
                        onFiltersChange={handleFiltersChange}
                        wallId={wall.id}
                    />
                }
                {displayedProblem &&
                    <DisplayBolderProblemModal
                        problem={dal.problems.Get({ id: displayedProblem })}
                        closeModal={setDisplayedProblem.bind(this, null)} />
                }
{hasVersions &&
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.versionRow}>
                        {allVersions.map(v => {
                            const isSelected = v.id === selectedWall.id;
                            const isCurrent = v.id === wall.id;
                            return (
                                <TouchableOpacity
                                    key={v.id}
                                    onPress={() => setSelectedVersionId(v.id)}
                                    style={[styles.versionPill, isSelected && styles.versionPillSelected]}>
                                    <ThemedText style={[styles.versionPillText, isSelected && styles.versionPillTextSelected]}>
                                        v{v.version}{isCurrent ? ' (current)' : ''}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                }
                {problems.length === 0 ? (
                    <ThemedText style={styles.emptyText}>No problems for version {selectedWall.version}</ThemedText>
                ) : (
                    <View style={viewMode === 'grid' ? { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 } : { rowGap: 12 }}>
                        {problems.map(problem =>
                            <View key={problem.id} style={viewMode === 'grid' ? { width: '50%', alignItems: 'center' } : {}}>
                                <BolderProblemPreview
                                    dal={dal}
                                    compact={viewMode === 'grid'}
                                    onPress={() => setDisplayedProblem(problem.id)}
                                    wall={selectedWall}
                                    problem={problem}
                                    deleteProblem={deleteProblem}
                                />
                            </View>
                        )}
                    </View>
                )}
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
    versionRow: {
        gap: 8,
        paddingVertical: 4,
    },
    versionPill: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: Colors.backgroundDark,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    versionPillSelected: {
        backgroundColor: Colors.backgroundExtraDark,
        borderColor: Colors.backgroundExtraLite,
    },
    versionPillText: {
        fontSize: 13,
        color: Colors.textDark,
    },
    versionPillTextSelected: {
        color: Colors.backgroundExtraLite,
        fontWeight: '600',
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.textDark,
        marginTop: 24,
    },
});

export default ViewWallScreen;