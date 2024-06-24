import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from "@/components/general/ThemedView";
import React, { useState } from 'react';
import { GetGroup, GetProblem, GetWall } from '@/scripts/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import PreviewItem from '@/components/general/PreviewItem';
import SelectImageModal from '@/components/general/modals/SelectImageModal';
import { walls } from '@/app/debugData';
import { Wall } from '@/dataTypes/wall';

const SelectWallScreen: React.FC = () => {
    const router = useRouter();
    const group = GetGroup(useLocalSearchParams());
    const [selectImageModal, setSelectImageModal] = useState(false);
    const CreateAnonimusWall: (uri: string) => void = (uri) => {
        let wall = new Wall({
            name: "Anonimus",
            gym: group.id,
            image: { uri },
        });
        walls.push(
            wall
        );
        router.push({ pathname: "/CreateBolderProblem", params: { id: wall.id } });
    };

    return (
        <View style={{ height: "100%" }}>

            <ParallaxScrollView
                headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
                headerImage={
                    <ThemedView style={styles.headerContainer}>
                        <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Select Wall</ThemedText>
                        <Ionicons
                            onPress={() => setSelectImageModal(true)}
                            name='add-circle-outline' size={35} color={'#A1CEDC'} style={{ position: "absolute", left: 0, padding: 5 }} />
                    </ThemedView>
                }>
                {selectImageModal && <SelectImageModal
                    closeModal={() => setSelectImageModal(false)}
                    getImage={CreateAnonimusWall}
                    text='Choose source' />

                }
                {
                    group.walls.map(wall_id => {
                        let wall = GetWall({ id: wall_id });
                        return (
                            <TouchableOpacity key={wall.id}
                                onPress={() => router.push({ pathname: "/CreateBolderProblem", params: { id: wall.id } })}
                            >
                                <PreviewItem
                                    image={wall.image}
                                    title={`${wall.name}@${wall.gym}`}
                                    subTitle={wall.angle && `${wall.angle}°` || undefined}
                                />
                            </TouchableOpacity>
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

export default SelectWallScreen;