import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import { walls } from '@/app/debugData';
import React, { useState } from 'react';
import { Wall } from '@/dataTypes/wall';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';
import ThemedView from '@/components/general/ThemedView';
import { useRouter } from 'expo-router';
import BasicButton from '@/components/general/Buttom';
import SwipablePreviewItem from '@/components/general/SwipeablePreviewItem';

const MyWalssScreen: React.FC = () => {
    const router = useRouter();
    const [wallToRemove, setWallToRemove] = useState<Wall | null>(null);
    const RemoveWall = (wall: Wall) => {
        walls.filter(v => v.id != wall.id);
        setWallToRemove(null);
    };
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={styles.reactLogo}>
                    <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>My Walls</ThemedText>
                </ThemedView>
            }>
            {wallToRemove && <ActionValidationModal closeModal={setWallToRemove.bind(this, null)} approveAction={RemoveWall.bind(this, wallToRemove)} text={`Remove ${wallToRemove.name} from your walls?`} />}
            {
                walls.map(wall =>
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