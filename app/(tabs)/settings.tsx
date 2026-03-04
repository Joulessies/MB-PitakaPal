import { useAuth, useUser } from '@clerk/clerk-expo';
import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ThemeContext';

const SECTIONS = [
    {
        title: 'Account',
        items: [
            { id: 'profile', icon: 'user', label: 'Edit Profile', type: 'link' },
            { id: 'notifications', icon: 'bell', label: 'Notifications', type: 'switch', value: true },
            { id: 'security', icon: 'lock', label: 'Security & Privacy', type: 'link' },
        ]
    },
    {
        title: 'Preferences',
        items: [
            { id: 'theme', icon: 'moon', label: 'Dark Mode', type: 'switch', value: true },
            { id: 'face_id', icon: 'smile', label: 'Face ID Login', type: 'switch', value: false },
        ]
    },
    {
        title: 'Support',
        items: [
            { id: 'help', icon: 'help-circle', label: 'Help Center', type: 'link' },
            { id: 'terms', icon: 'file-text', label: 'Terms & Conditions', type: 'link' },
        ]
    }
];

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { signOut } = useAuth();
    const { user } = useUser();
    const { theme, colors, toggleTheme } = useAppTheme();

    // State for switches (only notifications and face_id are local state now)
    const [toggles, setToggles] = useState({
        notifications: true,
        face_id: false
    });

    const getSwitchValue = (id: string) => {
        if (id === 'theme') return theme === 'dark';
        // @ts-ignore
        return toggles[id] ?? false;
    };

    const handleToggle = async (key: string) => {
        if (key === 'theme') {
            await toggleTheme();
            return;
        }

        // Calculate new value for local toggles
        const newValue = !toggles[key as keyof typeof toggles];

        if (key === 'face_id' && newValue) {
            // Check hardware
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) {
                Alert.alert('Unavailable', 'Your device does not support biometrics.');
                return;
            }
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!isEnrolled) {
                Alert.alert('Unavailable', 'No biometrics enrolled on this device.');
                return;
            }
            // Authenticate to enable
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to enable Face ID',
            });
            if (!result.success) {
                Alert.alert('Failed', 'Authentication failed.');
                return;
            }
        }

        if (key === 'notifications' && newValue) {
            // Mock permission request
        }

        setToggles(prev => ({ ...prev, [key]: newValue }));
    };

    const handlePressItem = (item: any) => {
        if (item.type === 'switch') {
            handleToggle(item.id);
        } else if (item.id === 'profile') {
            router.push('/profile');
        } else if (item.id === 'help') {
            Linking.openURL('https://support.example.com');
        } else if (item.id === 'terms') {
            Linking.openURL('https://example.com/terms');
        } else if (item.id === 'security') {
            Alert.alert('Coming Soon', 'Security settings page is under construction.');
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                            router.replace('/login');
                        } catch (err) {
                            console.log('Error signing out', err);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
                    <View style={[styles.profileContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[styles.avatarCircle, { backgroundColor: colors.background }]}>
                            {user?.imageUrl ? (
                                <Image source={{ uri: user.imageUrl }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                            ) : (
                                <Feather name="user" size={30} color={colors.text} />
                            )}
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName || user?.firstName || 'User'}</Text>
                            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.primaryEmailAddress?.emailAddress || 'No email'}</Text>
                        </View>
                        <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.border }]} onPress={() => router.push('/profile')}>
                            <Feather name="edit-2" size={16} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Settings Sections */}
                {SECTIONS.map((section, index) => (
                    <Animated.View key={section.title} entering={FadeInDown.delay(200 + index * 100)} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
                        <View style={[styles.sectionBody, { backgroundColor: colors.card }]}>
                            {section.items.map((item, i) => {
                                const isActive = item.type === 'switch' && getSwitchValue(item.id);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.row,
                                            i !== section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                                        ]}
                                        activeOpacity={item.type === 'switch' ? 1 : 0.7}
                                        onPress={() => handlePressItem(item)}
                                    >
                                        <View style={[
                                            styles.iconContainer,
                                            { backgroundColor: isActive ? colors.activeToggle + '20' : colors.border }
                                        ]}>
                                            <Feather
                                                name={item.icon as any}
                                                size={20}
                                                color={isActive ? colors.activeToggle : colors.text}
                                            />
                                        </View>
                                        <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>

                                        {item.type === 'switch' ? (
                                            <Switch
                                                value={isActive}
                                                onValueChange={() => handleToggle(item.id)}
                                                trackColor={{ false: colors.inactiveToggle, true: colors.activeToggle }}
                                                thumbColor={'#FFF'}
                                            />
                                        ) : (
                                            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Animated.View>
                ))}

                {/* Log Out Button */}
                <Animated.View entering={FadeInDown.delay(600)} style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.logoutBtn, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}
                        onPress={handleLogout}
                    >
                        <Feather name="log-out" size={20} color={colors.danger} style={{ marginRight: 8 }} />
                        <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out</Text>
                    </TouchableOpacity>
                    <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0 (Build 124)</Text>
                </Animated.View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },

    /* Header Profile */
    header: {
        paddingHorizontal: 24,
        marginVertical: 24,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
    },
    avatarCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        overflow: 'hidden'
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
    },
    editBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* Sections */
    section: {
        marginBottom: 24,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionBody: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    rowLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },

    /* Footer */
    footer: {
        paddingHorizontal: 24,
        marginTop: 20,
        alignItems: 'center',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
    },
    logoutText: {
        fontWeight: '700',
        fontSize: 16,
    },
    versionText: {
        fontSize: 12,
    },
});
