import { useUser } from '@clerk/clerk-expo';
import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, XStack, YStack } from 'tamagui';
import { useAccounts } from '../../context/AccountContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useTransactions } from '../../context/TransactionContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, theme } = useAppTheme();
  const { user } = useUser();
  const { transactions, loading } = useTransactions();
  const { accounts } = useAccounts();

  const totalBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  }, [accounts]);

  const chartData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals: Record<string, number> = {};

    expenses.forEach(t => {
      const cat = t.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(t.amount);
    });

    const data = Object.keys(categoryTotals).map(cat => ({
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: categoryTotals[cat]
    })).sort((a, b) => b.value - a.value).slice(0, 7);

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
    <YStack flex={1} paddingTop={insets.top} backgroundColor={colors.background}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <Animated.View entering={FadeInDown.duration(600).springify()}>
          <XStack alignItems="center" justifyContent="space-between" marginTop={20} marginBottom={24}>
            <YStack flex={1}>
              <Text fontSize={16} color={colors.textSecondary}>
                Hello, <Text fontWeight="700" fontSize={18} color={colors.text}>
                  {user?.firstName || user?.fullName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'User'}!
                </Text>
              </Text>
              <Text fontSize={14} fontWeight="500" marginTop={4} color={colors.textSecondary}>
                {formatDate(new Date())}
              </Text>
            </YStack>
            <YStack
              width={50} height={50} borderRadius={25}
              alignItems="center" justifyContent="center"
              backgroundColor={colors.card}
              elevation={5}
            >
              <Feather name="user" size={32} color={colors.text} />
            </YStack>
          </XStack>
        </Animated.View>

        {/* Current Balance - Premium Card Effect */}
        <Animated.View entering={FadeInUp.delay(200).duration(600).springify()}>
          <YStack marginBottom={24} borderRadius={20} overflow="hidden" elevation={8}>
            <LinearGradient
              colors={theme === 'dark' ? ['#2A2A2A', '#1A1A1A'] : ['#4CAF50', '#2E7D32']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 24, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderWidth: 1, borderColor: colors.border }}
            >
              <YStack>
                <Text fontSize={14} color="rgba(255, 255, 255, 0.7)" marginBottom={8} textTransform="uppercase" letterSpacing={1}>
                  Current Balance
                </Text>
                <Text fontSize={36} fontWeight="800" color="#FFFFFF" letterSpacing={-1}>
                  {formatCurrency(totalBalance)}
                </Text>
              </YStack>
              <YStack
                width={40} height={40} borderRadius={20}
                backgroundColor="rgba(255,255,255,0.1)"
                alignItems="center" justifyContent="center"
              >
                <Feather name="credit-card" size={24} color="rgba(255,255,255,0.4)" />
              </YStack>
            </LinearGradient>
          </YStack>
        </Animated.View>

        {/* Expense Overview Chart Card */}
        {chartData.length > 0 && (
          <Animated.View entering={FadeInUp.delay(400).duration(600).springify()}>
            <YStack
              borderRadius={24} padding={20} marginBottom={24}
              borderWidth={1} backgroundColor={colors.card} borderColor={colors.border}
            >
              <XStack alignItems="center" marginBottom={16}>
                <YStack
                  width={32} height={32} borderRadius={12}
                  backgroundColor="#C1FF9B"
                  alignItems="center" justifyContent="center" marginRight={12}
                >
                  <Feather name="bar-chart-2" size={18} color="#000" />
                </YStack>
                <Text fontSize={16} fontWeight="700" color={colors.text}>
                  Expense Breakdown
                </Text>
              </XStack>

              <YStack height={1} width="100%" marginBottom={20} backgroundColor={colors.border} />

              <YStack height={200}>
                <YStack flex={1} height="100%" position="relative">
                  {/* Grid Lines */}
                  {[0, 1, 2, 3].map((i) => (
                    <YStack
                      key={i}
                      position="absolute"
                      left={0} right={0}
                      height={1}
                      top={`${i * 33}%` as any}
                      backgroundColor={colors.border}
                    />
                  ))}

                  <XStack justifyContent="space-between" alignItems="flex-end" height="100%" paddingTop={10} paddingLeft={10}>
                    {chartData.map((item, index) => (
                      <YStack key={index} flex={1} alignItems="center" height="100%" justifyContent="flex-end">
                        <YStack width={24} height="80%" justifyContent="flex-end" position="relative" marginBottom={8}>
                          <Animated.View
                            entering={FadeInUp.delay(500 + index * 50).springify()}
                            style={{
                              width: '100%',
                              height: `${Math.max(item.normalized, 5)}%`,
                              backgroundColor: index % 2 === 0 ? '#81C784' : '#FFCC80',
                              borderTopLeftRadius: 4,
                              borderTopRightRadius: 4,
                              borderRadius: 2,
                            }}
                          />
                        </YStack>
                        <Text fontSize={10} textAlign="center" marginTop={4} color={colors.textSecondary} numberOfLines={1}>
                          {item.label}
                        </Text>
                        <Text fontSize={8} textAlign="center" marginTop={2} fontWeight="bold" color={colors.text} numberOfLines={1}>
                          {item.value}
                        </Text>
                      </YStack>
                    ))}
                  </XStack>
                </YStack>
              </YStack>
            </YStack>
          </Animated.View>
        )}

        {/* Recent Transactions */}
        <YStack marginBottom={20}>
          <Text fontSize={18} fontWeight="700" marginBottom={16} letterSpacing={0.5} color={colors.text}>
            Recent Transactions
          </Text>

          {loading ? (
            <Text color={colors.textSecondary} textAlign="center" marginTop={20}>Loading...</Text>
          ) : recentTransactions.length === 0 ? (
            <Text color={colors.textSecondary} textAlign="center" marginTop={20}>No transactions yet.</Text>
          ) : (
            recentTransactions.map((tx, index) => (
              <Animated.View key={tx.id} entering={FadeInDown.delay(800 + index * 100).springify()}>
                <XStack
                  alignItems="center" borderRadius={16}
                  padding={16} marginBottom={12}
                  borderWidth={1} backgroundColor={colors.card} borderColor={colors.border}
                >
                  <YStack
                    width={44} height={44} borderRadius={22}
                    alignItems="center" justifyContent="center" marginRight={16}
                    backgroundColor={colors.border}
                  >
                    <Feather
                      name={tx.category === 'food' ? 'coffee' : tx.category === 'transport' ? 'truck' : 'grid' as any}
                      size={20}
                      color={colors.text}
                    />
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize={14} fontWeight="600" marginBottom={4} color={colors.text}>
                      {tx.category.toUpperCase()} - {tx.note || tx.account}
                    </Text>
                    <Text fontSize={12} color={colors.textSecondary}>
                      {formatDate(tx.date)}
                    </Text>
                  </YStack>
                  <Text
                    fontSize={15} fontWeight="700"
                    color={tx.type === 'income' ? colors.activeToggle : colors.danger}
                  >
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                  </Text>
                </XStack>
              </Animated.View>
            ))
          )}
        </YStack>

      </ScrollView>
    </YStack>
  );
}