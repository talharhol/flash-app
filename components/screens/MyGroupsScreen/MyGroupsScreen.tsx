import { StyleSheet, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from '@/components/general/ThemedView';
import { groups as debugGroups } from '@/app/debugData';
import React, { useState } from 'react';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';
import PreviewItem from '@/components/general/PreviewItem';
import { Group } from '@/dataTypes/group';
import { useRouter } from 'expo-router';

const MyGroupsScreen: React.FC = () => {
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
                    <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>My Groups</ThemedText>
                </ThemedView>
            }>
            {groupToRemove && <ActionValidationModal closeModal={setGroupToRemove.bind(this, null)} approveAction={RemoveGroup.bind(this, groupToRemove)} text={`Remove ${groupToRemove.name} from your walls?`} />}
            {
                groups.map(group =>
                    <TouchableOpacity key={group.id} onPress={() => router.push({ pathname: "/ViewGroupScreen", params: { id: group.id }})}>
                        <PreviewItem
                            image={group.image}
                            title={group.name}
                            descriprion={group.getDescription()}
                            onRemove={setGroupToRemove.bind(this, group)}
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

export default MyGroupsScreen;