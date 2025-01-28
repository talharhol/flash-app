import { StyleSheet, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from '@/components/general/ThemedView';
import React, { useState } from 'react';
import PreviewItem from '@/components/general/PreviewItem';
import { useRouter } from 'expo-router';
import { BaseButton } from 'react-native-gesture-handler';
import { useDal } from '@/DAL/DALService';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';

const SettingsScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal();
    const [logoutModal, setLogoutModal] = useState(false);
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={styles.title}>
                    <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Settings</ThemedText>
                </ThemedView>
            }>
            {
                logoutModal && 
                <ActionValidationModal 
                text='Log out? you can allway login again :)'
                approveAction={() => dal.signout()}
                closeModal={() => setLogoutModal(false)} />
            }
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
            <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
                <BaseButton onPress={() => setLogoutModal(true)} style={styles.actionButton}>
                    <ThemedText type='subtitle'>Log Out</ThemedText>
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
    title: {
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
});

export default SettingsScreen;