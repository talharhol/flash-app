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

    const results = dal.walls.List({
        isPublic: true,
        gym: filterGymName,
        name: filterWallName,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
    });

    return (
        <View style={styles.container}>
            <ParallaxScrollView
                headerBackgroundColor={{ light: Colors.backgroundDark, dark: Colors.backgroundDeep }}
                headerImage={
                    <ThemedView style={styles.header}>
                        <View style={styles.searchRow}>
                            <Ionicons name="search" size={16} color={Colors.backgroundDeep} style={styles.searchIcon} />
                            <TextInput
                                placeholder="Wall name"
                                placeholderTextColor={Colors.backgroundExtraDark}
                                value={filterWallName}
                                onChangeText={setFilterWallName}
                                style={styles.searchTextInput}
                            />
                        </View>
                        <View style={styles.searchRow}>
                            <Ionicons name="business" size={16} color={Colors.backgroundDeep} style={styles.searchIcon} />
                            <TextInput
                                placeholder="Gym name"
                                placeholderTextColor={Colors.backgroundExtraDark}
                                value={filterGymName}
                                onChangeText={setFilterGymName}
                                style={styles.searchTextInput}
                            />
                        </View>
                    </ThemedView>
                }>
                {wallToAdd && <ActionValidationModal
                    closeModal={setWallToAdd.bind(this, null)}
                    approveAction={AddWall.bind(this, wallToAdd)}
                    text={`Add ${wallToAdd.name} to your walls?`} />}
                {results.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={48} color={Colors.backgroundDark} />
                        <ThemedText type="default1" style={styles.emptyText}>No walls found</ThemedText>
                    </View>
                )}
                {results.map(wall =>
                    <TouchableOpacity
                        key={wall.id}
                        onPress={setWallToAdd.bind(this, wall)}
                        activeOpacity={0.75}
                    >
                        <PreviewItem
                            image={wall.image}
                            title={wall.name}
                            subTitle={wall.gym}
                            descriprion={wall.angle ? `${wall.angle}°` : undefined}
                        />
                    </TouchableOpacity>
                )}
            </ParallaxScrollView>
            <TouchableOpacity
                style={[styles.fab, userLocation && styles.fabActive]}
                onPress={toggleLocationSort}
                disabled={fetchingLocation}
            >
                <Ionicons
                    name={fetchingLocation ? 'locate' : 'location'}
                    size={26}
                    color={userLocation ? Colors.backgroundDeep : Colors.textLite}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        backgroundColor: 'transparent',
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 12,
    },
    searchRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 8,
        height: 38,
    },
    searchIcon: {
        marginRight: 4,
    },
    searchTextInput: {
        flex: 1,
        height: '100%',
        color: Colors.textDark,
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 12,
    },
    emptyText: {
        color: Colors.backgroundExtraDark,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.backgroundDeep,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    fabActive: {
        backgroundColor: Colors.backgroundExtraLite,
    },
});

export default SearchScreen;