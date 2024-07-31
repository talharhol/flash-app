import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import React, { useCallback, useState } from 'react';
import { Wall } from '@/DAL/entities/wall';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';
import ThemedView from '@/components/general/ThemedView';
import { useRouter } from 'expo-router';
import BasicButton from '@/components/general/Buttom';
import SwipablePreviewItem from '@/components/general/SwipeablePreviewItem';
import { useDal } from '@/DAL/DALService';

const MyWalssScreen: React.FC = () => {
    const dal = useDal();
    const router = useRouter();
    const [wallToRemove, setWallToRemove] = useState<Wall | null>(null);
    const [wallToDelete, setWallToDelete] = useState<Wall | null>(null);
    const RemoveWall = (wall: Wall) => {
        dal.walls.Remove(dal.walls.Get({ id: wall.id }));
        let newWalls = dal.currentUser.walls;
        setViewWalls(newWalls.filter(w => w.owner !== dal.currentUser.id));
        setOwnedWalls(newWalls.filter(w => w.owner === dal.currentUser.id));
        setWallToRemove(null);
    };
    const DeleteWall = (wall: Wall) => {
        dal.walls.Delete({id: wall.id}).then(() => {
            let newWalls = dal.currentUser.walls;
            setViewWalls(newWalls.filter(w => w.owner !== dal.currentUser.id));
            setOwnedWalls(newWalls.filter(w => w.owner === dal.currentUser.id));
        });
        setWallToDelete(null);
    };
    const allWalls = dal.currentUser.walls;
    const [viewWalls, setViewWalls] = useState(allWalls.filter(w => w.owner !== dal.currentUser.id));
    const [ownedWalls, setOwnedWalls] = useState(allWalls.filter(w => w.owner === dal.currentUser.id));
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={styles.reactLogo}>
                    <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>My Walls</ThemedText>
                </ThemedView>
            }>
            {wallToRemove && <ActionValidationModal closeModal={setWallToRemove.bind(this, null)} approveAction={RemoveWall.bind(this, wallToRemove)} text={`Remove ${wallToRemove.name} from your walls?`} />}
            {wallToDelete && <ActionValidationModal closeModal={setWallToDelete.bind(this, null)} approveAction={DeleteWall.bind(this, wallToDelete)} text={`Delete ${wallToDelete.name}?`} />}
            {
                viewWalls.map(wall =>
                    <SwipablePreviewItem key={wall.id} image={wall.image}
                        title={`${wall.name}@${wall.gym}`}
                        subTitle={wall.angle && `${wall.angle}°` || undefined}
                        onPress={() => router.push({ pathname: "/ViewWall", params: { id: wall.id } })}
                        hiddenComponent={() => {
                            return (
                                <View style={{ height: "100%", flexDirection: "column", alignItems: 'center', justifyContent: "space-evenly" }}>
                                    <BasicButton
                                        text='Remove'
                                        onPress={setWallToRemove.bind(this, wall)}
                                        color="red"
                                        style={{ width: 100 }}
                                    />
                                    <BasicButton
                                        onPress={() => router.push({ pathname: "/CreateWallHolds", params: { id: wall.id } })}
                                        text='Edit'
                                        color="red"
                                        style={{ width: 100 }}
                                    />
                                </View>
                            )
                        }}
                    />
                )
            }
            {ownedWalls.length > 0 &&
                <View style={{ alignItems: "center" }}>
                    <ThemedText type='subtitle'>Owned walls</ThemedText>
                    <View style={{ height: 2, borderRadius: 1, width: "100%", backgroundColor: "gray" }} />
                </View>}
            {
                ownedWalls.map(wall =>
                    <SwipablePreviewItem key={wall.id} image={wall.image}
                        title={`${wall.name}@${wall.gym}`}
                        subTitle={wall.angle && `${wall.angle}°` || undefined}
                        onPress={() => router.push({ pathname: "/ViewWall", params: { id: wall.id } })}
                        hiddenComponent={() => {
                            return (
                                <View style={{ height: "100%", flexDirection: "column", alignItems: 'center', justifyContent: "space-evenly" }}>
                                    <BasicButton
                                        text='Delete'
                                        onPress={setWallToDelete.bind(this, wall)}
                                        color="red"
                                        style={{ width: 100 }}
                                    />
                                    <BasicButton
                                        onPress={() => router.push({ pathname: "/CreateWallHolds", params: { id: wall.id } })}
                                        text='Edit'
                                        color="red"
                                        style={{ width: 100 }}
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
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
});

export default MyWalssScreen;