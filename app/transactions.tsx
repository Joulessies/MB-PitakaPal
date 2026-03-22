import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input, Text, XStack, YStack } from 'tamagui';
import { useAccounts } from '../context/AccountContext';
import { useAppTheme } from '../context/ThemeContext';
import { Transaction, useTransactions } from '../context/TransactionContext';

const FILTERS = ['All', 'Income', 'Expense'];

const SORT_OPTIONS = [
    { id: 'date_desc', label: 'Newest First', icon: 'arrow-down' },
    { id: 'date_asc', label: 'Oldest First', icon: 'arrow-up' },
    { id: 'amount_desc', label: 'Highest Amount', icon: 'trending-up' },
    { id: 'amount_asc', label: 'Lowest Amount', icon: 'trending-down' },
];

const getCategoryIcon = (category: string, type: 'income' | 'expense') => {
    if (type === 'income') return 'arrow-down-left';

    const map: Record<string, string> = {
        food: 'coffee', transport: 'truck', shopping: 'shopping-bag',
        bills: 'file-text', entertainment: 'film', health: 'heart',
        education: 'book', salary: 'briefcase', freelance: 'edit-3',
        business: 'trending-up', gift: 'gift', investment: 'bar-chart-2',
        allowance: 'users', refund: 'rotate-ccw', cash_in: 'download',
        send: 'send', qr: 'maximize', load: 'smartphone',
        transfer: 'briefcase', cards: 'credit-card', Savings: 'dollar-sign',
    };
    return map[category] || 'shopping-bag';
};

