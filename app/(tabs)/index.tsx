import { useUser } from '@clerk/clerk-expo';
import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccounts } from '../../context/AccountContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useTransactions } from '../../context/TransactionContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useAppTheme();
  const { user } = useUser();
  const { transactions, loading } = useTransactions();
  const { accounts } = useAccounts();

  // Calculate Total Balance from Accounts
  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  }, [accounts]);

  // Process transactions for the chart (Aggregate expenses by category)
  const chartData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals: Record<string, number> = {};

    expenses.forEach(t => {
      const cat = t.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
    });

    // Convert to array and sort by amount
    const data = Object.keys(categoryTotals).map(cat => ({
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: categoryTotals[cat]
    })).sort((a, b) => b.value - a.value).slice(0, 7); // Top 7 categories

    // Normalize for chart height (max bar height ~100)
    const maxVal = Math.max(...data.map(d => d.value), 100);

    return data.map(d => ({
      ...d,
      normalized: (d.value / maxVal) * 100
    }));

  }, [transactions]);

  const recentTransactions = transactions.slice(0, 5);

  const formatCurrency = (amount: number) => {
    return '₱ ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header Section - Animated Entry */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>Hello, <Text style={[styles.userName, { color: colors.text }]}>
              {user?.firstName || user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User'}!
            </Text></Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(new Date())}</Text>
          </View>
          <View style={[styles.profileImageContainer, { backgroundColor: colors.card, shadowColor: colors.text }]}>
            <Feather name="user" size={32} color={colors.text} />
          </View>
        </Animated.View>

        {/* Current Balance - Premium Card Effect */}
        <Animated.View entering={FadeInUp.delay(200).duration(600).springify()} style={styles.balanceContainer}>
          <LinearGradient
            colors={theme === 'dark' ? ['#2A2A2A', '#1A1A1A'] : ['#4CAF50', '#2E7D32']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.balanceCard, { borderColor: colors.border }]}
          >
            <View>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
            </View>
            <View style={styles.balanceIcon}>
              <Feather name="credit-card" size={24} color="rgba(255,255,255,0.4)" />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Expense Overview Chart Card */}
        {chartData.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400).duration(600).springify()} style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.chartHeader}>
              <View style={styles.chartIconContainer}>
                <Feather name="bar-chart-2" size={18} color="#000" />
              </View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Expense Breakdown</Text>
            </View>

            <View style={[styles.chartDivider, { backgroundColor: colors.border }]} />

            <View style={styles.chartContent}>
              {/* Chart Bars */}
              <View style={styles.chartBarsContainer}>
                {/* Grid Lines */}
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[styles.gridLine, { top: `${i * 33}%`, backgroundColor: colors.border }]} />
                ))}

                <View style={styles.barsRow}>
                  {chartData.map((item, index) => (
                    <View key={index} style={styles.barColumn}>
                      <View style={styles.barStack}>
                        <Animated.View
                          entering={FadeInUp.delay(500 + index * 50).springify()}
                          style={[styles.barSegment, {
                            height: `${Math.max(item.normalized, 5)}%`,
                            backgroundColor: index % 2 === 0 ? '#81C784' : '#FFCC80'
                          }]}
                        />
                      </View>
                      <Text style={[styles.xLabel, { color: colors.textSecondary }]} numberOfLines={1}>{item.label}</Text>
                      <Text style={[styles.valLabel, { color: colors.text }]} numberOfLines={1}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>

          {loading ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>Loading...</Text>
          ) : recentTransactions.length === 0 ? (
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>No transactions yet.</Text>
          ) : (
            recentTransactions.map((tx, index) => (
              <Animated.View key={tx.id} entering={FadeInDown.delay(800 + index * 100).springify()} style={[styles.transactionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.transactionIcon, { backgroundColor: colors.border }]}>
                  <Feather
                    name={tx.category === 'food' ? 'coffee' : tx.category === 'transport' ? 'truck' : 'grid' as any}
                    size={20}
                    color={colors.text}
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={[styles.transactionTitle, { color: colors.text }]}>{tx.category.toUpperCase()} - {tx.note || tx.account}</Text>
                  <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>{formatDate(tx.date)}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  { color: tx.type === 'income' ? colors.activeToggle : colors.danger }
                ]}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                </Text>
              </Animated.View>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Extra padding for bottom tabs
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 24,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 16,
    fontFamily: 'System',
  },
  userName: {
    fontWeight: '700',
    fontSize: 18,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },

  /* Balance */
  balanceContainer: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  balanceCard: {
    padding: 24,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  balanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Chart Card */
  chartCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#C1FF9B', // Green accent
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartDivider: {
    height: 1,
    width: '100%',
    marginBottom: 20,
  },
  chartContent: {
    flexDirection: 'row',
    height: 200,
  },
  chartBarsContainer: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingTop: 10,
    paddingLeft: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barStack: {
    width: 24,
    height: '80%',
    justifyContent: 'flex-end',
    position: 'relative',
    marginBottom: 8,
  },
  barSegment: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderRadius: 2,
  },
  xLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  valLabel: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: 'bold',
  },

  /* Transactions */
  transactionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
});