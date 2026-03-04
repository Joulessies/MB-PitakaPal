import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export default function WalletScreen() {
    const insets = useSafeAreaInsets();
    const { colors, theme } = useAppTheme();
    const { transactions, balance: totalBalance, addTransaction } = useTransactions(); // balance here is global sum of tx
    const { accounts, addAccount, updateAccountBalance, loading } = useAccounts();

    // State
    const [activeAccountIndex, setActiveAccountIndex] = useState(0);

    // Filter recent transactions
    const recentTransactions = transactions.slice(0, 5);

    // Modals State
    const [addBankVisible, setAddBankVisible] = useState(false);
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [activeAction, setActiveAction] = useState<any>(null);

    // Form State
    const [amountInput, setAmountInput] = useState('');
    const [recipientInput, setRecipientInput] = useState('');

    const formatCurrency = (amount: number) => {
        return '₱ ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const activeAccount = accounts[activeAccountIndex] || null;

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

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
                number: '**** ' + Math.floor(1000 + Math.random() * 9000), // Random last 4 digits
                theme: bank.theme
            });
            setAddBankVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', `${bank.name} account linked successfully!`);
        } catch (e) {
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

        // Add to Database via Context
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

        // Update Account Balance in Database
        const newBalance = transactionType === 'income'
            ? activeAccount.balance + amount
            : activeAccount.balance - amount;

        await updateAccountBalance(activeAccount.id, newBalance);

        setActionModalVisible(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        setTimeout(() => {
            Alert.alert('Success', `Transaction successful!\nNew Balance: ${formatCurrency(newBalance)}`);
        }, 500);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
                    <View>
                        <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>Total Balance</Text>
                        {/* We could sum up account balances here, or use transaction total */}
                        <Text style={[styles.totalBalance, { color: colors.text }]}>
                            {formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0))}
                        </Text>
                    </View>
                    <TouchableOpacity style={[styles.profileBtn, { backgroundColor: colors.border }]} onPress={handlePress}>
                        <Feather name="bell" size={24} color={colors.text} />
                        <View style={[styles.notificationDot, { borderColor: colors.background }]} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Account Carousel */}
                <Animated.View entering={FadeInRight.duration(600).delay(200)} style={styles.carouselContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        snapToInterval={CARD_WIDTH + 16}
                        decelerationRate="fast"
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    >
                        {loading && accounts.length === 0 ? (
                            <View style={{ width: CARD_WIDTH, height: 190, justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: colors.textSecondary }}>Loading accounts...</Text>
                            </View>
                        ) : accounts.length === 0 ? (
                            <TouchableOpacity
                                onPress={() => { handlePress(); setAddBankVisible(true); }}
                                style={[styles.addAccountBtn, { backgroundColor: colors.section, borderColor: colors.border, width: CARD_WIDTH, height: 190 }]}
                            >
                                <Feather name="plus-circle" size={40} color={colors.textSecondary} style={{ marginBottom: 12 }} />
                                <Text style={[styles.addAccountText, { color: colors.textSecondary, transform: [{ rotate: '0deg' }], width: 'auto', fontSize: 16, marginTop: 0 }]}>Add your first account</Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                {accounts.map((acc, index) => (
                                    <TouchableOpacity key={acc.id} activeOpacity={0.9} onPress={() => { handlePress(); setActiveAccountIndex(index); }} style={[styles.cardWrapper, { marginRight: 16 }]}>
                                        <LinearGradient
                                            colors={acc.colors as any}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.card}
                                        >
                                            <View style={styles.cardTop}>
                                                <View style={styles.cardLogo}>
                                                    <Feather name={acc.icon as any} size={20} color={acc.theme === 'platinum' ? '#333' : '#FFF'} />
                                                    <Text style={[styles.cardName, { color: acc.theme === 'platinum' ? '#333' : '#FFF' }]}>{acc.name}</Text>
                                                </View>
                                                {(acc.name === 'Maya' || acc.name === 'GoTyme') && <View style={styles.accentTag}><Text style={styles.accentText}>SAVINGS</Text></View>}
                                                {acc.type === 'cash' && <View style={[styles.accentTag, { backgroundColor: 'rgba(255,255,255,0.2)' }]}><Text style={styles.accentText}>CASH</Text></View>}
                                            </View>

                                            <View style={styles.cardBody}>
                                                <Text style={[styles.cardNumber, { color: acc.theme === 'platinum' ? '#555' : 'rgba(255,255,255,0.8)' }]}>{acc.number}</Text>
                                                <Text style={[styles.cardBalance, { color: acc.theme === 'platinum' ? '#000' : '#FFF' }]}>{formatCurrency(acc.balance)}</Text>
                                            </View>

                                            <View style={styles.cardFooter}>
                                                <Text style={[styles.cardFooterText, { color: acc.theme === 'platinum' ? '#555' : 'rgba(255,255,255,0.6)' }]}>Available Balance</Text>
                                                <Feather name="more-horizontal" size={20} color={acc.theme === 'platinum' ? '#333' : '#FFF'} />
                                            </View>

                                            {/* Decorative Shine for GoTyme or Platinum themes */}
                                            {acc.theme === 'platinum' && (
                                                <LinearGradient
                                                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
                                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                                    style={styles.shine}
                                                />
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ))}

                                <TouchableOpacity onPress={() => { handlePress(); setAddBankVisible(true); }} style={[styles.addAccountBtn, { backgroundColor: colors.section, borderColor: colors.border, marginRight: 20 }]}>
                                    <Feather name="plus" size={32} color={colors.textSecondary} />
                                    <Text style={[styles.addAccountText, { color: colors.textSecondary }]}>Add Bank</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </Animated.View>

                {/* Services Grid */}
                <View style={styles.servicesGrid}>
                    {SERVICES.map((service, index) => (
                        <Animated.View key={service.id} entering={FadeInDown.delay(300 + index * 50)} style={styles.gridItemWrapper}>
                            <TouchableOpacity style={styles.gridItem} onPress={() => handleServicePress(service.id, service.name)}>
                                <View style={[styles.iconCircle, { backgroundColor: colors.section, borderColor: colors.border }]}>
                                    <Feather name={service.icon as any} size={22} color={colors.text} />
                                </View>
                                <Text style={[styles.serviceText, { color: colors.textSecondary }]}>{service.name}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>



                {/* Recent Transactions */}
                <View style={styles.transactionsSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Recent Transactions</Text>
                        <Link href="/transactions" asChild>
                            <TouchableOpacity>
                                <Text style={{ color: '#007DFE', fontWeight: '600' }}>See All</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {recentTransactions.length === 0 ? (
                        <Text style={{ color: colors.textSecondary, marginBottom: 20 }}>No transactions yet.</Text>
                    ) : (
                        recentTransactions.map((tx, index) => (
                            <Animated.View key={tx.id} entering={FadeInDown.delay(800 + index * 100)} style={styles.transactionRow}>
                                <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? 'rgba(76, 175, 80, 0.1)' : colors.section }]}>
                                    <Feather name={tx.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'} size={20} color={tx.type === 'income' ? '#4CAF50' : colors.text} />
                                </View>
                                <View style={styles.txContent}>
                                    <Text style={[styles.txTitle, { color: colors.text }]}>{tx.note || tx.category || 'Transaction'}</Text>
                                    <Text style={[styles.txSubtitle, { color: colors.textSecondary }]}>{tx.account} • {new Date(tx.date).toLocaleDateString()}</Text>
                                </View>
                                <Text style={[styles.txAmount, { color: tx.type === 'income' ? '#4CAF50' : colors.text }]}>
                                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount)).replace('₱ -', '₱ ')}
                                </Text>
                            </Animated.View>
                        ))
                    )}
                </View>

            </ScrollView>

            {/* Action Modal (Cash In, Send, etc.) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={actionModalVisible}
                onRequestClose={() => setActionModalVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{activeAction?.name}</Text>
                            <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                                <Feather name="x" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Using Account: <Text style={{ fontWeight: '700', color: colors.text }}>{activeAccount?.name}</Text></Text>
                        <Text style={[styles.modalSubLabel, { color: colors.textSecondary }]}>Available Balance: {activeAccount ? formatCurrency(activeAccount.balance) : 'N/A'}</Text>

                        <View style={[styles.inputContainer, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.currencySymbol, { color: colors.text }]}>₱</Text>
                            <TextInput
                                style={[styles.amountInput, { color: colors.text }]}
                                placeholder="0.00"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                                value={amountInput}
                                onChangeText={setAmountInput}
                                autoFocus
                            />
                        </View>

                        {activeAction?.id !== 'cash_in' && (
                            <View style={styles.recipientContainer}>
                                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{activeAction?.id === 'bills' ? 'Biller Name' : activeAction?.id === 'load' ? 'Mobile Number' : 'Recipient'}</Text>
                                <TextInput
                                    style={[styles.textInput, { backgroundColor: colors.section, color: colors.text }]}
                                    placeholder={activeAction?.id === 'load' ? '0917...' : "Enter details"}
                                    placeholderTextColor={colors.textSecondary}
                                    value={recipientInput}
                                    onChangeText={setRecipientInput}
                                />
                            </View>
                        )}

                        <TouchableOpacity style={styles.actionBtn} onPress={executeTransaction}>
                            <Text style={styles.actionBtnText}>Confirm {activeAction?.name}</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Add Bank Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={addBankVisible}
                onRequestClose={() => setAddBankVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Bank</Text>
                            <TouchableOpacity onPress={() => setAddBankVisible(false)}>
                                <Feather name="x" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Only trusted partners available</Text>

                        <View style={styles.bankList}>
                            {ALLOWED_BANKS.map((bank) => (
                                <TouchableOpacity key={bank.id} style={[styles.bankOption, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handleAddAccount(bank)}>
                                    <LinearGradient
                                        colors={bank.colors as any}
                                        style={styles.bankOptionIcon}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    >
                                        <Feather name={bank.icon as any} size={20} color={bank.theme === 'platinum' ? '#333' : '#FFF'} />
                                    </LinearGradient>
                                    <Text style={[styles.bankOptionText, { color: colors.text }]}>{bank.name}</Text>
                                    <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>

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

    /* Header */
    header: {
        paddingHorizontal: 24,
        marginTop: 16,
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    totalBalance: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    profileBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF5252',
        borderWidth: 1.5,
    },

    /* Carousel */
    carouselContainer: {
        height: 200,
        marginBottom: 32,
    },
    carouselContent: {
        paddingHorizontal: 24,
    },
    cardWrapper: {
        width: CARD_WIDTH,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    card: {
        height: 190,
        borderRadius: 24,
        padding: 24,
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardLogo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardName: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    accentTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    accentText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFF',
    },
    cardBody: {
        marginTop: 20,
        marginBottom: 10,
    },
    cardNumber: {
        fontSize: 16,
        marginBottom: 8,
        fontFamily: 'monospace',
    },
    cardBalance: {
        fontSize: 28,
        fontWeight: '700',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardFooterText: {
        fontSize: 12,
    },
    shine: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 300,
        height: 300,
        transform: [{ rotate: '45deg' }],
        opacity: 0.3,
    },

    /* Services Grid */
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 12,
        marginBottom: 32,
    },
    gridItemWrapper: {
        width: '25%',
        alignItems: 'center',
        marginBottom: 20,
    },
    gridItem: {
        alignItems: 'center',
        width: '100%',
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 1,
    },
    serviceText: {
        fontSize: 11,
        textAlign: 'center',
        fontWeight: '500',
    },

    /* Savings */
    savingsSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    savingsCard: {
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
    },
    savingsInfo: {
        gap: 4,
    },
    savingsLabel: {
        fontSize: 12,
    },
    savingsValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4CAF50',
    },
    savingsBadge: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    savingsBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4CAF50',
    },

    /* Transactions */
    transactionsSection: {
        paddingHorizontal: 24,
    },
    sectionHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    transactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 4,
    },
    txIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    txContent: {
        flex: 1,
    },
    txTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    txSubtitle: {
        fontSize: 12,
    },
    txAmount: {
        fontSize: 15,
        fontWeight: '700',
    },

    /* Add Account Button */
    addAccountBtn: {
        width: 60,
        height: 190,
        borderRadius: 24,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    addAccountText: {
        fontSize: 12,
        marginTop: 8,
        fontWeight: '600',
        transform: [{ rotate: '-90deg' }],
        width: 100,
        textAlign: 'center',
    },

    /* Modals */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 450,
        borderTopWidth: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    modalLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    modalSubLabel: {
        fontSize: 14,
        marginBottom: 24,
    },

    /* Bank List */
    bankList: {
        gap: 16,
    },
    bankOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    bankOptionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    bankOptionText: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },

    /* Action Modal Inputs */
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingBottom: 8,
        marginBottom: 24,
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '700',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 40,
        fontWeight: '700',
    },
    recipientContainer: {
        marginBottom: 32,
    },
    inputLabel: {
        fontSize: 12,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    textInput: {
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    actionBtn: {
        backgroundColor: '#007DFE',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
