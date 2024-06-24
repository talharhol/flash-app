import { Image, StyleSheet, Platform, Button, Touchable, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import { walls } from '@/app/debugData';
import React, { useState } from 'react';
import { Wall } from '@/dataTypes/wall';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';
import PreviewItem from '@/components/general/PreviewItem';
import ThemedView from '@/components/general/ThemedView';
import { useRouter } from 'expo-router';

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
                    <TouchableOpacity key={wall.id} onPress={() => router.push({ pathname: "/ViewWall", params: { id: wall.id }})}>
                        <PreviewItem
                        image={wall.image}
                        title={`${wall.name}@${wall.gym}`}
                        subTitle={wall.angle && `${wall.angle}°` || undefined}
                        onRemove={setWallToRemove.bind(this, wall)}
                    />
                    </TouchableOpacity>
                    
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