import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import React, { useCallback, useReducer, useState } from 'react';
import { Wall } from '@/DAL/entities/wall';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';
import ThemedView from '@/components/general/ThemedView';
import { useFocusEffect, useRouter } from 'expo-router';
import SwipablePreviewItem from '@/components/general/SwipeablePreviewItem';
import { useDal } from '@/DAL/DALService';
import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MyWallsScreen: React.FC = () => {
    const dal = useDal(() => {
        setOwnedWalls(dal.currentUser.ownedWalls);
        setViewWalls(dal.currentUser.viewerWalls);
    });
    useFocusEffect(
        useCallback(
            () => {
                setOwnedWalls(dal.currentUser.ownedWalls);
                setViewWalls(dal.currentUser.viewerWalls);
            }, []
        )
    );
    const router = useRouter();
    const [wallToRemove, setWallToRemove] = useState<Wall | null>(null);
    const [wallToDelete, setWallToDelete] = useState<Wall | null>(null);
    const RemoveWall = (wall: Wall) => {
        dal.currentUser.removeWall(wall.id).then(
            () => {
                setViewWalls(dal.currentUser.viewerWalls);
                setOwnedWalls(dal.currentUser.ownedWalls);
            }
        )
        setWallToRemove(null);
    };
    const DeleteWall = (wall: Wall) => {
        dal.walls.Remove(wall)
            .then(() => {
                setViewWalls(dal.currentUser.viewerWalls);
                setOwnedWalls(dal.currentUser.ownedWalls);
            }).catch(console.log);
        setWallToDelete(null);
    };
    const [viewWalls, setViewWalls] = useState(dal.currentUser.viewerWalls);
    const [ownedWalls, setOwnedWalls] = useState(dal.currentUser.ownedWalls);
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={styles.title}>
                    <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>My Walls</ThemedText>
                </ThemedView>
            }>
            {wallToRemove && <ActionValidationModal closeModal={setWallToRemove.bind(this, null)} approveAction={RemoveWall.bind(this, wallToRemove)} text={`Remove ${wallToRemove.name} from your walls?`} subText='You can alway add it later' />}
            {wallToDelete && <ActionValidationModal closeModal={setWallToDelete.bind(this, null)} approveAction={DeleteWall.bind(this, wallToDelete)} text={`Delete ${wallToDelete.name}?`} subText='this will permenantly delete this wall' />}
            {
                viewWalls.map(wall =>
                    <SwipablePreviewItem key={wall.id} image={wall.image}
                        title={`${wall.name}@${wall.gym}`}
                        subTitle={wall.angle && `${wall.angle}°` || undefined}
                        onPress={() => router.push({ pathname: "/ViewWall", params: { id: wall.id } })}
                        hiddenComponent={() => {
                            return (
                                <MaterialCommunityIcons
                                    style={{ position: "absolute", right: 5, top: 5 }}
                                    onPress={() => setWallToRemove(wall)}
                                    name='trash-can'
                                    color={Colors.backgroundExtraLite}
                                    size={25}
                                />
                            )
                        }}
                    />
                )
            }
            {
                ownedWalls.length > 0 &&
                <View style={{ alignItems: "center" }}>
                    <ThemedText type='subtitle'>Owned walls</ThemedText>
                    <View style={{ height: 2, borderRadius: 1, width: "100%", backgroundColor: Colors.backgroundDark }} />
                </View>
            }
            {
                ownedWalls.map(wall =>
                    <SwipablePreviewItem key={wall.id} image={wall.image}
                        title={`${wall.name}@${wall.gym}`}
                        subTitle={wall.angle && `${wall.angle}°` || undefined}
                        onPress={() => router.push({ pathname: "/ViewWall", params: { id: wall.id } })}
                        hiddenComponent={() => {
                            return (
                                <View style={{ height: "100%", flexDirection: "column", alignItems: 'center', justifyContent: "space-evenly" }}>
                                    <MaterialCommunityIcons
                                        style={{ position: "absolute", right: 5, top: 5 }}
                                        onPress={() => setWallToDelete(wall)}
                                        name='trash-can'
                                        color={Colors.backgroundExtraLite}
                                        size={25}
                                    />
                                    <MaterialCommunityIcons
                                        onPress={() => router.push({ pathname: "/CreateWallHolds", params: { id: wall.id } })}
                                        size={35} name='puzzle-edit' color={Colors.backgroundExtraLite}
                                    />
                                </View>
                            )
                        }}
                    />
                )
            }

        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    title: {
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
});

export default MyWallsScreen;