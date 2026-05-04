import { StyleSheet, TouchableOpacity, View } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';
import { getCurrentLocation } from '@/utils/location';

const SearchScreen: React.FC = () => {
    const dal = useDal();
    const router = useRouter();
    const [wallToAdd, setWallToAdd] = useState<Wall | null>(null);
    const [filterWallName, setFilterWallName] = useState<string>('');
    const [filterGymName, setFilterGymName] = useState<string>('');
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [fetchingLocation, setFetchingLocation] = useState(false);

    const AddWall = (wall: Wall) => {
        dal.currentUser.addWall(wall.id).then(
            () => router.navigate("/")
        )
    };

    const toggleLocationSort = async () => {
        if (userLocation) {
            setUserLocation(null);
            return;
        }
        try {
            setFetchingLocation(true);
            const location = await getCurrentLocation();
            if (location) setUserLocation(location);
        } catch {
            alert('Failed to get location');
        } finally {
            setFetchingLocation(false);
        }
    };

    return (
        <View style={styles.container}>
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
                    dal.walls.List({
                        isPublic: true,
                        gym: filterGymName,
                        name: filterWallName,
                        lat: userLocation?.lat,
                        lng: userLocation?.lng,
                    })
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
            <TouchableOpacity
                style={[styles.fab, userLocation && styles.fabActive]}
                onPress={toggleLocationSort}
                disabled={fetchingLocation}
            >
                <Ionicons
                    name={fetchingLocation ? 'locate' : 'location'}
                    size={26}
                    color={userLocation ? Colors.backgroundDark : '#fff'}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
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
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#555',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    fabActive: {
        backgroundColor: '#A1CEDC',
    },
});

export default SearchScreen;