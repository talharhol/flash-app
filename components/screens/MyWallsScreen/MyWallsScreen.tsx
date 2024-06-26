import { Image, StyleSheet, Platform, Button, Touchable, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import { walls } from '@/app/debugData';
import React, { useState } from 'react';
import { Wall } from '@/dataTypes/wall';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';
import PreviewItem from '@/components/general/PreviewItem';
import ThemedView from '@/components/general/ThemedView';
import { useRouter } from 'expo-router';
import SwipeableComponent from '@/components/general/Swipeable';
import BasicModal from '@/components/general/modals/BasicModal';
import BasicButton from '@/components/general/Buttom';
import { Ionicons } from '@expo/vector-icons';

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
                    <SwipeableComponent
                        frontComponent={() => {
                            return (
                                <View>
                                    <PreviewItem
                                        key={wall.id}
                                        image={wall.image}
                                        title={`${wall.name}@${wall.gym}`}
                                        subTitle={wall.angle && `${wall.angle}°` || undefined}
                                        onImagePress={() => router.push({ pathname: "/ViewWall", params: { id: wall.id } })}
                                        style={{ height: 120, borderRadius: 8 }}
                                    />
                                    <View style={{ position: 'absolute', right: 0, height: 120, justifyContent: "center"}}>
                                        <Ionicons size={15} name='arrow-back' />
                                    </View>
                                </View>

                            )
                        }
                        }
                        hiddenComponent={() => {
                            return (
                                <View style={{ height: 120, borderRadius: 8, backgroundColor: "blue", flexDirection: "row" }}>
                                    <View style={{ position: "absolute", right: 0, width: 120, height: 120, flexDirection: "column", alignItems: 'center', justifyContent: "space-around" }}>
                                        <BasicButton
                                            text='Remove'
                                            onPress={setWallToRemove.bind(this, wall)}
                                            color="red"
                                            style={{ width: 100 }}
                                        />
                                        <BasicButton
                                            text='Edit'
                                            color="red"
                                            style={{ width: 100 }}
                                        />
                                    </View>
                                </View>
                            )
                        }}
                        rightOpenValue={-120} />
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