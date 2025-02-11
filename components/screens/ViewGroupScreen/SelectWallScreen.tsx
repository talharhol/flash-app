import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from "@/components/general/ThemedView";
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import PreviewItem from '@/components/general/PreviewItem';
import SelectImageModal from '@/components/general/modals/SelectImageModal';
import { Wall } from '@/DAL/entities/wall';
import { useDal } from '@/DAL/DALService';
import { Colors } from '@/constants/Colors';

const SelectWallScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal();
    const group = dal.groups.Get({ id: useLocalSearchParams().id as string });
    const [selectImageModal, setSelectImageModal] = useState(false);

    useFocusEffect(
        useCallback(
            () => {
                setSelectImageModal(false);
            }, []
        )
    );

    const CreateAnonimusWall: (uri: string) => void = (uri) => {
        let wall = new Wall({
            name: "Anonimus",
            gym: group.id,
            image: { uri: uri },
            isPublic: false,
            owner: group.id
        });
        dal.walls.Add(wall);
        group.AddWall({ wall_id: wall.id });
        createProblem(wall);
    };
    const createProblem = (wall: Wall) => {
        router.push({ pathname: "/CreateBolderProblem", params: { id: wall.id, groupId: group.id } })
    }

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={styles.headerContainer}>
                    <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Select Wall</ThemedText>
                    <MaterialCommunityIcons
                        onPress={() => setSelectImageModal(true)}
                        name='plus-thick' size={35} color={Colors.backgroundExtraLite} style={{ position: "absolute", left: 10, padding: 5 }} />
                </ThemedView>
            }>
            {
                selectImageModal &&
                <SelectImageModal
                    closeModal={() => setSelectImageModal(false)}
                    getImage={CreateAnonimusWall}
                    text='Choose source'
                />
            }
            {
                group.walls
                    .map(id => dal.walls.Get({ id }))
                    .filter(w => w.isPublic)
                    .map(wall => (
                        <TouchableOpacity
                            key={wall.id}
                            onPress={() => createProblem(wall)}
                        >
                            <PreviewItem
                                image={wall.image}
                                title={`${wall.name}@${wall.gym}`}
                                subTitle={wall.angle && `${wall.angle}°` || undefined}
                                onImagePress={() => createProblem(wall)}
                            />
                        </TouchableOpacity>
                    )
                    )
            }
            <View style={{ alignItems: "center" }}>
                <ThemedText type='subtitle'>In group walls</ThemedText>
                <View style={{ height: 2, borderRadius: 1, width: "100%", backgroundColor: Colors.backgroundDark }} />
            </View>
            {
                group.walls.map(id => dal.walls.Get({ id }))
                    .filter(w => !w.isPublic)
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map(wall => (
                        <TouchableOpacity
                            key={wall.id}
                            onPress={() => createProblem(wall)}
                        >
                            <PreviewItem
                                image={wall.image}
                                title={wall.name}
                                onImagePress={() => createProblem(wall)}
                            />
                        </TouchableOpacity>
                    )
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

export default SelectWallScreen;