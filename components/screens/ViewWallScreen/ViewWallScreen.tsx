import { StyleSheet, Touchable, View } from 'react-native';

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
import { FilterProblems, ProblemFilter } from '@/DAL/entities/problem';
import { useDal } from '@/DAL/DALService';

const ViewWallScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal();
    const wall = dal.walls.Get(useLocalSearchParams());
    const [displayedProblem, setDisplayedProblem] = useState<string | null>(null);
    const [filterProblemsModal, setFilterProblemsModal] = useState(false);
    const [filters, setFilters] = useState<ProblemFilter>({
        minGrade: 1,
        maxGrade: 15,
        name: "",
        setters: [],
        isPublic: true
    });

    return (
        <View style={{ height: "100%" }}>

            {displayedProblem &&
                <DisplayBolderProblemModal
                    problem={dal.problems.Get({ id: displayedProblem })}
                    closeModal={setDisplayedProblem.bind(this, null)} />
            }
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
                            onPress={() => router.push({ pathname: "/CreateBolderProblem", params: { id: wall.id } })}
                            name='add-circle-outline' size={35} color={'#A1CEDC'} style={{ position: "absolute", left: 10, padding: 5 }} />
                        <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>{wall.name}@{wall.gym}</ThemedText>
                        <Ionicons
                            onPress={() => setFilterProblemsModal(true)}
                            name='filter' size={35} color={'#A1CEDC'} style={{ position: "absolute", right: 10, padding: 5 }} />
                    </ThemedView>
                }>
                {
                    dal.problems.List({ wallId: wall.id })
                        .filter(FilterProblems(filters))
                        .map(problem =>
                            <BolderProblemPreview
                                key={problem.id}
                                onPress={() => setDisplayedProblem(problem.id)}
                                style={{ alignSelf: "center" }}
                                wall={wall}
                                problem={problem}
                            />
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

export default ViewWallScreen;