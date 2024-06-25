import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from '@/components/general/ThemedView';
import { groups as debugGroups, users } from '@/app/debugData';
import React, { useState } from 'react';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';
import PreviewItem from '@/components/general/PreviewItem';
import { Group } from '@/dataTypes/group';
import { useRouter } from 'expo-router';
import { BaseButton } from 'react-native-gesture-handler';

const SettingsScreen: React.FC = () => {
    const router = useRouter();
    const [groupToRemove, setGroupToRemove] = useState<Group | null>(null);
    const [groups, setGroups] = useState<Group[]>(debugGroups)
    const RemoveGroup = (group: Group) => {
        setGroups(groups.filter(v => v.id != group.id));
        setGroupToRemove(null);
    };
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <ThemedView style={styles.reactLogo}>
                    <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Settings</ThemedText>
                </ThemedView>
            }>
            {groupToRemove && <ActionValidationModal closeModal={setGroupToRemove.bind(this, null)} approveAction={RemoveGroup.bind(this, groupToRemove)} text={`Remove ${groupToRemove.name} from your walls?`} />}
            <TouchableOpacity onPress={() => alert()}>
                <PreviewItem
                    image={users[0].image}
                    title="Edit profile"
                />
            </TouchableOpacity>
            <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
                <BaseButton onPress={alert} style={styles.actionButton}>
                    <ThemedText type='subtitle'>New Wall</ThemedText>
                </BaseButton>
                <BaseButton onPress={alert} style={styles.actionButton}>
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