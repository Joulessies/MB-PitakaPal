import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input, Text, XStack, YStack } from 'tamagui';
import { useTransactions } from '../context/TransactionContext';
import { useAppTheme } from '../context/ThemeContext';

const FILTERS = ['All', 'Income', 'Expense'];

export default function TransactionsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useAppTheme();
    const { transactions, loading } = useTransactions();
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTransactions = transactions.filter(tx => {
        const matchesFilter =
            activeFilter === 'All' ? true :
                activeFilter === 'Income' ? tx.type === 'income' :
                    tx.type === 'expense';

        const matchesSearch = (tx.note || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tx.category || '').toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const getCategoryIcon = (category: string, type: 'income' | 'expense') => {
        if (type === 'income') return 'arrow-down-left';
        
        const map: Record<string, string> = {
            food: 'coffee', transport: 'truck', shopping: 'shopping-bag',
            bills: 'file-text', entertainment: 'film', health: 'heart',
            education: 'book', salary: 'briefcase', freelance: 'edit-3',
            business: 'trending-up', gift: 'gift', investment: 'bar-chart-2',
            allowance: 'users', refund: 'rotate-ccw', cash_in: 'download',
            send: 'send', qr: 'maximize', load: 'smartphone',
            transfer: 'briefcase', cards: 'credit-card',
        };
        return map[category] || 'shopping-bag';
    };

    const formatCurrency = (amount: number) => {
        return '₱ ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 50)}>
            <XStack
                alignItems="center"
                paddingVertical={16}
                borderBottomWidth={1}
                borderBottomColor={colors.border}
            >
                <YStack
                    width={44} height={44} borderRadius={22}
                    justifyContent="center" alignItems="center"
                    marginRight={16}
                    backgroundColor={item.type === 'income' ? 'rgba(76, 175, 80, 0.1)' : colors.section}
                >
                    <Feather
                        name={getCategoryIcon(item.category, item.type) as any}
                        size={20}
                        color={item.type === 'income' ? '#4CAF50' : colors.text}
                    />
                </YStack>
                <YStack flex={1}>
                    <Text fontSize={16} fontWeight="600" color={colors.text} marginBottom={4}>
                        {item.note || item.category || 'Transaction'}
                    </Text>
                    <Text fontSize={13} color={colors.textSecondary}>
                        {item.category} • {item.account}
                    </Text>
                </YStack>
                <YStack alignItems="flex-end">
                    <Text
                        fontSize={16} fontWeight="700" marginBottom={4}
                        color={item.type === 'income' ? '#4CAF50' : colors.text}
                    >
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount).replace('₱ ', '')}
                    </Text>
                    <Text fontSize={12} color={colors.textSecondary}>
                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                </YStack>
            </XStack>
        </Animated.View>
    );

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
                <YStack padding={8} backgroundColor={colors.section} borderRadius={12}>
                    <Feather name="sliders" size={20} color={colors.text} />
                </YStack>
            </XStack>

            {/* Search */}
            <XStack
                marginHorizontal={20}
                marginBottom={16}
                alignItems="center"
                backgroundColor="#252525"
                borderRadius={16}
                paddingHorizontal={16}
                height={50}
            >
                <Feather name="search" size={20} color="rgba(255,255,255,0.4)" style={{ marginRight: 12 }} />
                <Input
                    unstyled
                    flex={1}
                    color="#FFF"
                    fontSize={16}
                    height="100%"
                    placeholder="Search transactions..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </XStack>

            {/* Filters */}
            <XStack paddingHorizontal={20} marginBottom={20} gap={12}>
                {FILTERS.map((filter) => (
                    <YStack
                        key={filter}
                        paddingHorizontal={20}
                        paddingVertical={10}
                        borderRadius={20}
                        backgroundColor={activeFilter === filter ? '#007DFE' : colors.section}
                        borderWidth={1}
                        borderColor={activeFilter === filter ? '#007DFE' : colors.border}
                        pressStyle={{ opacity: 0.7 }}
                        onPress={() => setActiveFilter(filter)}
                    >
                        <Text
                            color={activeFilter === filter ? '#FFF' : 'rgba(255,255,255,0.6)'}
                            fontWeight="600"
                            fontSize={14}
                        >
                            {filter}
                        </Text>
                    </YStack>
                ))}
            </XStack>

            {/* List */}
            <FlatList
                data={filteredTransactions}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <YStack alignItems="center" justifyContent="center" marginTop={100}>
                        <Feather name="inbox" size={48} color={colors.textSecondary} opacity={0.3} />
                        <Text color={colors.textSecondary} opacity={0.5} marginTop={16} fontSize={16}>
                            {loading ? 'Refreshing history...' : 'No transactions found'}
                        </Text>
                    </YStack>
                }
            />
        </YStack>
    );
}
