import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from "@/components/general/ThemedView";
import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BolderProblemPreview from '../../general/BolderProblemPreview';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import DisplayBolderProblemModal from '../../general/modals/DisplayBolderProblemModal';
import FilterProblemssModal from '@/components/general/modals/FilterBoldersModal';
import { FilterProblems, Problem, ProblemFilter } from '@/DAL/entities/problem';
import { useDal } from '@/DAL/DALService';

const ViewGroupScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal();
    const [group, setGroup] = useState(dal.groups.Get({ id: useLocalSearchParams().id as string }));
    const [displayedProblem, setDisplayedProblem] = useState<string | null>(null);
    const [filterProblemsModal, setFilterProblemsModal] = useState(false);
    const [filters, setFilters] = useState<ProblemFilter>({
        minGrade: 1,
        maxGrade: 15,
        name: "",
        setters: []
    });
    const deleteProblem = (problem: Problem) => {
        dal.problems.Remove(problem).then(() => {
            setGroup(dal.groups.Get({id: group.id}));
        });
    }

    return (
        <View style={{ height: "100%" }}>

            {displayedProblem && <DisplayBolderProblemModal
                problem={dal.problems.Get({ id: displayedProblem })}
                closeModal={setDisplayedProblem.bind(this, null)} />}
            {
                filterProblemsModal &&
                <FilterProblemssModal
                    closeModal={() => setFilterProblemsModal(false)}
                    initialFilters={filters}
                    onFiltersChange={setFilters}
                />
            }

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
                    group.FilterProblems(filters).map(problem => {
                        return (
                            <BolderProblemPreview
                                key={problem.id}
                                onPress={() => setDisplayedProblem(problem.id)}
                                style={{ alignSelf: "center" }}
                                wall={dal.walls.Get({ id: problem.wallId })}
                                problem={problem}
                                deleteProblem={deleteProblem}
                            />
                        )
                    }
                    )
                }
            </ParallaxScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        width: "100%",
        flexDirection: "row",
    },
});

export default ViewGroupScreen;