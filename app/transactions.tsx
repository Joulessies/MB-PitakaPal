import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
        <Animated.View entering={FadeInUp.delay(index * 50)} style={styles.transactionCard}>
            <View style={[styles.iconContainer, { backgroundColor: item.type === 'in' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 255, 255, 0.05)' }]}>
                <Feather
                    name={item.type === 'in' ? 'arrow-down-left' : 'shopping-bag'}
                    size={20}
                    color={item.type === 'in' ? '#4CAF50' : '#FFF'}
                />
            </View>
            <View style={styles.detailsContainer}>
                <Text style={styles.txTitle}>{item.title}</Text>
                <Text style={styles.txSubtitle}>{item.category} • {item.subtitle}</Text>
            </View>
            <View style={styles.amountContainer}>
                <Text style={[styles.txAmount, { color: item.type === 'in' ? '#4CAF50' : '#FFF' }]}>
                    {item.type === 'in' ? '+' : ''}₱ {Math.abs(item.amount).toLocaleString()}
                </Text>
                <Text style={styles.txDate}>{item.date}</Text>
            </View>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transactions</Text>
                <TouchableOpacity style={styles.filterBtn}>
                    <Feather name="sliders" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Feather name="search" size={20} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search transactions..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Filters */}
            <View style={styles.filterRow}>
                {FILTERS.map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
                        onPress={() => setActiveFilter(filter)}
                    >
                        <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* List */}
            <FlatList
                data={filteredTransactions}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Feather name="inbox" size={48} color="rgba(255,255,255,0.2)" />
                        <Text style={styles.emptyText}>No transactions found</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#161616',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    filterBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12, // Consistent styling
    },

    /* Search */
    searchContainer: {
        marginHorizontal: 20,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#252525',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        height: '100%',
    },

    /* Filters */
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    activeFilterChip: {
        backgroundColor: '#007DFE',
        borderColor: '#007DFE',
    },
    filterText: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
        fontSize: 14,
    },
    activeFilterText: {
        color: '#FFF',
    },

    /* List */
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailsContainer: {
        flex: 1,
    },
    txTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 4,
    },
    txSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    txDate: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
    },

    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        marginTop: 16,
        fontSize: 16,
    },
});
