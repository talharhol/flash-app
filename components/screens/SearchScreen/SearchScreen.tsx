import { StyleSheet, TouchableOpacity } from 'react-native';
import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import React, { useState } from 'react';
import { Wall } from '@/DAL/entities/wall';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';
import PreviewItem from '@/components/general/PreviewItem';
import ThemedView from '@/components/general/ThemedView';
import { TextInput } from 'react-native-gesture-handler';
import { useDal } from '@/DAL/DALService';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

const SearchScreen: React.FC = () => {
    const dal = useDal();
    const router = useRouter();
    const [wallToAdd, setWallToAdd] = useState<Wall | null>(null);
    const [filterWallName, setFilterWallName] = useState<string>('');
    const [filterGymName, setFilterGymName] = useState<string>('');
    const AddWall = (wall: Wall) => {
        dal.currentUser.addWall(wall.id).then(
            () => router.navigate("/")
        )
    };
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
                dal.walls.List({ isPublic: true, gym: filterGymName, name: filterWallName })
                    .map(wall =>
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
        // borderColor: "#555",
        backgroundColor: Colors.backgroundLite
    },
    header: {
        alignItems: 'center',
        backgroundColor: 'transparent',
        flexDirection: "row"
    },
});

export default SearchScreen;