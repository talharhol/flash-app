import { StyleSheet, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from "@/components/general/ThemedView";
import React, { useReducer, useState } from 'react';
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
    const [actionsOpen, setActionsOpen] = useState(false);
    const [deleteGroupModal, setDeleteGroupModal] = useState(false);
    const [exitGroupModal, setExitGroupModal] = useState(false);

    const isAdmin = group.admins.includes(dal.currentUser.id);

    const handleFiltersChange = (f: ProblemFilter) => {
        setFilters(f);
        dal.currentUser.setFilters({ id: group.id, filters: f });
    };

    const deleteProblem = async (problem: Problem) => {
        await group.RemoveProblem({ problem_id: problem.id });
        updateGUI();
    };

    const closeActions = () => setActionsOpen(false);

    type ActionItem = {
        icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
        label: string;
        onPress: () => void;
        isAdmin?: boolean;
    };

    const actions: ActionItem[] = [
        {
            icon: 'plus-thick',
            label: 'Add boulder',
            onPress: () => { closeActions(); router.push({ pathname: "/SelectWallScreen", params: { id: group.id } }); },
        },
        {
            icon: 'filter-plus',
            label: 'Edit filters',
            onPress: () => { closeActions(); setFilterProblemsModal(true); },
        },
        {
            icon: viewMode === 'grid' ? 'view-list' : 'view-grid',
            label: viewMode === 'grid' ? 'List layout' : 'Grid layout',
            onPress: () => { setViewMode(v => v === 'list' ? 'grid' : 'list'); closeActions(); },
        },
        {
            icon: 'exit-to-app' as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
            label: 'Exit group',
            onPress: () => { closeActions(); setExitGroupModal(true); },
        },
        ...(isAdmin ? [{
            icon: 'trash-can-outline' as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
            label: 'Delete group',
            onPress: () => { closeActions(); setDeleteGroupModal(true); },
            isAdmin: true,
        },
        {
            icon: 'pencil-outline' as React.ComponentProps<typeof MaterialCommunityIcons>['name'],
            label: 'Edit group',
            onPress: () => { closeActions(); router.push({ pathname: "/CreateGroup", params: { id: group.id } }); },
            isAdmin: true,
        }] : []),
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
                        <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>{group.name}</ThemedText>
                    </ThemedView>
                }>
                {displayedProblem &&
                    <DisplayBolderProblemModal
                        problem={dal.problems.Get({ id: displayedProblem })}
                        closeModal={() => setDisplayedProblem(null)} />
                }
                {filterProblemsModal &&
                    <FilterProblemssModal
                        dal={dal}
                        closeModal={() => setFilterProblemsModal(false)}
                        initialFilters={filters}
                        onFiltersChange={handleFiltersChange}
                        groupId={group.id}
                    />
                }
                {deleteGroupModal && (
                    <ActionValidationModal
                        closeModal={() => setDeleteGroupModal(false)}
                        cancelAction={() => setDeleteGroupModal(false)}
                        approveAction={() => {
                            dal.groups.Remove(group).then(() => router.navigate("/"));
                        }}
                        text="Delete this group? This cannot be undone."
                    />
                )}
                {exitGroupModal && (
                    <ActionValidationModal
                        closeModal={() => setExitGroupModal(false)}
                        cancelAction={() => setExitGroupModal(false)}
                        approveAction={() => {
                            dal.currentUser.removeGroup(group.id);
                            router.navigate("/");
                        }}
                        text="Exit this group?"
                    />
                )}
                <View style={viewMode === 'grid' ? { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 } : { gap: 12 }}>
                    {group.FilterProblems(filters).map(problem => (
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
                    ))}
                </View>
            </ParallaxScrollView>

            <View style={styles.fabContainer}>
                {actionsOpen && (
                    <View style={styles.actionsStack}>
                        {actions.map(action => (
                            <TouchableOpacity key={action.label} style={styles.actionRow} onPress={action.onPress}>
                                <View style={[styles.actionLabelPill, action.isAdmin && styles.actionLabelPillAdmin]}>
                                    <ThemedText style={styles.actionLabelText}>{action.label}</ThemedText>
                                </View>
                                <View style={[styles.actionIcon, action.isAdmin && styles.actionIconAdmin]}>
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
};

const styles = StyleSheet.create({
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        width: "100%",
        flexDirection: "row",
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
    actionLabelPillAdmin: {
        backgroundColor: Colors.backgroundDeep,
    },
    actionIconAdmin: {
        backgroundColor: Colors.backgroundDeep,
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
});

export default ViewGroupScreen;
