import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDal } from '@/DAL/DALService';
import ActionValidationModal from '@/components/general/modals/ActionValidationModal';
import EditUserModal from './EditUserModal';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/general/ThemedText';

const SettingsScreen: React.FC = () => {
    const router = useRouter();
    const dal = useDal(() => setUser(dal.currentUser));
    const [logoutModal, setLogoutModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [user, setUser] = useState(dal.currentUser);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title" style={styles.headerTitle}>Settings</ThemedText>
            </View>

            {logoutModal && (
                <ActionValidationModal
                    text="Log out?"
                    subText="You can always login again :)"
                    approveAction={() => dal.signout()}
                    closeModal={() => setLogoutModal(false)}
                />
            )}
            {editModal && (
                <EditUserModal
                    closeModal={() => setEditModal(false)}
                    user={dal.currentUser}
                    editUser={u => {
                        dal.users.Update(u);
                        setEditModal(false);
                    }}
                />
            )}

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.profileCard} onPress={() => setEditModal(true)} activeOpacity={0.8}>
                    <View style={styles.avatarWrap}>
                        <Image source={user.image} style={styles.avatar} />
                        <View style={styles.editBadge}>
                            <Ionicons name="pencil" size={11} color={Colors.textLite} />
                        </View>
                    </View>
                    <View style={styles.profileInfo}>
                        <ThemedText type="subtitle2" style={styles.userName}>{user.name}</ThemedText>
                        <ThemedText type="default1" style={styles.editHint}>Tap to edit profile</ThemedText>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.backgroundExtraLite} />
                </TouchableOpacity>

                <ThemedText type="defaultSemiBold2" style={styles.sectionLabel}>CREATE</ThemedText>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/CreateWall")} activeOpacity={0.8}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="image-outline" size={26} color={Colors.textLite} />
                        </View>
                        <ThemedText type="defaultSemiBold" style={styles.actionLabel}>New Wall</ThemedText>
                        <ThemedText type="default2" style={styles.actionSub}>Add a climbing wall</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionCard} onPress={() => router.push("/CreateGroup")} activeOpacity={0.8}>
                        <View style={styles.actionIcon}>
                            <Ionicons name="people-outline" size={26} color={Colors.textLite} />
                        </View>
                        <ThemedText type="defaultSemiBold" style={styles.actionLabel}>New Group</ThemedText>
                        <ThemedText type="default2" style={styles.actionSub}>Start a climbing crew</ThemedText>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={() => setLogoutModal(true)} activeOpacity={0.8}>
                    <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
                    <ThemedText type="defaultSemiBold" style={styles.logoutText}>Log Out</ThemedText>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundLite,
    },
    header: {
        height: 100,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.backgroundDark,
    },
    headerTitle: {
        color: Colors.textLite,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
        gap: 14,
    },
    profileCard: {
        backgroundColor: Colors.backgroundDark,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderWidth: 1,
        borderColor: Colors.backgroundExtraDark,
    },
    avatarWrap: {
        position: 'relative',
    },
    avatar: {
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 2,
        borderColor: Colors.backgroundExtraLite,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.backgroundExtraDark,
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.backgroundDark,
    },
    profileInfo: {
        flex: 1,
        gap: 3,
    },
    userName: {
        color: Colors.textLite,
    },
    editHint: {
        color: Colors.backgroundExtraLite,
    },
    sectionLabel: {
        color: Colors.backgroundDeep,
        letterSpacing: 1.5,
        marginLeft: 4,
        marginTop: 6,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        backgroundColor: Colors.backgroundDark,
        borderRadius: 16,
        paddingVertical: 22,
        paddingHorizontal: 12,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.backgroundExtraDark,
    },
    actionIcon: {
        backgroundColor: Colors.backgroundExtraDark,
        borderRadius: 12,
        padding: 10,
        marginBottom: 2,
    },
    actionLabel: {
        color: Colors.textLite,
    },
    actionSub: {
        color: Colors.backgroundExtraLite,
        textAlign: 'center',
    },
    logoutButton: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: Colors.danger,
        marginTop: 8,
    },
    logoutText: {
        color: Colors.danger,
    },
});

export default SettingsScreen;
