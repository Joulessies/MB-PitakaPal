import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Link } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input, Text, XStack, YStack } from 'tamagui';
import TransactionSuccessModal, { SuccessModalData } from '../../components/TransactionSuccessModal';
import { useAccounts } from '../../context/AccountContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useTransactions } from '../../context/TransactionContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

const ALLOWED_BANKS = [
    { id: 'gcash_new', name: 'GCash', colors: ['#007DFE', '#0057B7'], icon: 'smartphone', theme: 'light' },
    { id: 'maya_new', name: 'Maya', colors: ['#000000', '#1E1E1E'], icon: 'credit-card', theme: 'dark' },
    { id: 'gotyme_new', name: 'GoTyme', colors: ['#E0E0E0', '#B0B0B0', '#E0E0E0'], icon: 'layers', theme: 'platinum' },
];

const SERVICES = [
    { id: 'cash_in', name: 'Cash In', icon: 'download' },
    { id: 'send', name: 'Send', icon: 'send' },
    { id: 'bills', name: 'Pay Bills', icon: 'file-text' },
    { id: 'load', name: 'Buy Load', icon: 'smartphone' },
    { id: 'transfer', name: 'Bank Transfer', icon: 'briefcase' },
    { id: 'qr', name: 'QR Pay', icon: 'maximize' },
    { id: 'cards', name: 'Cards', icon: 'credit-card' },
    { id: 'more', name: 'More', icon: 'grid' },
];

const NOTIFICATIONS: any[] = [];

