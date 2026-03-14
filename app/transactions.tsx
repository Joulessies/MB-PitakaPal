import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input, Text, XStack, YStack } from 'tamagui';

// Extended Mock Data
const ALL_TRANSACTIONS = [
    { id: '1', title: '7-Eleven Cash In', subtitle: 'GCash', amount: 5000, date: 'Today', type: 'in', category: 'Cash In' },
    { id: '2', title: 'Spotify Premium', subtitle: 'Maya', amount: -129, date: 'Today', type: 'out', category: 'Entertainment' },
    { id: '3', title: 'Jollibee Delivery', subtitle: 'GCash', amount: -650, date: 'Yesterday', type: 'out', category: 'Food' },
    { id: '4', title: 'Freelance Payment', subtitle: 'UnionBank', amount: 15000, date: 'Yesterday', type: 'in', category: 'Income' },
    { id: '5', title: 'Meralco Bill', subtitle: 'GoTyme', amount: -3200, date: 'Dec 12', type: 'out', category: 'Bills' },
    { id: '6', title: 'Netflix Subscription', subtitle: 'Maya', amount: -549, date: 'Dec 10', type: 'out', category: 'Entertainment' },
    { id: '7', title: 'Grocery Shopping', subtitle: 'GCash', amount: -4500, date: 'Dec 08', type: 'out', category: 'Food' },
    { id: '8', title: 'Load Purchase', subtitle: 'GCash', amount: -50, date: 'Dec 05', type: 'out', category: 'Load' },
];

const FILTERS = ['All', 'Income', 'Expense'];

export default function TransactionsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTransactions = ALL_TRANSACTIONS.filter(tx => {
        const matchesFilter =
            activeFilter === 'All' ? true :
                activeFilter === 'Income' ? tx.type === 'in' :
                    tx.type === 'out';

        const matchesSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.category.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const renderItem = ({ item, index }: { item: typeof ALL_TRANSACTIONS[0], index: number }) => (
        <Animated.View entering={FadeInUp.delay(index * 50)}>
            <XStack
                alignItems="center"
                paddingVertical={16}
                borderBottomWidth={1}
                borderBottomColor="rgba(255,255,255,0.05)"
            >
                <YStack
                    width={44} height={44} borderRadius={22}
                    justifyContent="center" alignItems="center"
                    marginRight={16}
                    backgroundColor={item.type === 'in' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)'}
                >
                    <Feather
                        name={item.type === 'in' ? 'arrow-down-left' : 'shopping-bag'}
                        size={20}
                        color={item.type === 'in' ? '#4CAF50' : '#FFF'}
                    />
                </YStack>
                <YStack flex={1}>
                    <Text fontSize={16} fontWeight="600" color="#FFF" marginBottom={4}>
                        {item.title}
                    </Text>
                    <Text fontSize={13} color="rgba(255,255,255,0.4)">
                        {item.category} • {item.subtitle}
                    </Text>
                </YStack>
                <YStack alignItems="flex-end">
                    <Text
                        fontSize={16} fontWeight="700" marginBottom={4}
                        color={item.type === 'in' ? '#4CAF50' : '#FFF'}
                    >
                        {item.type === 'in' ? '+' : ''}₱ {Math.abs(item.amount).toLocaleString()}
                    </Text>
                    <Text fontSize={12} color="rgba(255,255,255,0.3)">
                        {item.date}
                    </Text>
                </YStack>
            </XStack>
        </Animated.View>
    );

    return (
        <YStack flex={1} backgroundColor="#161616" paddingTop={insets.top}>

            {/* Header */}
            <XStack alignItems="center" justifyContent="space-between" paddingHorizontal={20} paddingVertical={16}>
                <YStack
                    padding={8}
                    backgroundColor="rgba(255,255,255,0.05)"
                    borderRadius={12}
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color="#FFF" />
                </YStack>
                <Text fontSize={18} fontWeight="700" color="#FFF">
                    Transactions
                </Text>
                <YStack padding={8} backgroundColor="rgba(255,255,255,0.05)" borderRadius={12}>
                    <Feather name="sliders" size={20} color="#FFF" />
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
                        backgroundColor={activeFilter === filter ? '#007DFE' : 'rgba(255,255,255,0.05)'}
                        borderWidth={1}
                        borderColor={activeFilter === filter ? '#007DFE' : 'rgba(255,255,255,0.05)'}
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
                        <Feather name="inbox" size={48} color="rgba(255,255,255,0.2)" />
                        <Text color="rgba(255,255,255,0.3)" marginTop={16} fontSize={16}>
                            No transactions found
                        </Text>
                    </YStack>
                }
            />
        </YStack>
    );
}
