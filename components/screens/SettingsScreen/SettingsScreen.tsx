import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/general/ParallaxScrollView';
import { ThemedText } from '@/components/general/ThemedText';
import ThemedView from '@/components/general/ThemedView';
import React, { useState } from 'react';
import PreviewItem from '@/components/general/PreviewItem';
import { useRouter } from 'expo-router';
import { BaseButton } from 'react-native-gesture-handler';
import { useDal } from '@/DAL/DALService';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';
import EditUserModal from './EditUserModal';
import { Colors } from '@/constants/Colors';

const SettingsScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal(() => setUser(dal.currentUser));
    const [logoutModal, setLogoutModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [user, setUser] = useState(dal.currentUser);
    return (
        <View style={{ flex: 1, backgroundColor: Colors.backgroundLite }}>
            <View style={styles.title}>
                <ThemedText type="title" style={{ backgroundColor: 'transparent' }}>Settings</ThemedText>
            </View>
            {
                logoutModal &&
                <ActionValidationModal
                    text='Log out?'
                    subText='you can allway login again :)'
                    approveAction={() => dal.signout()}
                    closeModal={() => setLogoutModal(false)} />
            }
            {
                editModal &&
                <EditUserModal
                    closeModal={() => setEditModal(false)} user={dal.currentUser} editUser={u => {
                        dal.users.Update(u);
                        setEditModal(false);
                    }} />
            }
            <View style={{ flex: 1, padding: "8%", gap: 16 }}>
                <TouchableOpacity onPress={() => setEditModal(true)}>
                    <PreviewItem
                        image={user.image}
                        title={user.name}
                        descriprion='click to edit'
                    />
                </TouchableOpacity>
                <View style={{ flexDirection: "row", width: "100%", justifyContent: "space-between" }}>
                    <BaseButton onPress={() => router.push("/CreateWall")} style={styles.actionButton}>
                        <ThemedText type='subtitle2'>New Wall</ThemedText>
                    </BaseButton>
                    <BaseButton onPress={() => router.push("/CreateGroup")} style={styles.actionButton}>
                        <ThemedText type='subtitle2'>New Group</ThemedText>
                    </BaseButton>
                </View>
                <View style={{ flexDirection: "row", bottom: "4%", position: "absolute", alignSelf: "center"}}>
                    <BaseButton onPress={() => setLogoutModal(true)} style={[styles.actionButton]}>
                        <ThemedText type='subtitle2'>Log Out</ThemedText>
                    </BaseButton>
                </View>
            </View>
        </View>
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
        backgroundColor: Colors.backgroundDark,
        justifyContent: "center",
        alignItems: "center"
    },
    title: {
        height: 100,
        paddingTop: Platform.OS === 'ios' ? 50 : 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.backgroundDark,
    },
});

export default SettingsScreen;