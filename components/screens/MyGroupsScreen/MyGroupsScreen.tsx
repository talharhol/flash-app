import { StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from '@/components/general/ThemedView';
import React, { useState } from 'react';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';
import { Group } from '@/DAL/entities/group';
import { useRouter } from 'expo-router';
import SwipablePreviewItem from '@/components/general/SwipeablePreviewItem';
import BasicButton from '@/components/general/Buttom';
import { useDal } from '@/DAL/DALService';

const MyGroupsScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal();
    const [groupToRemove, setGroupToRemove] = useState<Group | null>(null);
    const RemoveGroup = (group: Group) => {
        dal.currentUser.removeGroup(group.id);
        setGroupToRemove(null);
    };
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
    const DeleteGroup = (group: Group) => {
        dal.groups.Remove(group);
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
            {
                groupToRemove &&
                <ActionValidationModal
                    closeModal={setGroupToRemove.bind(this, null)}
                    approveAction={RemoveGroup.bind(this, groupToRemove)}
                    text={`Exit ${groupToRemove.name}?`}
                />
            }
            {
                groupToDelete &&
                <ActionValidationModal
                    closeModal={setGroupToDelete.bind(this, null)}
                    approveAction={DeleteGroup.bind(this, groupToDelete)}
                    text={`Exit ${groupToDelete.name}?`}
                />
            }
            {
                dal.currentUser.groups.map(group =>
                    <SwipablePreviewItem
                        key={group.id}
                        onPress={() => router.push({ pathname: "/ViewGroupScreen", params: { id: group.id } })}
                        image={group.image}
                        title={group.name}
                        descriprion={group.getDescription()}
                        hiddenComponent={() => {
                            return (
                                <View style={{ height: "100%", flexDirection: "column", alignItems: 'center', justifyContent: "space-evenly" }}>
                                    <BasicButton
                                        text='Exit'
                                        onPress={() => setGroupToRemove(group)}
                                        color="red"
                                        style={{ width: 100 }}
                                    />
                                    {
                                        group.admins.includes(dal.currentUser.id) &&
                                        <BasicButton
                                            text='Delete'
                                            onPress={() => setGroupToDelete(group)}
                                            color="red"
                                            style={{ width: 100 }}
                                        />
                                    }
                                </View>
                            )
                        }}
                    />
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