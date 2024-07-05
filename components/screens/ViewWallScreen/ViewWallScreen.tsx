import { StyleSheet, Touchable, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from "@/components/general/ThemedView";
import { problems } from '@/app/debugData';
import React, { useState } from 'react';
import { GetProblem, GetWall } from '@/scripts/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BolderProblemPreview from '../../general/BolderProblemPreview';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import DisplayBolderProblemModal from '../../general/DisplayBolderProblemModal';
import FilterProblemssModal from '@/components/general/modals/FilterBoldersModal';

const ViewWallScreen: React.FC = () => {
    const router = useRouter();
    const wall = GetWall(useLocalSearchParams());
    const [displayedProblem, setDisplayedProblem] = useState<string | null>(null);
    const [filterProblemsModal, setFilterProblemsModal] = useState(false);
    const [filters, setFilters] = useState<{
        minGrade: number;
        maxGrade: number;
        name: string;
        setters: string[];
    }>({
        minGrade: 1,
        maxGrade: 15,
        name: "",
        setters: []
    });

    return (
        <View style={{ height: "100%" }}>

            {displayedProblem &&
                <DisplayBolderProblemModal
                    problem={GetProblem({ id: displayedProblem })}
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
                        <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>{wall.name}@{wall.gym}</ThemedText>
                        <Ionicons
                            onPress={() => router.push({ pathname: "/CreateBolderProblem", params: { id: wall.id } })}
                            name='add-circle-outline' size={35} color={'#A1CEDC'} style={{ position: "absolute", left: 0, padding: 5 }} />
                        <Ionicons
                            onPress={() => setFilterProblemsModal(true)}
                            name='filter' size={35} color={'#A1CEDC'} style={{ position: "absolute", right: 0, padding: 5 }} />
                    </ThemedView>
                }>
                {
                    problems.map(problem =>
                        <TouchableOpacity key={problem.id} onPress={setDisplayedProblem.bind(this, problem.id)}>
                            <BolderProblemPreview
                                wall={wall}
                                problem={problem}
                            />
                        </TouchableOpacity>

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