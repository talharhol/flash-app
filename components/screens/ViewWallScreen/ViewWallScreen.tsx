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
    // Declare updateGUI before useDal so we can pass it as the update callback.
    // This ensures auth state changes (updateScreen) trigger a re-render here.
    const [_, updateGUI] = useReducer(i => i + 1, 0);
    const dal = useDal(updateGUI);

    const [displayedProblem, setDisplayedProblem] = useState<string | null>(problemId ?? null);
    const [filterProblemsModal, setFilterProblemsModal] = useState(false);
    const [deleteWallModal, setDeleteWallModal] = useState(false);
    const [filters, setFilters] = useState<ProblemFilter>({});
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
    const [actionsOpen, setActionsOpen] = useState(false);
    const [versionPickerOpen, setVersionPickerOpen] = useState(false);

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
    const isOwner = wall.owner === dal.currentUser.id;

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

    const closeActions = () => {
        setActionsOpen(false);
        setVersionPickerOpen(false);
    };

    type ActionItem = {
        icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
        label: string;
        onPress: () => void;
    };

    const actions: ActionItem[] = [
        {
            icon: 'plus-thick',
            label: 'New problem',
            onPress: () => { closeActions(); router.push({ pathname: "/CreateBolderProblem", params: { id: wall.id } }); },
        },
        {
            icon: 'filter-plus',
            label: 'Edit filters',
            onPress: () => { closeActions(); setFilterProblemsModal(true); },
        },
        ...(hasVersions ? [{
            icon: 'layers-triple' as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
            label: `Version: v${selectedWall.version}`,
            onPress: () => setVersionPickerOpen(v => !v),
        }] : []),
        ...(isOwner ? [
            {
                icon: 'image-edit-outline' as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
                label: 'Replace image',
                onPress: () => { closeActions(); router.push({ pathname: "/ReplaceWallImage", params: { id: wall.id } }); },
            },
            {
                icon: 'camera-retake-outline' as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
                label: 'Update image',
                onPress: () => { closeActions(); router.push({ pathname: "/UpdateWallImage", params: { id: wall.id } }); },
            },
            {
                icon: 'view-grid-plus-outline' as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
                label: 'Config holds',
                onPress: () => { closeActions(); router.push({ pathname: "/CreateWallHolds", params: { id: wall.id } }); },
            },
            {
                icon: 'trash-can-outline' as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
                label: 'Delete wall',
                onPress: () => { closeActions(); setDeleteWallModal(true); },
            },
        ] : []),
        {
            icon: viewMode === 'grid' ? 'view-list' : 'view-grid',
            label: viewMode === 'grid' ? 'List layout' : 'Grid layout',
            onPress: () => { setViewMode(v => v === 'list' ? 'grid' : 'list'); closeActions(); },
        },
    ];

    return (
        <View style={{ flex: 1 }}>
            {actionsOpen && (
                <TouchableOpacity
                    style={[StyleSheet.absoluteFill, { zIndex: 10 }]}
                    activeOpacity={1}
                    onPress={closeActions}
                />
            )}
            <ParallaxScrollView
                headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
                headerImage={
                    <ThemedView style={styles.headerContainer}>
                        <ThemedText type="title" style={styles.headerTitle}>{wall.name}</ThemedText>
                        <ThemedText type="default1" style={styles.headerSubtitle}>{wall.gym}</ThemedText>
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
                {deleteWallModal && (
                    <ActionValidationModal
                        closeModal={() => setDeleteWallModal(false)}
                        cancelAction={() => setDeleteWallModal(false)}
                        approveAction={() => {
                            dal.walls.Remove(wall).then(() => router.navigate("/"));
                        }}
                        text="Delete this wall? This cannot be undone."
                    />
                )}
                {displayedProblem &&
                    <DisplayBolderProblemModal
                        problem={dal.problems.Get({ id: displayedProblem })}
                        closeModal={setDisplayedProblem.bind(this, null)} />
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

            <View style={styles.fabContainer}>
                {actionsOpen && (
                    <View style={styles.actionsStack}>
                        {versionPickerOpen && hasVersions && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.versionRow}
                                style={styles.versionPicker}>
                                {allVersions.map(v => {
                                    const isSelected = v.id === selectedWall.id;
                                    const isCurrent = v.id === wall.id;
                                    return (
                                        <TouchableOpacity
                                            key={v.id}
                                            onPress={() => { setSelectedVersionId(v.id); setVersionPickerOpen(false); }}
                                            style={[styles.versionPill, isSelected && styles.versionPillSelected]}>
                                            <ThemedText style={[styles.versionPillText, isSelected && styles.versionPillTextSelected]}>
                                                v{v.version}{isCurrent ? ' (current)' : ''}
                                            </ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                        {actions.map(action => (
                            <TouchableOpacity key={action.label} style={styles.actionRow} onPress={action.onPress}>
                                <View style={styles.actionLabelPill}>
                                    <ThemedText style={styles.actionLabelText}>{action.label}</ThemedText>
                                </View>
                                <View style={styles.actionIcon}>
                                    <MaterialCommunityIcons name={action.icon} size={24} color={Colors.backgroundExtraLite} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                <TouchableOpacity style={styles.fab} onPress={() => setActionsOpen(v => !v)}>
                    <MaterialCommunityIcons
                        name={actionsOpen ? 'close' : 'dots-vertical'}
                        size={28}
                        color={Colors.backgroundExtraLite}
                    />
                </TouchableOpacity>
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
        flexDirection: "column",
    },
    headerTitle: {
        color: Colors.textDark,
        backgroundColor: 'transparent',
    },
    headerSubtitle: {
        color: Colors.textDark,
        backgroundColor: 'transparent',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        alignItems: 'flex-end',
        zIndex: 20,
    },
    actionsStack: {
        alignItems: 'flex-end',
        gap: 10,
        marginBottom: 12,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    actionLabelPill: {
        backgroundColor: Colors.backgroundExtraDark,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    actionLabelText: {
        fontSize: 14,
        color: Colors.backgroundExtraLite,
        fontWeight: '500',
    },
    actionIcon: {
        backgroundColor: Colors.backgroundExtraDark,
        borderRadius: 22,
        padding: 9,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    fab: {
        backgroundColor: Colors.backgroundExtraDark,
        borderRadius: 28,
        padding: 10,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
    versionPicker: {
        maxWidth: 280,
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