const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function TransactionsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useAppTheme();
    const { transactions, loading, deleteTransaction, refreshTransactions } = useTransactions();
    const { accounts, updateAccountBalance } = useAccounts();

    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');
    const [refreshing, setRefreshing] = useState(false);

    // Modals
    const [sortModalVisible, setSortModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    // Get unique categories from transactions for the summary
    const summary = useMemo(() => {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        return { income, expense, net: income - expense };
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        let result = transactions.filter(tx => {
            const matchesFilter =
                activeFilter === 'All' ? true :
                    activeFilter === 'Income' ? tx.type === 'income' :
                        tx.type === 'expense';

            const q = searchQuery.toLowerCase();
            const matchesSearch = !q ||
                (tx.note || '').toLowerCase().includes(q) ||
                (tx.category || '').toLowerCase().includes(q) ||
                (tx.account || '').toLowerCase().includes(q) ||
                (tx.locationName || '').toLowerCase().includes(q);

            return matchesFilter && matchesSearch;
        });

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'date_asc':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'amount_desc':
                    return b.amount - a.amount;
                case 'amount_asc':
                    return a.amount - b.amount;
                case 'date_desc':
                default:
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
        });

        return result;
    }, [transactions, activeFilter, searchQuery, sortBy]);

    const onRefresh = async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await refreshTransactions();
        setRefreshing(false);
    };

    const handleOpenDetail = (tx: Transaction) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedTx(tx);
        setDetailModalVisible(true);
    };

    const handleDeleteTransaction = (tx: Transaction) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(
            'Delete Transaction',
            `Are you sure you want to delete this ${tx.type === 'income' ? 'income' : 'expense'} of ₱${formatCurrency(tx.amount)}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Reverse the balance change on the account
                            const targetAcc = accounts.find(a => a.name === tx.account);
                            if (targetAcc) {
                                const restoredBalance = tx.type === 'income'
                                    ? targetAcc.balance - tx.amount
                                    : targetAcc.balance + tx.amount;
                                await updateAccountBalance(targetAcc.id, restoredBalance);
                            }

                            await deleteTransaction(tx.id);
                            setDetailModalVisible(false);
                            setSelectedTx(null);
                        } catch (err) {
                            console.error('Delete transaction error:', err);
                            Alert.alert('Error', 'Failed to delete the transaction.');
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item, index }: { item: Transaction, index: number }) => {
        const isIncome = item.type === 'income';
        return (
            <Animated.View entering={FadeInUp.delay(Math.min(index * 40, 400))}>
                <XStack
                    alignItems="center"
                    paddingVertical={14}
                    paddingHorizontal={4}
                    borderBottomWidth={1}
                    borderBottomColor={colors.border}
                    pressStyle={{ opacity: 0.7, backgroundColor: colors.card }}
                    borderRadius={12}
                    onPress={() => handleOpenDetail(item)}
                >
                    <YStack
                        width={44} height={44} borderRadius={22}
                        justifyContent="center" alignItems="center"
                        marginRight={14}
                        backgroundColor={isIncome ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 82, 82, 0.1)'}
                    >
                        <Feather
                            name={getCategoryIcon(item.category, item.type) as any}
                            size={20}
                            color={isIncome ? '#4CAF50' : '#FF5252'}
                        />
                    </YStack>
                    <YStack flex={1}>
                        <Text fontSize={15} fontWeight="600" color={colors.text} marginBottom={3} numberOfLines={1}>
                            {item.note || item.category || 'Transaction'}
                        </Text>
                        <Text fontSize={12} color={colors.textSecondary} numberOfLines={1}>
                            {item.category} • {item.account}
                        </Text>
                    </YStack>
                    <YStack alignItems="flex-end">
                        <Text
                            fontSize={15} fontWeight="700" marginBottom={3}
                            color={isIncome ? '#4CAF50' : '#FF5252'}
                        >
                            {isIncome ? '+' : '-'}₱{formatCurrency(item.amount)}
                        </Text>
                        <Text fontSize={11} color={colors.textSecondary}>
                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                    </YStack>
                </XStack>
            </Animated.View>
        );
    };

    return (
        <YStack flex={1} backgroundColor={colors.background} paddingTop={insets.top}>

            {/* Header */}
            <XStack alignItems="center" justifyContent="space-between" paddingHorizontal={20} paddingVertical={16}>
                <YStack
                    padding={8}
                    backgroundColor={colors.section}
                    borderRadius={12}
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color={colors.text} />
                </YStack>
                <Text fontSize={18} fontWeight="700" color={colors.text}>
                    Transactions
                </Text>
                <YStack
                    padding={8}
                    backgroundColor={colors.section}
                    borderRadius={12}
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSortModalVisible(true);
                    }}
                >
                    <Feather name="sliders" size={20} color={colors.text} />
                </YStack>
            </XStack>

            {/* Summary Cards */}
            <XStack paddingHorizontal={20} marginBottom={16} gap={10}>
                <YStack flex={1} backgroundColor={colors.card} borderRadius={14} padding={14} borderWidth={1} borderColor={colors.border}>
                    <Text fontSize={11} color={colors.textSecondary} marginBottom={4} textTransform="uppercase" letterSpacing={0.5}>Income</Text>
                    <Text fontSize={16} fontWeight="700" color="#4CAF50">+₱{formatCurrency(summary.income)}</Text>
                </YStack>
                <YStack flex={1} backgroundColor={colors.card} borderRadius={14} padding={14} borderWidth={1} borderColor={colors.border}>
                    <Text fontSize={11} color={colors.textSecondary} marginBottom={4} textTransform="uppercase" letterSpacing={0.5}>Expenses</Text>
                    <Text fontSize={16} fontWeight="700" color="#FF5252">-₱{formatCurrency(summary.expense)}</Text>
                </YStack>
            </XStack>

            {/* Search */}
            <XStack
                marginHorizontal={20}
                marginBottom={14}
                alignItems="center"
                backgroundColor={colors.card}
                borderRadius={14}
                paddingHorizontal={16}
                height={48}
                borderWidth={1}
                borderColor={colors.border}
            >
                <Feather name="search" size={18} color={colors.textSecondary} style={{ marginRight: 12 }} />
                <Input
                    unstyled
                    flex={1}
                    color={colors.text as any}
                    fontSize={15}
                    height="100%"
                    placeholder="Search transactions..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <YStack pressStyle={{ opacity: 0.7 }} onPress={() => setSearchQuery('')}>
                        <Feather name="x-circle" size={18} color={colors.textSecondary} />
                    </YStack>
                )}
            </XStack>

            {/* Filters */}
            <XStack paddingHorizontal={20} marginBottom={12} gap={10}>
                {FILTERS.map((filter) => {
                    const isActive = activeFilter === filter;
                    return (
                        <YStack
                            key={filter}
                            paddingHorizontal={20}
                            paddingVertical={9}
                            borderRadius={20}
                            backgroundColor={isActive ? '#007DFE' : colors.card}
                            borderWidth={1}
                            borderColor={isActive ? '#007DFE' : colors.border}
                            pressStyle={{ opacity: 0.7 }}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setActiveFilter(filter);
                            }}
                        >
                            <Text
                                color={isActive ? '#FFF' : colors.textSecondary}
                                fontWeight="600"
                                fontSize={13}
                            >
                                {filter}
                            </Text>
                        </YStack>
                    );
                })}
                <YStack flex={1} />
                <Text fontSize={12} color={colors.textSecondary} alignSelf="center">
                    {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}
                </Text>
            </XStack>

            {/* Transaction List */}
            <FlatList
                data={filteredTransactions}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.text}
                        colors={['#007DFE']}
                    />
                }
                ListEmptyComponent={
                    <YStack alignItems="center" justifyContent="center" marginTop={80}>
                        <YStack
                            width={72} height={72} borderRadius={36}
                            backgroundColor={colors.card} alignItems="center" justifyContent="center"
                            marginBottom={16} borderWidth={1} borderColor={colors.border}
                        >
                            <Feather name="inbox" size={32} color={colors.textSecondary} />
                        </YStack>
                        <Text color={colors.text} fontWeight="600" fontSize={16} marginBottom={6}>
                            {loading ? 'Loading...' : searchQuery ? 'No matches found' : 'No transactions yet'}
                        </Text>
                        <Text color={colors.textSecondary} fontSize={13} textAlign="center" lineHeight={20}>
                            {loading
                                ? 'Fetching your transaction history'
                                : searchQuery
                                    ? 'Try a different search term'
                                    : 'Your transactions will appear here\nonce you start adding them.'}
                        </Text>
                    </YStack>
                }
            />

            {/* Sort & Filter Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={sortModalVisible}
                onRequestClose={() => setSortModalVisible(false)}
            >
                <YStack flex={1} backgroundColor="rgba(0,0,0,0.6)" justifyContent="flex-end">
                    <YStack
                        backgroundColor={colors.background}
                        borderTopLeftRadius={24}
                        borderTopRightRadius={24}
                        padding={24}
                        paddingBottom={44}
                        borderTopWidth={1}
                        borderTopColor={colors.border}
                    >
                        <XStack justifyContent="space-between" alignItems="center" marginBottom={20}>
                            <Text fontSize={20} fontWeight="700" color={colors.text}>Sort & Filter</Text>
                            <YStack pressStyle={{ opacity: 0.7 }} onPress={() => setSortModalVisible(false)}>
                                <Feather name="x" size={24} color={colors.text} />
                            </YStack>
                        </XStack>

                        <Text fontSize={13} fontWeight="600" color={colors.textSecondary} marginBottom={12} textTransform="uppercase" letterSpacing={1}>
                            Sort By
                        </Text>
                        <YStack gap={6} marginBottom={24}>
                            {SORT_OPTIONS.map(opt => {
                                const isActive = sortBy === opt.id;
                                return (
                                    <XStack
                                        key={opt.id}
                                        alignItems="center" gap={14} padding={14}
                                        borderRadius={14} backgroundColor={isActive ? '#007DFE15' : colors.card}
                                        borderWidth={1} borderColor={isActive ? '#007DFE' : colors.border}
                                        pressStyle={{ opacity: 0.7 }}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSortBy(opt.id);
                                        }}
                                    >
                                        <YStack
                                            width={36} height={36} borderRadius={10}
                                            alignItems="center" justifyContent="center"
                                            backgroundColor={isActive ? '#007DFE20' : colors.border}
                                        >
                                            <Feather name={opt.icon as any} size={18} color={isActive ? '#007DFE' : colors.text} />
                                        </YStack>
                                        <Text flex={1} fontSize={15} fontWeight="500" color={colors.text}>{opt.label}</Text>
                                        {isActive && <Feather name="check" size={20} color="#007DFE" />}
                                    </XStack>
                                );
                            })}
                        </YStack>

                        <Text fontSize={13} fontWeight="600" color={colors.textSecondary} marginBottom={12} textTransform="uppercase" letterSpacing={1}>
                            Filter By Type
                        </Text>
                        <XStack gap={10} marginBottom={24}>
                            {FILTERS.map(f => {
                                const isActive = activeFilter === f;
                                return (
                                    <YStack
                                        key={f} flex={1}
                                        paddingVertical={12} borderRadius={14}
                                        backgroundColor={isActive ? '#007DFE' : colors.card}
                                        borderWidth={1} borderColor={isActive ? '#007DFE' : colors.border}
                                        alignItems="center"
                                        pressStyle={{ opacity: 0.7 }}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setActiveFilter(f);
                                        }}
                                    >
                                        <Text color={isActive ? '#FFF' : colors.text} fontWeight="600" fontSize={14}>{f}</Text>
                                    </YStack>
                                );
                            })}
                        </XStack>

                        <YStack
                            backgroundColor="#007DFE"
                            borderRadius={16}
                            padding={16}
                            alignItems="center"
                            pressStyle={{ opacity: 0.8 }}
                            onPress={() => setSortModalVisible(false)}
                        >
                            <Text color="#FFF" fontWeight="700" fontSize={16}>Apply</Text>
                        </YStack>
                    </YStack>
                </YStack>
            </Modal>

            {/* Transaction Detail Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={detailModalVisible}
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <YStack flex={1} backgroundColor="rgba(0,0,0,0.7)" justifyContent="center" alignItems="center" padding={24}>
                    {selectedTx && (
                        <YStack
                            width="100%"
                            backgroundColor={colors.background}
                            borderRadius={24}
                            padding={24}
                            borderWidth={1}
                            borderColor={colors.border}
                        >
                            {/* Header */}
                            <XStack justifyContent="space-between" alignItems="center" marginBottom={20}>
                                <Text fontSize={20} fontWeight="700" color={colors.text}>Transaction Details</Text>
                                <YStack pressStyle={{ opacity: 0.7 }} onPress={() => { setDetailModalVisible(false); setSelectedTx(null); }}>
                                    <Feather name="x" size={24} color={colors.text} />
                                </YStack>
                            </XStack>

                            {/* Amount & Type Badge */}
                            <YStack alignItems="center" marginBottom={24}>
                                <YStack
                                    width={64} height={64} borderRadius={32}
                                    alignItems="center" justifyContent="center"
                                    marginBottom={14}
                                    backgroundColor={selectedTx.type === 'income' ? 'rgba(76,175,80,0.1)' : 'rgba(255,82,82,0.1)'}
                                >
                                    <Feather
                                        name={getCategoryIcon(selectedTx.category, selectedTx.type) as any}
                                        size={28}
                                        color={selectedTx.type === 'income' ? '#4CAF50' : '#FF5252'}
                                    />
                                </YStack>
                                <Text
                                    fontSize={32} fontWeight="800"
                                    color={selectedTx.type === 'income' ? '#4CAF50' : '#FF5252'}
                                    marginBottom={6}
                                >
                                    {selectedTx.type === 'income' ? '+' : '-'}₱{formatCurrency(selectedTx.amount)}
                                </Text>
                                <YStack
                                    paddingHorizontal={14} paddingVertical={5} borderRadius={12}
                                    backgroundColor={selectedTx.type === 'income' ? 'rgba(76,175,80,0.15)' : 'rgba(255,82,82,0.15)'}
                                >
                                    <Text
                                        fontSize={12} fontWeight="700" textTransform="uppercase"
                                        color={selectedTx.type === 'income' ? '#4CAF50' : '#FF5252'}
                                    >
                                        {selectedTx.type}
                                    </Text>
                                </YStack>
                            </YStack>

                            {/* Details Grid */}
                            <YStack gap={1} borderRadius={16} overflow="hidden" marginBottom={20}>
                                <DetailRow icon="tag" label="Category" value={selectedTx.category} colors={colors} />
                                <DetailRow icon="credit-card" label="Account" value={selectedTx.account} colors={colors} />
                                <DetailRow
                                    icon="calendar" label="Date"
                                    value={new Date(selectedTx.date).toLocaleDateString('en-US', {
                                        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
                                    })}
                                    colors={colors}
                                />
                                {selectedTx.note ? (
                                    <DetailRow icon="file-text" label="Note" value={selectedTx.note} colors={colors} />
                                ) : null}
                                {selectedTx.locationName ? (
                                    <DetailRow icon="map-pin" label="Location" value={selectedTx.locationName} colors={colors} />
                                ) : null}
                                {selectedTx.lat && selectedTx.lng ? (
                                    <DetailRow icon="navigation" label="Coordinates" value={`${selectedTx.lat.toFixed(4)}, ${selectedTx.lng.toFixed(4)}`} colors={colors} />
                                ) : null}
                            </YStack>

                            {/* Delete Button */}
                            <XStack
                                alignItems="center" justifyContent="center" gap={8}
                                padding={14} borderRadius={14}
                                backgroundColor={colors.dangerBg}
                                borderWidth={1} borderColor={colors.dangerBorder}
                                pressStyle={{ opacity: 0.7 }}
                                onPress={() => handleDeleteTransaction(selectedTx)}
                            >
                                <Feather name="trash-2" size={18} color={colors.danger} />
                                <Text fontWeight="700" fontSize={15} color={colors.danger}>Delete Transaction</Text>
                            </XStack>
                        </YStack>
                    )}
                </YStack>
            </Modal>
        </YStack>
    );
}

// Reusable detail row component
function DetailRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
    return (
        <XStack alignItems="center" padding={14} backgroundColor={colors.card} gap={12}>
            <YStack width={32} height={32} borderRadius={8} alignItems="center" justifyContent="center" backgroundColor={colors.border}>
                <Feather name={icon as any} size={16} color={colors.textSecondary} />
            </YStack>
            <YStack flex={1}>
                <Text fontSize={11} color={colors.textSecondary} marginBottom={2}>{label}</Text>
                <Text fontSize={14} fontWeight="600" color={colors.text} numberOfLines={2}>{value}</Text>
            </YStack>
        </XStack>
    );
}