export default function WalletScreen() {
    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const { transactions, addTransaction } = useTransactions();
    const { accounts, addAccount, updateAccountBalance, renameAccount, deleteAccount, loading } = useAccounts();

    const [activeAccountIndex, setActiveAccountIndex] = useState(0);
    const recentTransactions = transactions.slice(0, 5);
    const [addBankVisible, setAddBankVisible] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [notifModalVisible, setNotifModalVisible] = useState(false);
    const [txDetailsVisible, setTxDetailsVisible] = useState(false);
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [accSettingsVisible, setAccSettingsVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const [successData, setSuccessData] = useState<SuccessModalData | null>(null);
    const [activeAction, setActiveAction] = useState<any>(null);
    const [amountInput, setAmountInput] = useState('');
    const [recipientInput, setRecipientInput] = useState('');

    // Manage Account state
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [renameInput, setRenameInput] = useState('');
    const [changePinVisible, setChangePinVisible] = useState(false);
    const [pinStep, setPinStep] = useState<'current' | 'new' | 'confirm'>('new');
    const [currentPinInput, setCurrentPinInput] = useState('');
    const [newPinInput, setNewPinInput] = useState('');
    const [confirmPinInput, setConfirmPinInput] = useState('');
    const [hasExistingPin, setHasExistingPin] = useState(false);
    const [hiddenBalances, setHiddenBalances] = useState<Set<string>>(new Set());

    const formatCurrency = (amount: number) => {
        return '₱ ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const activeAccount = accounts[activeAccountIndex] || null;

    // Load hidden balances from SecureStore on mount
    useEffect(() => {
        const loadHiddenBalances = async () => {
            try {
                const stored = await SecureStore.getItemAsync('pitakapal_hidden_balances');
                if (stored) {
                    setHiddenBalances(new Set(JSON.parse(stored)));
                }
            } catch (e) {
                console.error('Failed to load hidden balances:', e);
            }
        };
        loadHiddenBalances();
    }, []);

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // ===== MANAGE ACCOUNT HANDLERS =====

    const handleRenameAccount = () => {
        if (!activeAccount) return;
        setRenameInput(activeAccount.name);
        setAccSettingsVisible(false);
        setRenameModalVisible(true);
    };

    const submitRename = async () => {
        if (!activeAccount) return;
        const trimmed = renameInput.trim();
        if (!trimmed) {
            Alert.alert('Invalid Name', 'Please enter a valid account name.');
            return;
        }
        if (trimmed === activeAccount.name) {
            setRenameModalVisible(false);
            return;
        }
        try {
            await renameAccount(activeAccount.id, trimmed);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setRenameModalVisible(false);
            Alert.alert('Success', `Account renamed to "${trimmed}".`);
        } catch {
            Alert.alert('Error', 'Failed to rename account. Please try again.');
        }
    };

    const handleChangePIN = useCallback(async () => {
        if (!activeAccount) return;
        const existingPin = await SecureStore.getItemAsync(`pitakapal_pin_${activeAccount.id}`);
        setHasExistingPin(!!existingPin);
        setPinStep(existingPin ? 'current' : 'new');
        setCurrentPinInput('');
        setNewPinInput('');
        setConfirmPinInput('');
        setAccSettingsVisible(false);
        setChangePinVisible(true);
    }, [activeAccount]);

    const submitPinStep = async () => {
        if (!activeAccount) return;

        if (pinStep === 'current') {
            const storedPin = await SecureStore.getItemAsync(`pitakapal_pin_${activeAccount.id}`);
            if (currentPinInput !== storedPin) {
                Alert.alert('Incorrect PIN', 'The current PIN you entered is incorrect.');
                setCurrentPinInput('');
                return;
            }
            setPinStep('new');
            return;
        }

        if (pinStep === 'new') {
            if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
                Alert.alert('Invalid PIN', 'Please enter a 4-digit PIN.');
                return;
            }
            setPinStep('confirm');
            return;
        }

        if (pinStep === 'confirm') {
            if (confirmPinInput !== newPinInput) {
                Alert.alert('PIN Mismatch', 'The PINs do not match. Please try again.');
                setConfirmPinInput('');
                return;
            }
            try {
                await SecureStore.setItemAsync(`pitakapal_pin_${activeAccount.id}`, newPinInput);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setChangePinVisible(false);
                Alert.alert('Success', 'Your PIN has been updated successfully.');
            } catch {
                Alert.alert('Error', 'Failed to save PIN. Please try again.');
            }
        }
    };

    const handleToggleHideBalance = async () => {
        if (!activeAccount) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setAccSettingsVisible(false);

        setHiddenBalances(prev => {
            const next = new Set(prev);
            if (next.has(activeAccount.id)) {
                next.delete(activeAccount.id);
            } else {
                next.add(activeAccount.id);
            }
            // Persist to SecureStore
            SecureStore.setItemAsync('pitakapal_hidden_balances', JSON.stringify([...next])).catch(console.error);
            return next;
        });
    };

    const handleDeleteAccount = () => {
        if (!activeAccount) return;
        setAccSettingsVisible(false);

        Alert.alert(
            'Delete Account',
            `Are you sure you want to delete "${activeAccount.name}"? This action cannot be undone and all associated data will be lost.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAccount(activeAccount.id);
                            // Clean up stored PIN
                            await SecureStore.deleteItemAsync(`pitakapal_pin_${activeAccount.id}`).catch(() => {});
                            // Clean up hidden balances
                            setHiddenBalances(prev => {
                                const next = new Set(prev);
                                next.delete(activeAccount.id);
                                SecureStore.setItemAsync('pitakapal_hidden_balances', JSON.stringify([...next])).catch(console.error);
                                return next;
                            });
                            // Adjust active index
                            setActiveAccountIndex(prev => Math.max(0, prev - 1));
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('Deleted', 'Account has been removed.');
                        } catch {
                            Alert.alert('Error', 'Failed to delete account. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const isBalanceHidden = (accountId: string) => hiddenBalances.has(accountId);

    const handleScroll = (event: any) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / (CARD_WIDTH + 16));
        if (index >= 0 && index < accounts.length) {
            setActiveAccountIndex(index);
        }
    };

    const handleAddAccount = async (bank: typeof ALLOWED_BANKS[0]) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await addAccount({
                name: bank.name,
                type: bank.name.toLowerCase(),
                balance: 0,
                icon: bank.icon,
                colors: bank.colors,
                number: '**** ' + Math.floor(1000 + Math.random() * 9000),
                theme: bank.theme
            });
            setAddBankVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', `${bank.name} account linked successfully!`);
        } catch {
            Alert.alert('Error', 'Failed to add account. Please try again.');
        }
    };

    const handleServicePress = (serviceId: string, serviceName: string) => {
        if (!activeAccount) {
            Alert.alert('No Account', 'Please add an account first.');
            return;
        }
        handlePress();
        setActiveAction({ id: serviceId, name: serviceName });
        setAmountInput('');
        setRecipientInput('');
        setActionModalVisible(true);
    };

    const executeTransaction = async () => {
        if (!activeAccount) return;

        const amount = parseFloat(amountInput);
        if (isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount.');
            return;
        }

        if (activeAction.id !== 'cash_in' && amount > activeAccount.balance) {
            Alert.alert('Insufficient Balance', 'You do not have enough funds for this transaction.');
            return;
        }

        let transactionType: 'income' | 'expense' = 'expense';
        if (activeAction.id === 'cash_in') {
            transactionType = 'income';
        }

        await addTransaction({
            id: Date.now().toString(),
            type: transactionType,
            amount: amount,
            category: activeAction.id,
            account: activeAccount.name,
            date: new Date(),
            note: activeAction.name + (recipientInput ? ` to ${recipientInput}` : ''),
            locationName: 'Wallet Action',
        });

        const newBalance = transactionType === 'income'
            ? activeAccount.balance + amount
            : activeAccount.balance - amount;

        await updateAccountBalance(activeAccount.id, newBalance);

        setActionModalVisible(false);
        
        // Show the success modal
        setSuccessData({
            type: transactionType,
            amount: amount,
            category: activeAction.id,
            accountName: activeAccount.name,
            newBalance: newBalance,
            note: recipientInput ? `to ${recipientInput}` : undefined,
            actionLabel: activeAction.name,
        });
        setSuccessVisible(true);
    };

    return (
        <YStack flex={1} paddingTop={insets.top} backgroundColor={colors.background}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <Animated.View entering={FadeInDown.duration(600)}>
                    <XStack paddingHorizontal={24} marginTop={16} marginBottom={24} justifyContent="space-between" alignItems="center">
                        <YStack>
                            <Text fontSize={14} marginBottom={4} color={colors.textSecondary}>Total Balance</Text>
                            <Text fontSize={32} fontWeight="800" letterSpacing={-0.5} color={colors.text}>
                                {hiddenBalances.size === accounts.length && accounts.length > 0
                                    ? '₱ ••••••'
                                    : formatCurrency(accounts.reduce((sum, acc) => hiddenBalances.has(acc.id) ? sum : sum + acc.balance, 0))}
                            </Text>
                        </YStack>
                        <YStack
                            width={44} height={44} borderRadius={22}
                            alignItems="center" justifyContent="center"
                            backgroundColor={colors.border}
                            position="relative"
                            pressStyle={{ opacity: 0.7 }}
                            onPress={() => { handlePress(); setNotifModalVisible(true); }}
                        >
                            <Feather name="bell" size={24} color={colors.text} />
                            <YStack
                                position="absolute" top={10} right={12}
                                width={8} height={8} borderRadius={4}
                                backgroundColor="#FF5252" borderWidth={1.5} borderColor={colors.background}
                            />
                        </YStack>
                    </XStack>
                </Animated.View>

                {/* Account Carousel */}
                <Animated.View entering={FadeInRight.duration(600).delay(200)}>
                    <YStack height={200} marginBottom={32}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 24 }}
                            snapToInterval={CARD_WIDTH + 16}
                            decelerationRate="fast"
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                        >
                            {loading && accounts.length === 0 ? (
                                <YStack width={CARD_WIDTH} height={190} justifyContent="center" alignItems="center">
                                    <Text color={colors.textSecondary}>Loading accounts...</Text>
                                </YStack>
                            ) : accounts.length === 0 ? (
                                <TouchableOpacity
                                    onPress={() => { handlePress(); setAddBankVisible(true); }}
                                    style={{
                                        backgroundColor: colors.section,
                                        borderColor: colors.border,
                                        width: CARD_WIDTH,
                                        height: 190,
                                        borderRadius: 24,
                                        borderWidth: 1,
                                        borderStyle: 'dashed',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Feather name="plus-circle" size={40} color={colors.textSecondary} style={{ marginBottom: 12 }} />
                                    <Text color={colors.textSecondary} fontSize={16}>Add your first account</Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    {accounts.map((acc, index) => (
                                        <TouchableOpacity key={acc.id} activeOpacity={0.9} onPress={() => { handlePress(); setActiveAccountIndex(index); }} style={{ width: CARD_WIDTH, marginRight: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 }}>
                                            <LinearGradient
                                                colors={acc.colors as any}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={{ height: 190, borderRadius: 24, padding: 24, justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}
                                            >
                                                <XStack justifyContent="space-between" alignItems="center">
                                                    <XStack alignItems="center" gap={8}>
                                                        <Feather name={acc.icon as any} size={20} color={acc.theme === 'platinum' ? '#333' : '#FFF'} />
                                                        <Text fontSize={18} fontWeight="700" letterSpacing={0.5} color={acc.theme === 'platinum' ? '#333' : '#FFF'}>
                                                            {acc.name}
                                                        </Text>
                                                    </XStack>
                                                    {(acc.name === 'Maya' || acc.name === 'GoTyme') && (
                                                        <YStack backgroundColor="rgba(255,255,255,0.2)" paddingHorizontal={8} paddingVertical={4} borderRadius={6}>
                                                            <Text fontSize={10} fontWeight="700" color="#FFF">SAVINGS</Text>
                                                        </YStack>
                                                    )}
                                                    {acc.type === 'cash' && (
                                                        <YStack backgroundColor="rgba(255,255,255,0.2)" paddingHorizontal={8} paddingVertical={4} borderRadius={6}>
                                                            <Text fontSize={10} fontWeight="700" color="#FFF">CASH</Text>
                                                        </YStack>
                                                    )}
                                                </XStack>

                                                <YStack marginTop={20} marginBottom={10}>
                                                    <Text fontSize={16} marginBottom={8} fontFamily="monospace" color={acc.theme === 'platinum' ? '#555' : 'rgba(255,255,255,0.8)'}>
                                                        {acc.number}
                                                    </Text>
                                                    <Text fontSize={28} fontWeight="700" color={acc.theme === 'platinum' ? '#000' : '#FFF'}>
                                                        {isBalanceHidden(acc.id) ? '₱ ••••••' : formatCurrency(acc.balance)}
                                                    </Text>
                                                </YStack>
                                                <XStack justifyContent="space-between" alignItems="center">
                                                    <Text fontSize={12} color={acc.theme === 'platinum' ? '#555' : 'rgba(255,255,255,0.6)'}>
                                                        Available Balance
                                                    </Text>
                                                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); handlePress(); setAccSettingsVisible(true); }}>
                                                        <Feather name="more-horizontal" size={20} color={acc.theme === 'platinum' ? '#333' : '#FFF'} />
                                                    </TouchableOpacity>
                                                </XStack>

                                                {acc.theme === 'platinum' && (
                                                    <LinearGradient
                                                        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
                                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                                        style={{ position: 'absolute', top: -50, left: -50, width: 300, height: 300, transform: [{ rotate: '45deg' }], opacity: 0.3 }}
                                                    />
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    ))}

                                    <TouchableOpacity onPress={() => { handlePress(); setAddBankVisible(true); }} style={{ backgroundColor: colors.section, borderColor: colors.border, marginRight: 20, width: 120, height: 190, borderRadius: 24, borderWidth: 1.5, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
                                        <YStack width={48} height={48} borderRadius={24} backgroundColor={colors.border} alignItems="center" justifyContent="center" marginBottom={12}>
                                            <Feather name="plus" size={24} color={colors.textSecondary} />
                                        </YStack>
                                        <Text color={colors.textSecondary} fontSize={13} fontWeight="600">
                                            Add Bank
                                        </Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </ScrollView>
                    </YStack>
                </Animated.View>

                {/* Services Grid */}
                <XStack flexWrap="wrap" paddingHorizontal={12} marginBottom={32}>
                    {SERVICES.map((service, index) => (
                        <Animated.View key={service.id} entering={FadeInDown.delay(300 + index * 50)} style={{ width: '25%', alignItems: 'center', marginBottom: 20 }}>
                            <YStack
                                alignItems="center" width="100%"
                                pressStyle={{ opacity: 0.7 }}
                                onPress={() => handleServicePress(service.id, service.name)}
                            >
                                <YStack
                                    width={50} height={50} borderRadius={20}
                                    alignItems="center" justifyContent="center"
                                    marginBottom={8} borderWidth={1}
                                    backgroundColor={colors.section} borderColor={colors.border}
                                >
                                    <Feather name={service.icon as any} size={22} color={colors.text} />
                                </YStack>
                                <Text fontSize={11} textAlign="center" fontWeight="500" color={colors.textSecondary}>
                                    {service.name}
                                </Text>
                            </YStack>
                        </Animated.View>
                    ))}
                </XStack>

                {/* Recent Transactions */}
                <YStack paddingHorizontal={24}>
                    <XStack justifyContent="space-between" alignItems="center" marginBottom={16}>
                        <Text fontSize={18} fontWeight="700" color={colors.text}>Recent Transactions</Text>
                        <Link href="/transactions" asChild>
                            <Text color="#007DFE" fontWeight="600" pressStyle={{ opacity: 0.7 }}>See All</Text>
                        </Link>
                    </XStack>

                    {recentTransactions.length === 0 ? (
                        <Text color={colors.textSecondary} marginBottom={20}>No transactions yet.</Text>
                    ) : (
                        recentTransactions.map((tx, index) => (
                            <Animated.View key={tx.id} entering={FadeInDown.delay(800 + index * 100)}>
                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => { handlePress(); setSelectedTx(tx); setTxDetailsVisible(true); }}
                                >
                                    <XStack alignItems="center" marginBottom={20} paddingVertical={4}>
                                    <YStack
                                        width={44} height={44} borderRadius={22}
                                        alignItems="center" justifyContent="center" marginRight={16}
                                        backgroundColor={tx.type === 'income' ? 'rgba(76, 175, 80, 0.1)' : colors.section}
                                    >
                                        <Feather name={tx.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'} size={20} color={tx.type === 'income' ? '#4CAF50' : colors.text} />
                                    </YStack>
                                    <YStack flex={1}>
                                        <Text fontSize={15} fontWeight="600" marginBottom={2} color={colors.text}>
                                            {tx.note || tx.category || 'Transaction'}
                                        </Text>
                                        <Text fontSize={12} color={colors.textSecondary}>
                                            {tx.account} • {new Date(tx.date).toLocaleDateString()}
                                        </Text>
                                    </YStack>
                                    <Text fontSize={15} fontWeight="700" color={tx.type === 'income' ? '#4CAF50' : colors.text}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount)).replace('₱ -', '₱ ')}
                                    </Text>
                                    </XStack>
                                </TouchableOpacity>
                            </Animated.View>
                        ))
                    )}
                </YStack>

            </ScrollView>

            {/* Action Modal (Cash In, Send, etc.) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={actionModalVisible}
                onRequestClose={() => setActionModalVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <YStack flex={1} backgroundColor="rgba(0,0,0,0.8)" justifyContent="flex-end">
                        <YStack
                            borderTopLeftRadius={24} borderTopRightRadius={24}
                            borderTopWidth={1}
                            backgroundColor={colors.background} borderTopColor={colors.border}
                            maxHeight="90%"
                        >
                            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                                <YStack padding={24} paddingBottom={Platform.OS === 'ios' ? 40 : 24}>
                                    <XStack justifyContent="space-between" alignItems="center" marginBottom={16}>
                                        <Text fontSize={24} fontWeight="800" color={colors.text}>{activeAction?.name}</Text>
                                        <YStack pressStyle={{ opacity: 0.7 }} onPress={() => setActionModalVisible(false)}>
                                            <Feather name="x" size={24} color={colors.text} />
                                        </YStack>
                                    </XStack>

                                    <Text fontSize={14} marginBottom={4} color={colors.textSecondary}>
                                        Using Account: <Text fontWeight="700" color={colors.text}>{activeAccount?.name}</Text>
                                    </Text>
                                    <Text fontSize={14} marginBottom={24} color={colors.textSecondary}>
                                        Available Balance: {activeAccount ? formatCurrency(activeAccount.balance) : 'N/A'}
                                    </Text>

                                    <XStack alignItems="center" borderBottomWidth={1} paddingBottom={8} marginBottom={24} borderBottomColor={colors.border}>
                                        <Text fontSize={32} fontWeight="700" marginRight={8} color={colors.text}>₱</Text>
                                        <Input
                                            unstyled
                                            flex={1}
                                            fontSize={48}
                                            fontWeight="700"
                                            color={colors.text as any}
                                            placeholder="0.00"
                                            placeholderTextColor={colors.textSecondary as any}
                                            keyboardType="numeric"
                                            value={amountInput}
                                            onChangeText={setAmountInput}
                                            autoFocus
                                        />
                                    </XStack>

                                    {activeAction?.id !== 'cash_in' && (
                                        <YStack marginBottom={32}>
                                            <Text fontSize={12} marginBottom={8} textTransform="uppercase" color={colors.textSecondary}>
                                                {activeAction?.id === 'bills' ? 'Biller Name' : activeAction?.id === 'load' ? 'Mobile Number' : 'Recipient'}
                                            </Text>
                                            <Input
                                                borderRadius={12}
                                                height={56}
                                                paddingHorizontal={16}
                                                paddingVertical={0}
                                                fontSize={16}
                                                backgroundColor={colors.section as any}
                                                color={colors.text as any}
                                                placeholder={activeAction?.id === 'load' ? '0917...' : "Enter details"}
                                                placeholderTextColor={colors.textSecondary}
                                                value={recipientInput}
                                                onChangeText={setRecipientInput}
                                            />
                                        </YStack>
                                    )}

                                    <YStack
                                        backgroundColor="#007DFE"
                                        borderRadius={16}
                                        height={60}
                                        alignItems="center"
                                        justifyContent="center"
                                        pressStyle={{ opacity: 0.8 }}
                                        onPress={executeTransaction}
                                        marginBottom={insets.bottom}
                                    >
                                        <Text color="#FFF" fontSize={18} fontWeight="700">
                                            Confirm {activeAction?.name || 'Action'}
                                        </Text>
                                    </YStack>
                                </YStack>
                            </ScrollView>
                        </YStack>
                    </YStack>
                </KeyboardAvoidingView>
            </Modal>

            {/* Add Bank Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={addBankVisible}
                onRequestClose={() => setAddBankVisible(false)}
            >
                <YStack flex={1} backgroundColor="rgba(0,0,0,0.8)" justifyContent="flex-end">
                    <YStack
                        borderTopLeftRadius={24} borderTopRightRadius={24}
                        padding={24} minHeight={450}
                        borderTopWidth={1}
                        backgroundColor={colors.background} borderTopColor={colors.border}
                    >
                        <XStack justifyContent="space-between" alignItems="center" marginBottom={16}>
                            <Text fontSize={24} fontWeight="800" color={colors.text}>Select Bank</Text>
                            <YStack pressStyle={{ opacity: 0.7 }} onPress={() => setAddBankVisible(false)}>
                                <Feather name="x" size={24} color={colors.text} />
                            </YStack>
                        </XStack>
                        <Text fontSize={14} marginBottom={24} color={colors.textSecondary}>Only trusted partners available</Text>

                        <YStack gap={16}>
                            {ALLOWED_BANKS.map((bank) => (
                                <XStack
                                    key={bank.id}
                                    alignItems="center" padding={16}
                                    borderRadius={16} borderWidth={1}
                                    backgroundColor={colors.card} borderColor={colors.border}
                                    pressStyle={{ opacity: 0.7 }}
                                    onPress={() => handleAddAccount(bank)}
                                >
                                    <LinearGradient
                                        colors={bank.colors as any}
                                        style={{ width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    >
                                        <Feather name={bank.icon as any} size={20} color={bank.theme === 'platinum' ? '#333' : '#FFF'} />
                                    </LinearGradient>
                                    <Text fontSize={16} fontWeight="600" flex={1} color={colors.text}>{bank.name}</Text>
                                    <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                                </XStack>
                            ))}
                        </YStack>
                    </YStack>
                </YStack>
            </Modal>

            {/* Notifications Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={notifModalVisible}
                onRequestClose={() => setNotifModalVisible(false)}
            >
                <YStack flex={1} backgroundColor="rgba(0,0,0,0.8)" justifyContent="flex-end">
                    <YStack
                        borderTopLeftRadius={24} borderTopRightRadius={24}
                        padding={24} minHeight={500}
                        backgroundColor={colors.background} borderTopColor={colors.border}
                        borderTopWidth={1}
                    >
                        <XStack justifyContent="space-between" alignItems="center" marginBottom={24}>
                            <Text fontSize={24} fontWeight="800" color={colors.text}>Notifications</Text>
                            <YStack pressStyle={{ opacity: 0.7 }} onPress={() => setNotifModalVisible(false)}>
                                <Feather name="x" size={24} color={colors.text} />
                            </YStack>
                        </XStack>

                        <YStack gap={16}>
                            {NOTIFICATIONS.map((notif) => (
                                <XStack key={notif.id} padding={16} borderRadius={20} backgroundColor={colors.card} borderWidth={1} borderColor={colors.border}>
                                    <YStack width={44} height={44} borderRadius={12} backgroundColor={`${notif.color}15`} alignItems="center" justifyContent="center" marginRight={16}>
                                        <Feather name={notif.icon as any} size={20} color={notif.color} />
                                    </YStack>
                                    <YStack flex={1}>
                                        <XStack justifyContent="space-between" alignItems="center" marginBottom={2}>
                                            <Text fontSize={15} fontWeight="700" color={colors.text}>{notif.title}</Text>
                                            <Text fontSize={11} color={colors.textSecondary}>{notif.time}</Text>
                                        </XStack>
                                        <Text fontSize={13} color={colors.textSecondary} lineHeight={18}>{notif.message}</Text>
                                    </YStack>
                                </XStack>
                            ))}
                        </YStack>

                        <YStack marginTop="auto" paddingTop={24}>
                            <YStack
                                backgroundColor={colors.border}
                                borderRadius={16}
                                padding={16}
                                alignItems="center"
                                pressStyle={{ opacity: 0.7 }}
                                onPress={() => setNotifModalVisible(false)}
                            >
                                <Text color={colors.text} fontWeight="600">Mark all as read</Text>
                            </YStack>
                        </YStack>
                    </YStack>
                </YStack>
            </Modal>

            {/* Transaction Details Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={txDetailsVisible}
                onRequestClose={() => setTxDetailsVisible(false)}
            >
                <YStack flex={1} backgroundColor="rgba(0,0,0,0.8)" justifyContent="center" alignItems="center" padding={24}>
                    <YStack
                        width="100%"
                        backgroundColor={colors.background}
                        borderRadius={24}
                        padding={24}
                        borderWidth={1}
                        borderColor={colors.border}
                    >
                        <XStack justifyContent="space-between" alignItems="center" marginBottom={24}>
                            <Text fontSize={20} fontWeight="700" color={colors.text}>Transaction Details</Text>
                            <TouchableOpacity onPress={() => setTxDetailsVisible(false)}>
                                <Feather name="x" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </XStack>

                        <YStack alignItems="center" marginBottom={32}>
                            <YStack
                                width={64} height={64} borderRadius={32}
                                backgroundColor={selectedTx?.type === 'income' ? 'rgba(76, 175, 80, 0.1)' : colors.section}
                                alignItems="center" justifyContent="center" marginBottom={16}
                            >
                                <Feather name={selectedTx?.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'} size={32} color={selectedTx?.type === 'income' ? '#4CAF50' : colors.text} />
                            </YStack>
                            <Text fontSize={28} fontWeight="800" color={selectedTx?.type === 'income' ? '#4CAF50' : colors.text}>
                                {selectedTx?.type === 'income' ? '+' : '-'}{formatCurrency(Number(selectedTx?.amount || 0))}
                            </Text>
                            <Text fontSize={14} color={colors.textSecondary} marginTop={4}>
                                {selectedTx?.category?.toUpperCase()}
                            </Text>
                        </YStack>

                        <YStack gap={16} marginBottom={24}>
                            <XStack justifyContent="space-between">
                                <Text color={colors.textSecondary}>Status</Text>
                                <Text color="#4CAF50" fontWeight="600">Completed</Text>
                            </XStack>
                            <XStack justifyContent="space-between">
                                <Text color={colors.textSecondary}>Date</Text>
                                <Text color={colors.text}>{selectedTx ? new Date(selectedTx.date).toLocaleString() : ''}</Text>
                            </XStack>
                            <XStack justifyContent="space-between">
                                <Text color={colors.textSecondary}>Account</Text>
                                <Text color={colors.text}>{selectedTx?.account}</Text>
                            </XStack>
                            <XStack justifyContent="space-between">
                                <Text color={colors.textSecondary}>Reference</Text>
                                <Text color={colors.text} fontFamily="monospace">TXN-{selectedTx?.id?.slice(-8).toUpperCase()}</Text>
                            </XStack>
                        </YStack>

                        <YStack
                            backgroundColor="#007DFE"
                            borderRadius={16}
                            padding={16}
                            alignItems="center"
                            pressStyle={{ opacity: 0.8 }}
                            onPress={() => setTxDetailsVisible(false)}
                        >
                            <Text color="#FFF" fontWeight="700">Share Receipt</Text>
                        </YStack>
                    </YStack>
                </YStack>
            </Modal>

            {/* Account Settings Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={accSettingsVisible}
                onRequestClose={() => setAccSettingsVisible(false)}
            >
                <YStack flex={1} backgroundColor="rgba(0,0,0,0.8)" justifyContent="flex-end">
                    <YStack
                        borderTopLeftRadius={24} borderTopRightRadius={24}
                        padding={24}
                        backgroundColor={colors.background} borderTopColor={colors.border}
                        borderTopWidth={1}
                    >
                        <XStack justifyContent="space-between" alignItems="center" marginBottom={24}>
                            <Text fontSize={20} fontWeight="700" color={colors.text}>Manage Account</Text>
                            <TouchableOpacity onPress={() => setAccSettingsVisible(false)}>
                                <Feather name="x" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </XStack>

                        <YStack gap={12} marginBottom={24}>
                            <XStack alignItems="center" gap={16} padding={16} borderRadius={16} backgroundColor={colors.card} pressStyle={{ backgroundColor: colors.border }} onPress={handleRenameAccount}>
                                <Feather name="edit" size={20} color={colors.text} />
                                <Text fontSize={16} color={colors.text}>Rename Account</Text>
                            </XStack>
                            <XStack alignItems="center" gap={16} padding={16} borderRadius={16} backgroundColor={colors.card} pressStyle={{ backgroundColor: colors.border }} onPress={handleChangePIN}>
                                <Feather name="lock" size={20} color={colors.text} />
                                <Text fontSize={16} color={colors.text}>Change PIN</Text>
                            </XStack>
                            <XStack alignItems="center" gap={16} padding={16} borderRadius={16} backgroundColor={colors.card} pressStyle={{ backgroundColor: colors.border }} onPress={handleToggleHideBalance}>
                                <Feather name={activeAccount && isBalanceHidden(activeAccount.id) ? 'eye' : 'eye-off'} size={20} color={colors.text} />
                                <Text fontSize={16} color={colors.text}>{activeAccount && isBalanceHidden(activeAccount.id) ? 'Show Balance' : 'Hide Balance'}</Text>
                            </XStack>
                            <XStack alignItems="center" gap={16} padding={16} borderRadius={16} backgroundColor={colors.card} pressStyle={{ backgroundColor: colors.danger }} onPress={handleDeleteAccount}>
                                <Feather name="trash-2" size={20} color={colors.danger} />
                                <Text fontSize={16} color={colors.danger}>Delete Account</Text>
                            </XStack>
                        </YStack>
                    </YStack>
                </YStack>
            </Modal>

            {/* Rename Account Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={renameModalVisible}
                onRequestClose={() => setRenameModalVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <YStack flex={1} backgroundColor="rgba(0,0,0,0.8)" justifyContent="center" alignItems="center" padding={24}>
                        <YStack
                            width="100%"
                            backgroundColor={colors.background}
                            borderRadius={24}
                            padding={24}
                            borderWidth={1}
                            borderColor={colors.border}
                        >
                            <XStack justifyContent="space-between" alignItems="center" marginBottom={24}>
                                <Text fontSize={20} fontWeight="700" color={colors.text}>Rename Account</Text>
                                <TouchableOpacity onPress={() => setRenameModalVisible(false)}>
                                    <Feather name="x" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </XStack>

                            <Text fontSize={14} marginBottom={8} color={colors.textSecondary}>Enter a new name for this account</Text>

                            <Input
                                borderRadius={12}
                                height={56}
                                paddingHorizontal={16}
                                paddingVertical={0}
                                fontSize={16}
                                backgroundColor={colors.section as any}
                                color={colors.text as any}
                                borderColor={colors.border as any}
                                borderWidth={1}
                                placeholder="Account name"
                                placeholderTextColor={colors.textSecondary}
                                value={renameInput}
                                onChangeText={setRenameInput}
                                autoFocus
                                marginBottom={24}
                            />

                            <XStack gap={12}>
                                <YStack
                                    flex={1}
                                    backgroundColor={colors.border}
                                    borderRadius={16}
                                    padding={16}
                                    alignItems="center"
                                    pressStyle={{ opacity: 0.7 }}
                                    onPress={() => setRenameModalVisible(false)}
                                >
                                    <Text color={colors.text} fontWeight="600">Cancel</Text>
                                </YStack>
                                <YStack
                                    flex={1}
                                    backgroundColor="#007DFE"
                                    borderRadius={16}
                                    padding={16}
                                    alignItems="center"
                                    pressStyle={{ opacity: 0.8 }}
                                    onPress={submitRename}
                                >
                                    <Text color="#FFF" fontWeight="700">Save</Text>
                                </YStack>
                            </XStack>
                        </YStack>
                    </YStack>
                </KeyboardAvoidingView>
            </Modal>

            {/* Change PIN Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={changePinVisible}
                onRequestClose={() => setChangePinVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <YStack flex={1} backgroundColor="rgba(0,0,0,0.8)" justifyContent="center" alignItems="center" padding={24}>
                        <YStack
                            width="100%"
                            backgroundColor={colors.background}
                            borderRadius={24}
                            padding={24}
                            borderWidth={1}
                            borderColor={colors.border}
                        >
                            <XStack justifyContent="space-between" alignItems="center" marginBottom={24}>
                                <Text fontSize={20} fontWeight="700" color={colors.text}>
                                    {hasExistingPin ? 'Change PIN' : 'Set PIN'}
                                </Text>
                                <TouchableOpacity onPress={() => setChangePinVisible(false)}>
                                    <Feather name="x" size={24} color={colors.text} />
                                </TouchableOpacity>
                            </XStack>

                            <YStack alignItems="center" marginBottom={24}>
                                <YStack
                                    width={64} height={64} borderRadius={32}
                                    backgroundColor={colors.section}
                                    alignItems="center" justifyContent="center" marginBottom={16}
                                >
                                    <Feather name="lock" size={28} color="#007DFE" />
                                </YStack>
                                <Text fontSize={14} color={colors.textSecondary} textAlign="center">
                                    {pinStep === 'current' && 'Enter your current 4-digit PIN'}
                                    {pinStep === 'new' && 'Enter a new 4-digit PIN'}
                                    {pinStep === 'confirm' && 'Confirm your new PIN'}
                                </Text>
                            </YStack>

                            <Input
                                borderRadius={12}
                                height={56}
                                paddingHorizontal={16}
                                paddingVertical={0}
                                fontSize={24}
                                fontWeight="700"
                                textAlign="center"
                                letterSpacing={12}
                                backgroundColor={colors.section as any}
                                color={colors.text as any}
                                borderColor={colors.border as any}
                                borderWidth={1}
                                placeholder="••••"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                                maxLength={4}
                                secureTextEntry
                                autoFocus
                                value={
                                    pinStep === 'current' ? currentPinInput :
                                    pinStep === 'new' ? newPinInput : confirmPinInput
                                }
                                onChangeText={
                                    pinStep === 'current' ? setCurrentPinInput :
                                    pinStep === 'new' ? setNewPinInput : setConfirmPinInput
                                }
                                marginBottom={8}
                            />

                            {/* Step indicator */}
                            <XStack justifyContent="center" gap={8} marginBottom={24}>
                                {hasExistingPin && (
                                    <YStack width={8} height={8} borderRadius={4} backgroundColor={pinStep === 'current' ? '#007DFE' : colors.border} />
                                )}
                                <YStack width={8} height={8} borderRadius={4} backgroundColor={pinStep === 'new' ? '#007DFE' : colors.border} />
                                <YStack width={8} height={8} borderRadius={4} backgroundColor={pinStep === 'confirm' ? '#007DFE' : colors.border} />
                            </XStack>

                            <XStack gap={12}>
                                <YStack
                                    flex={1}
                                    backgroundColor={colors.border}
                                    borderRadius={16}
                                    padding={16}
                                    alignItems="center"
                                    pressStyle={{ opacity: 0.7 }}
                                    onPress={() => setChangePinVisible(false)}
                                >
                                    <Text color={colors.text} fontWeight="600">Cancel</Text>
                                </YStack>
                                <YStack
                                    flex={1}
                                    backgroundColor="#007DFE"
                                    borderRadius={16}
                                    padding={16}
                                    alignItems="center"
                                    pressStyle={{ opacity: 0.8 }}
                                    onPress={submitPinStep}
                                >
                                    <Text color="#FFF" fontWeight="700">
                                        {pinStep === 'confirm' ? 'Save PIN' : 'Next'}
                                    </Text>
                                </YStack>
                            </XStack>
                        </YStack>
                    </YStack>
                </KeyboardAvoidingView>
            </Modal>

            <TransactionSuccessModal
                visible={successVisible}
                data={successData}
                onDone={() => {
                    setSuccessVisible(false);
                    setSuccessData(null);
                    setAmountInput('');
                    setRecipientInput('');
                }}
            />
        </YStack>
    );
}
