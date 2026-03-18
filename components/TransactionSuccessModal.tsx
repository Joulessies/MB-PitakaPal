import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Modal, Platform, View } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { useAppTheme } from '../context/ThemeContext';

export interface SuccessModalData {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    accountName: string;
    newBalance: number;
    note?: string;
    actionLabel?: string;
}

interface Props {
    visible: boolean;
    data: SuccessModalData | null;
    onDone: () => void;
}

const formatCurrency = (amount: number) => {
    return '₱ ' + Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getCategoryIcon = (category: string): string => {
    const map: Record<string, string> = {
        food: 'coffee', transport: 'truck', shopping: 'shopping-bag',
        bills: 'file-text', entertainment: 'film', health: 'heart',
        education: 'book', salary: 'briefcase', freelance: 'edit-3',
        business: 'trending-up', gift: 'gift', investment: 'bar-chart-2',
        allowance: 'users', refund: 'rotate-ccw', cash_in: 'download',
        send: 'send', qr: 'maximize', load: 'smartphone',
        transfer: 'briefcase', cards: 'credit-card',
        other: 'grid', other_income: 'grid',
    };
    return map[category] || 'check';
};

const getCategoryLabel = (category: string): string => {
    const map: Record<string, string> = {
        food: 'Food', transport: 'Transport', shopping: 'Shopping',
        bills: 'Bills', entertainment: 'Fun', health: 'Health',
        education: 'School', salary: 'Salary', freelance: 'Freelance',
        business: 'Business', gift: 'Gift', investment: 'Investment',
        allowance: 'Allowance', refund: 'Refund', cash_in: 'Cash In',
        send: 'Send Money', qr: 'QR Pay', load: 'Buy Load',
        transfer: 'Bank Transfer', cards: 'Cards', other: 'Other',
        other_income: 'Other',
    };
    return map[category] || category;
};

export default function TransactionSuccessModal({ visible, data, onDone }: Props) {
    const { colors } = useAppTheme();

    useEffect(() => {
        if (visible) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    }, [visible]);

    if (!data) return null;

    const isIncome = data.type === 'income';
    const accentColor = isIncome ? '#4CAF50' : '#007DFE';
    const gradientColors = isIncome
        ? ['#43A047', '#2E7D32'] as const
        : ['#007DFE', '#0057B7'] as const;

    return (
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onDone}
        >
            <YStack flex={1} backgroundColor="rgba(0,0,0,0.85)" justifyContent="center" alignItems="center" padding={24}>
                <YStack
                    width="100%"
                    backgroundColor={colors.background}
                    borderRadius={28}
                    paddingHorizontal={24}
                    paddingTop={40}
                    paddingBottom={Platform.OS === 'ios' ? 28 : 24}
                    borderWidth={1}
                    borderColor={colors.border}
                    alignItems="center"
                    overflow="hidden"
                >
                    {/* Simplified Static Header */}
                    <YStack alignItems="center" justifyContent="center" marginBottom={28} height={80} width={80}>
                        <View style={{ position: 'absolute' }}>
                            <YStack
                                width={80} height={80} borderRadius={40}
                                borderWidth={2} borderColor={`${accentColor}20`}
                            />
                        </View>
                        <LinearGradient
                            colors={[...gradientColors]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={{
                                width: 56, height: 56, borderRadius: 28,
                                alignItems: 'center', justifyContent: 'center',
                                shadowColor: accentColor,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 6
                            }}
                        >
                            <Feather name="check" size={28} color="#FFF" />
                        </LinearGradient>
                    </YStack>

                    {/* Title */}
                    <YStack alignItems="center">
                        <Text fontSize={22} fontWeight="800" color={colors.text} marginBottom={4} textAlign="center">
                            Transaction Successful!
                        </Text>
                        <Text fontSize={14} color={colors.textSecondary} textAlign="center" marginBottom={24}>
                            {data.actionLabel || (isIncome ? 'Income recorded' : 'Expense recorded')}
                        </Text>
                    </YStack>

                    {/* Amount */}
                    <YStack
                        paddingHorizontal={32} paddingVertical={16}
                        borderRadius={20}
                        marginBottom={28}
                        backgroundColor={`${accentColor}12`}
                    >
                        <Text
                            fontSize={36} fontWeight="800" textAlign="center"
                            color={accentColor}
                            letterSpacing={-1}
                        >
                            {isIncome ? '+' : '-'}{formatCurrency(data.amount)}
                        </Text>
                    </YStack>

                    {/* Details Table */}
                    <YStack
                        width="100%"
                        borderRadius={16}
                        backgroundColor={colors.card}
                        borderWidth={1}
                        borderColor={colors.border}
                        overflow="hidden"
                        marginBottom={24}
                    >
                        {/* Category */}
                        <XStack padding={16} alignItems="center" borderBottomWidth={1} borderBottomColor={colors.border}>
                            <YStack
                                width={36} height={36} borderRadius={10}
                                backgroundColor={`${accentColor}15`}
                                alignItems="center" justifyContent="center" marginRight={14}
                            >
                                <Feather name={getCategoryIcon(data.category) as any} size={16} color={accentColor} />
                            </YStack>
                            <YStack flex={1}>
                                <Text fontSize={12} color={colors.textSecondary}>Category</Text>
                                <Text fontSize={15} fontWeight="600" color={colors.text} marginTop={1}>
                                    {getCategoryLabel(data.category)}
                                </Text>
                            </YStack>
                        </XStack>

                        {/* Account */}
                        <XStack padding={16} alignItems="center" borderBottomWidth={1} borderBottomColor={colors.border}>
                            <YStack
                                width={36} height={36} borderRadius={10}
                                backgroundColor={`${colors.text}10`}
                                alignItems="center" justifyContent="center" marginRight={14}
                            >
                                <Feather name="credit-card" size={16} color={colors.text} />
                            </YStack>
                            <YStack flex={1}>
                                <Text fontSize={12} color={colors.textSecondary}>Account</Text>
                                <Text fontSize={15} fontWeight="600" color={colors.text} marginTop={1}>
                                    {data.accountName}
                                </Text>
                            </YStack>
                        </XStack>

                        {/* New Balance */}
                        <XStack padding={16} alignItems="center">
                            <YStack
                                width={36} height={36} borderRadius={10}
                                backgroundColor="rgba(76,175,80,0.12)"
                                alignItems="center" justifyContent="center" marginRight={14}
                            >
                                <Feather name="dollar-sign" size={16} color="#4CAF50" />
                            </YStack>
                            <YStack flex={1}>
                                <Text fontSize={12} color={colors.textSecondary}>New Balance</Text>
                                <Text fontSize={15} fontWeight="700" color="#4CAF50" marginTop={1}>
                                    {formatCurrency(data.newBalance)}
                                </Text>
                            </YStack>
                        </XStack>
                    </YStack>

                    {/* Note if present */}
                    {data.note ? (
                        <XStack
                            width="100%" paddingHorizontal={16} paddingVertical={12}
                            borderRadius={12} backgroundColor={colors.card}
                            borderWidth={1} borderColor={colors.border}
                            alignItems="center" gap={10} marginBottom={24}
                        >
                            <Feather name="message-circle" size={14} color={colors.textSecondary} />
                            <Text fontSize={13} color={colors.textSecondary} flex={1} numberOfLines={2}>
                                {data.note}
                            </Text>
                        </XStack>
                    ) : null}

                    {/* Done Button */}
                    <YStack
                        width="100%"
                        pressStyle={{ opacity: 0.85, scale: 0.98 }}
                        onPress={onDone}
                    >
                        <LinearGradient
                            colors={[...gradientColors]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={{
                                flexDirection: 'row',
                                paddingVertical: 18,
                                borderRadius: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                shadowColor: accentColor,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 12,
                                elevation: 8,
                            }}
                        >
                            <Text fontSize={17} fontWeight="700" color="#FFF" letterSpacing={0.3}>
                                Done
                            </Text>
                        </LinearGradient>
                    </YStack>

                    {/* Timestamp */}
                    <Text fontSize={11} color={colors.textSecondary} marginTop={16}>
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' • '}
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </YStack>
            </YStack>
        </Modal>
    );
}
