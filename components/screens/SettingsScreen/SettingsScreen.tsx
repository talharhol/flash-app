import { StyleSheet, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from '@/components/general/ThemedView';
import React from 'react';
import PreviewItem from '@/components/general/PreviewItem';
import { useRouter } from 'expo-router';
import { BaseButton } from 'react-native-gesture-handler';
import { useDal } from '@/DAL/DALService';

const SettingsScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal();
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={styles.reactLogo}>
                    <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Settings</ThemedText>
                </ThemedView>
            }>
            <TouchableOpacity onPress={() => alert()}>
                <PreviewItem
                    image={dal.currentUser.image}
                    title="Edit profile"
                />
            </TouchableOpacity>
            <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
                <BaseButton onPress={() => router.push("/CreateWall")} style={styles.actionButton}>
                    <ThemedText type='subtitle'>New Wall</ThemedText>
                </BaseButton>
                <BaseButton onPress={() => router.push("/CreateGroup")} style={styles.actionButton}>
                    <ThemedText type='subtitle'>New Group</ThemedText>
                </BaseButton>
            </View>

        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    actionButton: {
        gap: 16,
        marginRight: 8,
        marginLeft: 8,
        flex: 1, 
        height: 50,
        borderRadius: 8,
        backgroundColor: "gray",
        justifyContent: "center",
        alignItems: "center"
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
    reactLogo: {
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
});

export default SettingsScreen;