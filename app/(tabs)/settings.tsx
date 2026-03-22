import { useAuth, useUser } from '@clerk/clerk-expo';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Share, Switch } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, XStack, YStack } from 'tamagui';
import { useAccounts } from '../../context/AccountContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useTransactions } from '../../context/TransactionContext';

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
        title: 'Data',
        items: [
            { id: 'export', icon: 'download', label: 'Export Transactions', type: 'link' },
            { id: 'clear_data', icon: 'trash', label: 'Clear All Data', type: 'link' },
        ]
    },
    {
        title: 'Support',
        items: [
            { id: 'help', icon: 'help-circle', label: 'Help Center', type: 'link' },
            { id: 'rate', icon: 'star', label: 'Rate the App', type: 'link' },
            { id: 'about', icon: 'info', label: 'About PitakaPal', type: 'link' },
        ]
    }
];

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { signOut } = useAuth();
    const { user } = useUser();
    const { theme, colors, toggleTheme } = useAppTheme();
    const { transactions } = useTransactions();
    const { accounts } = useAccounts();

    const [toggles, setToggles] = useState({
        notifications: true,
        face_id: false
    });

    const [securityModalVisible, setSecurityModalVisible] = useState(false);
    const [aboutModalVisible, setAboutModalVisible] = useState(false);

    // Load saved preferences on mount
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const savedNotif = await SecureStore.getItemAsync('pref-notifications');
                const savedFaceId = await SecureStore.getItemAsync('pref-face-id');
                setToggles({
                    notifications: savedNotif !== 'false', // default true
                    face_id: savedFaceId === 'true',
                });
            } catch (e) {
                console.log('Failed to load preferences', e);
            }
        };
        loadPreferences();
    }, []);

    const getSwitchValue = (id: string) => {
        if (id === 'theme') return theme === 'dark';
        return toggles[id as keyof typeof toggles] ?? false;
    };

    const handleToggle = async (key: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (key === 'theme') {
            await toggleTheme();
            return;
        }

        const newValue = !toggles[key as keyof typeof toggles];

        if (key === 'face_id' && newValue) {
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
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to enable Face ID',
            });
            if (!result.success) {
                Alert.alert('Failed', 'Authentication failed.');
                return;
            }
        }

        setToggles(prev => ({ ...prev, [key]: newValue }));

        // Persist preference
        try {
            if (key === 'notifications') {
                await SecureStore.setItemAsync('pref-notifications', String(newValue));
            } else if (key === 'face_id') {
                await SecureStore.setItemAsync('pref-face-id', String(newValue));
            }
        } catch (e) {
            console.error('Failed to save preference:', e);
        }
    };

    const handleExportData = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (transactions.length === 0) {
            Alert.alert('No Data', 'You have no transactions to export.');
            return;
        }

        // Build CSV content
        const header = 'Date,Type,Category,Account,Amount,Note,Location';
        const rows = transactions.map(tx => {
            const date = new Date(tx.date).toLocaleDateString();
            const note = (tx.note || '').replace(/,/g, ';');
            const location = (tx.locationName || '').replace(/,/g, ';');
            return `${date},${tx.type},${tx.category},${tx.account},${tx.amount},${note},${location}`;
        });
        const csv = [header, ...rows].join('\n');

        try {
            await Share.share({
                message: csv,
                title: 'PitakaPal Transactions Export',
            });
        } catch (err) {
            console.error('Export error:', err);
        }
    };

    const handleClearData = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(
            'Clear All Data',
            'This will delete all your accounts and transactions from this device. This action cannot be undone. Your cloud data may still be recoverable from Supabase.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Everything',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await SecureStore.deleteItemAsync('pref-notifications');
                            await SecureStore.deleteItemAsync('pref-face-id');
                            await SecureStore.deleteItemAsync('user-theme');
                            Alert.alert('Done', 'Local preferences have been cleared. Log out and log back in to refresh your account data.');
                        } catch (e) {
                            console.error('Clear data error:', e);
                        }
                    }
                }
            ]
        );
    };

    const handlePressItem = (item: any) => {
        if (item.type === 'switch') {
            handleToggle(item.id);
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        switch (item.id) {
            case 'profile':
                router.push('/profile');
                break;
            case 'security':
                setSecurityModalVisible(true);
                break;
            case 'export':
                handleExportData();
                break;
            case 'clear_data':
                handleClearData();
                break;
            case 'help':
                Alert.alert(
                    'Help Center',
                    'Need help? Here are some options:',
                    [
                        { text: 'Email Support', onPress: () => Linking.openURL('mailto:support@pitakapal.app?subject=Help%20Request') },
                        { text: 'FAQ', onPress: () => Alert.alert('FAQ', '• How to add a transaction?\nGo to the + tab and fill in the details.\n\n• How to add an account?\nGo to Wallet tab and tap "Add Account".\n\n• How to change theme?\nToggle Dark Mode in Settings.\n\n• Is my data secure?\nYes! Data is stored securely with Supabase and authentication is handled by Clerk.') },
                        { text: 'Close', style: 'cancel' }
                    ]
                );
                break;
            case 'rate':
                Alert.alert(
                    'Rate PitakaPal',
                    'Enjoying PitakaPal? Your feedback helps us improve!',
                    [
                        { text: 'Not Now', style: 'cancel' },
                        { text: 'Rate ⭐⭐⭐⭐⭐', onPress: () => Alert.alert('Thank You!', 'We appreciate your support! 🎉') }
                    ]
                );
                break;
            case 'about':
                setAboutModalVisible(true);
                break;
            default:
                break;
        }
    };

    const handleLogout = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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

    // Stats for About modal
    const totalAccounts = accounts.length;
    const totalTransactions = transactions.length;
    const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    return (
        <YStack flex={1} paddingTop={insets.top} backgroundColor={colors.background}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <Animated.View entering={FadeInDown.delay(100)}>
                    <YStack paddingHorizontal={24} marginVertical={24}>
                        <XStack
                            alignItems="center" padding={20}
                            borderRadius={20} borderWidth={1}
                            backgroundColor={colors.card} borderColor={colors.border}
                        >
                            <YStack
                                width={60} height={60} borderRadius={30}
                                alignItems="center" justifyContent="center"
                                marginRight={16} overflow="hidden"
                                backgroundColor={colors.background}
                            >
                                {user?.imageUrl ? (
                                    <Image source={{ uri: user.imageUrl }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                                ) : (
                                    <Feather name="user" size={30} color={colors.text} />
                                )}
                            </YStack>
                            <YStack flex={1}>
                                <Text fontSize={18} fontWeight="700" marginBottom={4} color={colors.text}>
                                    {user?.fullName || user?.firstName || 'User'}
                                </Text>
                                <Text fontSize={14} color={colors.textSecondary}>
                                    {user?.primaryEmailAddress?.emailAddress || 'No email'}
                                </Text>
                            </YStack>
                            <YStack
                                width={36} height={36} borderRadius={18}
                                alignItems="center" justifyContent="center"
                                backgroundColor={colors.border}
                                pressStyle={{ opacity: 0.7 }}
                                onPress={() => router.push('/profile')}
                            >
                                <Feather name="edit-2" size={16} color={colors.text} />
                            </YStack>
                        </XStack>
                    </YStack>
                </Animated.View>

                {/* Settings Sections */}
                {SECTIONS.map((section, index) => (
                    <Animated.View key={section.title} entering={FadeInDown.delay(200 + index * 100)}>
                        <YStack marginBottom={24} paddingHorizontal={24}>
                            <Text
                                fontSize={14} fontWeight="600" marginBottom={12}
                                textTransform="uppercase" letterSpacing={1}
                                color={colors.textSecondary}
                            >
                                {section.title}
                            </Text>
                            <YStack borderRadius={16} overflow="hidden" backgroundColor={colors.card}>
                                {section.items.map((item, i) => {
                                    const isActive = item.type === 'switch' && getSwitchValue(item.id);
                                    const isDanger = item.id === 'clear_data';
                                    return (
                                        <XStack
                                            key={item.id}
                                            alignItems="center" padding={16}
                                            borderBottomWidth={i !== section.items.length - 1 ? 1 : 0}
                                            borderBottomColor={colors.border}
                                            pressStyle={item.type !== 'switch' ? { opacity: 0.7 } : undefined}
                                            onPress={() => handlePressItem(item)}
                                        >
                                            <YStack
                                                width={36} height={36} borderRadius={10}
                                                alignItems="center" justifyContent="center"
                                                marginRight={16}
                                                backgroundColor={isDanger ? colors.dangerBg : isActive ? colors.activeToggle + '20' : colors.border}
                                            >
                                                <Feather
                                                    name={item.icon as any}
                                                    size={20}
                                                    color={isDanger ? colors.danger : isActive ? colors.activeToggle : colors.text}
                                                />
                                            </YStack>
                                            <Text flex={1} fontSize={16} fontWeight="500" color={isDanger ? colors.danger : colors.text}>
                                                {item.label}
                                            </Text>

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
                                        </XStack>
                                    );
                                })}
                            </YStack>
                        </YStack>
                    </Animated.View>
                ))}

                {/* Log Out Button */}
                <Animated.View entering={FadeInDown.delay(700)}>
                    <YStack paddingHorizontal={24} marginTop={20} alignItems="center">
                        <XStack
                            alignItems="center"
                            paddingHorizontal={32} paddingVertical={16}
                            borderRadius={16} marginBottom={24}
                            borderWidth={1}
                            backgroundColor={colors.dangerBg} borderColor={colors.dangerBorder}
                            pressStyle={{ opacity: 0.7 }}
                            onPress={handleLogout}
                        >
                            <Feather name="log-out" size={20} color={colors.danger} style={{ marginRight: 8 }} />
                            <Text fontWeight="700" fontSize={16} color={colors.danger}>Log Out</Text>
                        </XStack>
                        <Text fontSize={12} color={colors.textSecondary}>Version 1.0.0 (Build 124)</Text>
                    </YStack>
                </Animated.View>

            </ScrollView>

            {/* Security & Privacy Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={securityModalVisible}
                onRequestClose={() => setSecurityModalVisible(false)}
            >
                <YStack flex={1} backgroundColor="rgba(0,0,0,0.6)" justifyContent="flex-end">
                    <YStack
                        backgroundColor={colors.background}
                        borderTopLeftRadius={24}
                        borderTopRightRadius={24}
                        padding={24}
                        paddingBottom={48}
                        borderTopWidth={1}
                        borderTopColor={colors.border}
                    >
                        <XStack justifyContent="space-between" alignItems="center" marginBottom={24}>
                            <Text fontSize={20} fontWeight="700" color={colors.text}>Security & Privacy</Text>
                            <YStack pressStyle={{ opacity: 0.7 }} onPress={() => setSecurityModalVisible(false)}>
                                <Feather name="x" size={24} color={colors.text} />
                            </YStack>
                        </XStack>

                        <YStack gap={4}>
                            {/* Change Password */}
                            <XStack
                                alignItems="center" gap={16} padding={16}
                                borderRadius={16} backgroundColor={colors.card}
                                pressStyle={{ backgroundColor: colors.border }}
                                onPress={() => {
                                    setSecurityModalVisible(false);
                                    Alert.alert(
                                        'Change Password',
                                        'To change your password, we\'ll send a password reset link to your email.',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Send Reset Link',
                                                onPress: () => {
                                                    Alert.alert('Email Sent', 'Check your inbox for the password reset link.');
                                                }
                                            }
                                        ]
                                    );
                                }}
                            >
                                <YStack width={40} height={40} borderRadius={12} alignItems="center" justifyContent="center" backgroundColor={colors.border}>
                                    <Feather name="key" size={20} color={colors.text} />
                                </YStack>
                                <YStack flex={1}>
                                    <Text fontSize={16} fontWeight="600" color={colors.text}>Change Password</Text>
                                    <Text fontSize={13} color={colors.textSecondary}>Update your account password</Text>
                                </YStack>
                                <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                            </XStack>

                            {/* Biometric Lock */}
                            <XStack
                                alignItems="center" gap={16} padding={16}
                                borderRadius={16} backgroundColor={colors.card}
                            >
                                <YStack width={40} height={40} borderRadius={12} alignItems="center" justifyContent="center" backgroundColor={toggles.face_id ? colors.activeToggle + '20' : colors.border}>
                                    <Feather name="smartphone" size={20} color={toggles.face_id ? colors.activeToggle : colors.text} />
                                </YStack>
                                <YStack flex={1}>
                                    <Text fontSize={16} fontWeight="600" color={colors.text}>Biometric Lock</Text>
                                    <Text fontSize={13} color={colors.textSecondary}>{toggles.face_id ? 'Enabled' : 'Disabled'} • Fingerprint or Face ID</Text>
                                </YStack>
                                <Switch
                                    value={toggles.face_id}
                                    onValueChange={() => handleToggle('face_id')}
                                    trackColor={{ false: colors.inactiveToggle, true: colors.activeToggle }}
                                    thumbColor={'#FFF'}
                                />
                            </XStack>

                            {/* Active Sessions */}
                            <XStack
                                alignItems="center" gap={16} padding={16}
                                borderRadius={16} backgroundColor={colors.card}
                                pressStyle={{ backgroundColor: colors.border }}
                                onPress={() => {
                                    setSecurityModalVisible(false);
                                    Alert.alert(
                                        'Active Sessions',
                                        'You are currently logged in on this device.\n\nTo log out of all sessions, use the Log Out button in Settings.',
                                        [{ text: 'OK' }]
                                    );
                                }}
                            >
                                <YStack width={40} height={40} borderRadius={12} alignItems="center" justifyContent="center" backgroundColor={colors.border}>
                                    <Feather name="monitor" size={20} color={colors.text} />
                                </YStack>
                                <YStack flex={1}>
                                    <Text fontSize={16} fontWeight="600" color={colors.text}>Active Sessions</Text>
                                    <Text fontSize={13} color={colors.textSecondary}>Manage your logged-in devices</Text>
                                </YStack>
                                <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                            </XStack>

                            {/* Delete Account */}
                            <XStack
                                alignItems="center" gap={16} padding={16}
                                borderRadius={16} backgroundColor={colors.card}
                                pressStyle={{ backgroundColor: colors.dangerBg }}
                                onPress={() => {
                                    setSecurityModalVisible(false);
                                    Alert.alert(
                                        'Delete Account',
                                        'This will permanently delete your account, all your data, transactions, and wallet information. This action cannot be undone.',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Delete My Account',
                                                style: 'destructive',
                                                onPress: () => {
                                                    Alert.alert(
                                                        'Are you absolutely sure?',
                                                        'Type your email to confirm deletion. This is irreversible.',
                                                        [
                                                            { text: 'Cancel', style: 'cancel' },
                                                            {
                                                                text: 'Yes, Delete',
                                                                style: 'destructive',
                                                                onPress: async () => {
                                                                    try {
                                                                        await user?.delete();
                                                                        await signOut();
                                                                        router.replace('/login');
                                                                    } catch (e: any) {
                                                                        Alert.alert('Error', e?.errors?.[0]?.message || 'Could not delete account. Contact support.');
                                                                    }
                                                                }
                                                            }
                                                        ]
                                                    );
                                                }
                                            }
                                        ]
                                    );
                                }}
                            >
                                <YStack width={40} height={40} borderRadius={12} alignItems="center" justifyContent="center" backgroundColor={colors.dangerBg}>
                                    <Feather name="user-x" size={20} color={colors.danger} />
                                </YStack>
                                <YStack flex={1}>
                                    <Text fontSize={16} fontWeight="600" color={colors.danger}>Delete Account</Text>
                                    <Text fontSize={13} color={colors.textSecondary}>Permanently remove your account</Text>
                                </YStack>
                                <Feather name="chevron-right" size={20} color={colors.danger} />
                            </XStack>
                        </YStack>
                    </YStack>
                </YStack>
            </Modal>

            {/* About Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={aboutModalVisible}
                onRequestClose={() => setAboutModalVisible(false)}
            >
                <YStack flex={1} backgroundColor="rgba(0,0,0,0.7)" justifyContent="center" alignItems="center" padding={24}>
                    <YStack
                        width="100%"
                        backgroundColor={colors.background}
                        borderRadius={24}
                        padding={28}
                        borderWidth={1}
                        borderColor={colors.border}
                        alignItems="center"
                    >
                        <YStack
                            width={72} height={72} borderRadius={20}
                            backgroundColor={colors.card}
                            alignItems="center" justifyContent="center"
                            marginBottom={16}
                            borderWidth={1}
                            borderColor={colors.border}
                        >
                            <Text fontSize={36}>💰</Text>
                        </YStack>

                        <Text fontSize={24} fontWeight="800" color={colors.text} marginBottom={4}>
                            PitakaPal
                        </Text>
                        <Text fontSize={14} color={colors.textSecondary} marginBottom={20}>
                            Version 1.0.0 • Build 124
                        </Text>

                        <YStack width="100%" gap={12} marginBottom={24}>
                            <XStack alignItems="center" justifyContent="space-between" padding={12} backgroundColor={colors.card} borderRadius={12}>
                                <Text fontSize={14} color={colors.textSecondary}>Accounts</Text>
                                <Text fontSize={14} fontWeight="700" color={colors.text}>{totalAccounts}</Text>
                            </XStack>
                            <XStack alignItems="center" justifyContent="space-between" padding={12} backgroundColor={colors.card} borderRadius={12}>
                                <Text fontSize={14} color={colors.textSecondary}>Transactions</Text>
                                <Text fontSize={14} fontWeight="700" color={colors.text}>{totalTransactions}</Text>
                            </XStack>
                            <XStack alignItems="center" justifyContent="space-between" padding={12} backgroundColor={colors.card} borderRadius={12}>
                                <Text fontSize={14} color={colors.textSecondary}>Total Balance</Text>
                                <Text fontSize={14} fontWeight="700" color={colors.activeToggle}>₱ {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                            </XStack>
                        </YStack>

                        <Text fontSize={12} color={colors.textSecondary} textAlign="center" lineHeight={18} marginBottom={20}>
                            PitakaPal is a student expense tracker{'\n'}
                            built to help students manage their budget,{'\n'}
                            track spending, and save smarter.
                        </Text>

                        <YStack
                            width="100%"
                            backgroundColor={colors.card}
                            borderRadius={16}
                            padding={16}
                            alignItems="center"
                            pressStyle={{ opacity: 0.8 }}
                            onPress={() => setAboutModalVisible(false)}
                        >
                            <Text fontSize={16} fontWeight="700" color={colors.text}>Close</Text>
                        </YStack>
                    </YStack>
                </YStack>
            </Modal>
        </YStack>
    );
}
