import { StyleSheet, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import { walls } from '@/app/debugData';
import React, { useState } from 'react';
import { Wall } from '@/dataTypes/wall';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';
import PreviewItem from '@/components/general/PreviewItem';
import ThemedView from '@/components/general/ThemedView';
import { TextInput } from 'react-native-gesture-handler';

const SearchScreen: React.FC = () => {
    const [wallToAdd, setWallToAdd] = useState<Wall | null>(null);
    const [filterWallName, setFilterWallName] = useState<string>('');
    const [filterGymName, setFilterGymName] = useState<string>('');
    const AddWall = (wall: Wall) => {
        alert("added: " + wall.name);
    };
    const filterWalls = (wall: Wall) => {
        return (
            wall.name.toLocaleLowerCase().includes(filterWallName.toLocaleLowerCase())
            && wall.gym.toLocaleLowerCase().includes(filterGymName.toLocaleLowerCase())
        )
    }
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={styles.header}>
                    <TextInput placeholder="Wall's name" value={filterWallName} onChangeText={setFilterWallName} style={styles.searchTextInput} />
                    <ThemedText type='title'>@</ThemedText>
                    <TextInput placeholder="Gym's name" value={filterGymName} onChangeText={setFilterGymName} style={styles.searchTextInput} />
                </ThemedView>
            }>
            {wallToAdd && <ActionValidationModal
                closeModal={setWallToAdd.bind(this, null)}
                approveAction={AddWall.bind(this, wallToAdd)}
                text={`Add ${wallToAdd.name} to your walls?`} />}
            {
                walls.filter(filterWalls).map(wall =>
                    <TouchableOpacity
                        key={wall.id}
                        onPress={setWallToAdd.bind(this, wall)}
                    >
                        <PreviewItem
                            image={wall.image}
                            title={`${wall.name}@${wall.gym}`}
                            subTitle={wall.angle && `${wall.angle}°` || undefined}
                        />
                    </TouchableOpacity>

                )
            }
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    searchTextInput: {
        width: "40%",
        height: 40,
        padding: 10,
        margin: 5,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "black"
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    header: {
        alignItems: 'center',
        backgroundColor: 'transparent',
        flexDirection: "row"
    },
});

export default SearchScreen;