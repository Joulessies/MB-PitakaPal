import { useUser } from '@clerk/clerk-expo';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    ScrollView,
} from 'react-native';
import { Input, Text, XStack, YStack } from 'tamagui';
import { useAccounts } from '../context/AccountContext';
import { useTransactions } from '../context/TransactionContext';

const { width, height } = Dimensions.get('window');
const TOTAL_STEPS = 3;

const CURRENCIES = [
    { name: 'USD', flag: '🇺🇸', symbol: '$', label: 'US Dollar' },
    { name: 'PHP', flag: '🇵🇭', symbol: '₱', label: 'Philippine Peso' },
    { name: 'GBP', flag: '🇬🇧', symbol: '£', label: 'British Pound' },
    { name: 'EUR', flag: '🇪🇺', symbol: '€', label: 'Euro' },
    { name: 'JPY', flag: '🇯🇵', symbol: '¥', label: 'Japanese Yen' },
    { name: 'KRW', flag: '🇰🇷', symbol: '₩', label: 'South Korean Won' },
    { name: 'CNY', flag: '🇨🇳', symbol: '¥', label: 'Chinese Yuan' },
    { name: 'INR', flag: '🇮🇳', symbol: '₹', label: 'Indian Rupee' },
    { name: 'SGD', flag: '🇸🇬', symbol: '$', label: 'Singapore Dollar' },
    { name: 'MYR', flag: '🇲🇾', symbol: 'RM', label: 'Malaysian Ringgit' },
    { name: 'IDR', flag: '🇮🇩', symbol: 'Rp', label: 'Indonesian Rupiah' },
    { name: 'THB', flag: '🇹🇭', symbol: '฿', label: 'Thai Baht' },
    { name: 'VND', flag: '🇻🇳', symbol: '₫', label: 'Vietnamese Dong' },
    { name: 'AUD', flag: '🇦🇺', symbol: '$', label: 'Australian Dollar' },
    { name: 'CAD', flag: '🇨🇦', symbol: '$', label: 'Canadian Dollar' },
    { name: 'BRL', flag: '🇧🇷', symbol: 'R$', label: 'Brazilian Real' },
    { name: 'MXN', flag: '🇲🇽', symbol: '$', label: 'Mexican Peso' },
    { name: 'AED', flag: '🇦🇪', symbol: 'د.إ', label: 'UAE Dirham' },
    { name: 'SAR', flag: '🇸🇦', symbol: '﷼', label: 'Saudi Riyal' },
    { name: 'CHF', flag: '🇨🇭', symbol: 'CHF', label: 'Swiss Franc' },
    { name: 'SEK', flag: '🇸🇪', symbol: 'kr', label: 'Swedish Krona' },
    { name: 'NZD', flag: '🇳🇿', symbol: '$', label: 'New Zealand Dollar' },
    { name: 'NGN', flag: '🇳🇬', symbol: '₦', label: 'Nigerian Naira' },
    { name: 'ZAR', flag: '🇿🇦', symbol: 'R', label: 'South African Rand' },
    { name: 'TRY', flag: '🇹🇷', symbol: '₺', label: 'Turkish Lira' },
    { name: 'TWD', flag: '🇹🇼', symbol: 'NT$', label: 'Taiwan Dollar' },
    { name: 'HKD', flag: '🇭🇰', symbol: 'HK$', label: 'Hong Kong Dollar' },
    { name: 'PKR', flag: '🇵🇰', symbol: 'Rs', label: 'Pakistan Rupee' },
];

export default function SetupScreen() {
    const { user } = useUser();
    const { addTransaction } = useTransactions();
    const { addAccount } = useAccounts();

    const [currentStep, setCurrentStep] = useState(0);
    const [currency, setCurrency] = useState(CURRENCIES[1]);
    const [cashAmount, setCashAmount] = useState('');
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [currencySearch, setCurrencySearch] = useState('');
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    const animateTransition = (nextStep: number) => {
        const direction = nextStep > currentStep ? 1 : -1;

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -30 * direction,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setCurrentStep(nextStep);
            slideAnim.setValue(30 * direction);

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const handleNext = async () => {
        if (currentStep < TOTAL_STEPS - 1) {
            animateTransition(currentStep + 1);
        } else {
            if (isSubmitting) return;
            setIsSubmitting(true);

            try {
                const initialAmount = parseFloat(cashAmount.replace(/,/g, '')) || 0;

                if (initialAmount > 0) {
                    await addTransaction({
                        id: Date.now().toString(),
                        type: 'income',
                        amount: initialAmount,
                        category: 'Savings',
                        account: 'Cash',
                        date: new Date(),
                        note: 'Initial Balance',
                        locationName: 'Setup',
                    });
                }

                await addAccount({
                    name: 'Cash Wallet',
                    balance: initialAmount,
                    type: 'cash',
                    icon: 'dollar-sign',
                    colors: ['#2E7D32', '#1B5E20'],
                    number: 'Cash',
                    theme: 'dark'
                });

                router.replace('/(tabs)');

            } catch (error) {
                console.error("Setup error:", error);
                Alert.alert("Error", "We encountered an issue saving your setup details, but you can proceed.");
                router.replace('/(tabs)');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            animateTransition(currentStep - 1);
        } else {
            router.back();
        }
    };

    return (
        <YStack flex={1} backgroundColor="#161616">
            <StatusBar style="light" />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
            >
                {/* ── Header ── */}
                <XStack alignItems="center" justifyContent="space-between" paddingTop={height * 0.06} marginBottom={24}>
                    <YStack
                        width={40} height={40} borderRadius={20}
                        backgroundColor="rgba(255, 255, 255, 0.1)"
                        alignItems="center" justifyContent="center"
                        pressStyle={{ opacity: 0.7 }}
                        onPress={handleBack}
                    >
                        <Feather name="arrow-left" size={22} color="#FFFFFF" />
                    </YStack>

                    {/* Dot Indicators */}
                    <XStack alignItems="center" gap={8}>
                        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                            <YStack
                                key={i}
                                width={32}
                                height={6}
                                borderRadius={3}
                                backgroundColor={i === currentStep ? '#FFFFFF' : 'rgba(255, 255, 255, 0.15)'}
                            />
                        ))}
                    </XStack>

                    <YStack width={40} />
                </XStack>

                {/* ── Step Content ── */}
                <Animated.View
                    style={{
                        flex: 1,
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }],
                    }}
                >
                    {/* ═══ STEP 1: Currency ═══ */}
                    {currentStep === 0 && (
                        <YStack flex={1}>
                            <Text fontSize={28} fontWeight="700" color="#FFFFFF" marginBottom={10} lineHeight={36}>
                                Select the primary{'\n'}Currency!
                            </Text>
                            <Text fontSize={14} color="rgba(255, 255, 255, 0.45)" lineHeight={22} marginBottom={28}>
                                Select the currency you wish to use to calculate all of your transactions in one.
                            </Text>

                            <XStack
                                alignItems="center"
                                borderRadius={12}
                                borderWidth={1}
                                borderColor="rgba(255, 255, 255, 0.2)"
                                height={52}
                                paddingHorizontal={16}
                                pressStyle={{ opacity: 0.7 }}
                                onPress={() => setShowCurrencyModal(true)}
                            >
                                <Text fontSize={24} marginRight={12}>{currency.flag}</Text>
                                <Text fontSize={15} color="#FFFFFF">{currency.name}</Text>
                                <YStack flex={1} />
                                <Feather name="chevron-down" size={20} color="rgba(255,255,255,0.5)" />
                            </XStack>
                        </YStack>
                    )}

                    {/* ═══ STEP 2: Cash Amount ═══ */}
                    {currentStep === 1 && (
                        <YStack flex={1}>
                            <Text fontSize={28} fontWeight="700" color="#FFFFFF" marginBottom={10} lineHeight={36}>
                                What&apos;s your total{'\n'}amount of cash?
                            </Text>
                            <Text fontSize={14} color="rgba(255, 255, 255, 0.45)" lineHeight={22} marginBottom={28}>
                                Enter your current cash balance so we can help you start tracking your finances right away.
                            </Text>

                            <XStack alignItems="center" justifyContent="center" marginBottom={28}>
                                <Text fontSize={48} fontWeight="700" color="#FFFFFF" marginRight={4}>
                                    {currency.symbol}
                                </Text>
                                <Input
                                    unstyled
                                    fontSize={48}
                                    fontWeight="700"
                                    color="#FFFFFF"
                                    minWidth={120}
                                    textAlign="center"
                                    paddingVertical={0}
                                    placeholder="0.00"
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                    value={cashAmount}
                                    onChangeText={setCashAmount}
                                    keyboardType="decimal-pad"
                                />
                            </XStack>

                            <XStack flexWrap="wrap" gap={10} justifyContent="center">
                                {['100', '500', '1,000', '5,000', '10,000'].map((amt) => (
                                    <YStack
                                        key={amt}
                                        paddingHorizontal={16}
                                        paddingVertical={10}
                                        borderRadius={20}
                                        borderWidth={1}
                                        borderColor="rgba(255, 255, 255, 0.15)"
                                        backgroundColor="rgba(255, 255, 255, 0.05)"
                                        pressStyle={{ opacity: 0.7, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                        onPress={() => setCashAmount(amt.replace(',', ''))}
                                    >
                                        <Text color="#FFFFFF" fontSize={13} fontWeight="600">
                                            {currency.symbol}{amt}
                                        </Text>
                                    </YStack>
                                ))}
                            </XStack>
                        </YStack>
                    )}

                    {/* ═══ STEP 3: Biometrics ═══ */}
                    {currentStep === 2 && (
                        <YStack flex={1}>
                            <Text fontSize={28} fontWeight="700" color="#FFFFFF" marginBottom={10}>
                                Enable Biometrics
                            </Text>
                            <Text fontSize={14} color="rgba(255, 255, 255, 0.45)" lineHeight={22} marginBottom={28}>
                                Secure your account with fingerprint or face recognition for quick and safe access.
                            </Text>

                            <YStack
                                backgroundColor="rgba(255, 255, 255, 0.05)"
                                borderRadius={20}
                                padding={28}
                                alignItems="center"
                                marginBottom={24}
                                borderWidth={1}
                                borderColor="rgba(255, 255, 255, 0.08)"
                            >
                                <Text fontSize={56} marginBottom={16}>
                                    {biometricsEnabled ? '🔓' : '🔒'}
                                </Text>
                                <Text fontSize={18} fontWeight="700" color="#FFFFFF" marginBottom={6}>
                                    {biometricsEnabled ? 'Biometrics Enabled' : 'Tap to Enable'}
                                </Text>
                                <Text fontSize={13} color="rgba(255, 255, 255, 0.45)" marginBottom={20} textAlign="center">
                                    {biometricsEnabled
                                        ? 'Your account is secured with biometrics'
                                        : 'Use fingerprint or face ID to login'}
                                </Text>

                                <XStack
                                    width={56} height={32} borderRadius={16}
                                    backgroundColor={biometricsEnabled ? '#4CAF50' : 'rgba(255, 255, 255, 0.15)'}
                                    padding={3}
                                    justifyContent="center"
                                    pressStyle={{ opacity: 0.8 }}
                                    onPress={() => setBiometricsEnabled(!biometricsEnabled)}
                                >
                                    <YStack
                                        width={26} height={26} borderRadius={13}
                                        backgroundColor="#FFFFFF"
                                        alignSelf={biometricsEnabled ? 'flex-end' : 'flex-start'}
                                    />
                                </XStack>
                            </YStack>

                            <YStack gap={14}>
                                <XStack alignItems="center">
                                    <Feather name="shield" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 12 }} />
                                    <Text fontSize={14} color="rgba(255, 255, 255, 0.5)">
                                        Your biometric data stays on your device
                                    </Text>
                                </XStack>
                                <XStack alignItems="center">
                                    <Feather name="zap" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 12 }} />
                                    <Text fontSize={14} color="rgba(255, 255, 255, 0.5)">
                                        Instant login without typing passwords
                                    </Text>
                                </XStack>
                                <XStack alignItems="center">
                                    <Feather name="lock" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 12 }} />
                                    <Text fontSize={14} color="rgba(255, 255, 255, 0.5)">
                                        Bank-level security for your finances
                                    </Text>
                                </XStack>
                            </YStack>
                        </YStack>
                    )}
                </Animated.View>
            </ScrollView>

            {/* ── Bottom Button ── */}
            <YStack paddingHorizontal={24} paddingBottom={36} paddingTop={12}>
                <YStack
                    backgroundColor="#FFFFFF"
                    borderRadius={12}
                    height={52}
                    alignItems="center"
                    justifyContent="center"
                    onPress={handleNext}
                    pressStyle={{ opacity: 0.85 }}
                    disabled={isSubmitting}
                    opacity={isSubmitting ? 0.7 : 1}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#161616" />
                    ) : (
                        <Text fontSize={16} fontWeight="700" color="#161616">
                            {currentStep === TOTAL_STEPS - 1 ? 'Get Started' : 'Next'}
                        </Text>
                    )}
                </YStack>

                {currentStep === 2 && !biometricsEnabled && (
                    <YStack
                        alignItems="center"
                        paddingTop={14}
                        pressStyle={{ opacity: 0.7 }}
                        onPress={() => router.replace('/(tabs)')}
                    >
                        <Text fontSize={14} color="rgba(255, 255, 255, 0.45)" fontWeight="600">
                            Skip for now
                        </Text>
                    </YStack>
                )}
            </YStack>

            {/* ── Currency Picker Modal ── */}
            <Modal
                visible={showCurrencyModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCurrencyModal(false)}
            >
                <YStack flex={1} backgroundColor="rgba(0, 0, 0, 0.6)" justifyContent="flex-end">
                    <YStack
                        backgroundColor="#1e1e1e"
                        borderTopLeftRadius={24}
                        borderTopRightRadius={24}
                        maxHeight={height * 0.75}
                        paddingTop={20}
                        paddingHorizontal={24}
                        paddingBottom={40}
                    >
                        <XStack alignItems="center" justifyContent="space-between" marginBottom={16}>
                            <Text fontSize={20} fontWeight="700" color="#FFFFFF">Select Currency</Text>
                            <YStack pressStyle={{ opacity: 0.7 }} onPress={() => { setShowCurrencyModal(false); setCurrencySearch(''); }}>
                                <Feather name="x" size={22} color="rgba(255,255,255,0.5)" />
                            </YStack>
                        </XStack>

                        <XStack
                            alignItems="center"
                            backgroundColor="rgba(255, 255, 255, 0.08)"
                            borderRadius={12}
                            height={46}
                            paddingHorizontal={14}
                            marginBottom={12}
                        >
                            <Feather name="search" size={18} color="rgba(255,255,255,0.35)" style={{ marginRight: 10 }} />
                            <Input
                                unstyled
                                flex={1}
                                color="#FFFFFF"
                                fontSize={15}
                                height="100%"
                                placeholder="Search currency..."
                                placeholderTextColor="rgba(255,255,255,0.35)"
                                value={currencySearch}
                                onChangeText={setCurrencySearch}
                                autoCorrect={false}
                            />
                        </XStack>

                        <FlatList
                            data={CURRENCIES.filter(c =>
                                c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
                                c.label.toLowerCase().includes(currencySearch.toLowerCase())
                            )}
                            keyExtractor={(item) => item.name}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <XStack
                                    alignItems="center"
                                    paddingVertical={14}
                                    paddingHorizontal={currency.name === item.name ? 8 : 4}
                                    borderBottomWidth={1}
                                    borderBottomColor="rgba(255, 255, 255, 0.06)"
                                    backgroundColor={currency.name === item.name ? 'rgba(255, 255, 255, 0.06)' : 'transparent'}
                                    borderRadius={currency.name === item.name ? 10 : 0}
                                    marginHorizontal={currency.name === item.name ? -4 : 0}
                                    pressStyle={{ opacity: 0.7 }}
                                    onPress={() => {
                                        setCurrency(item);
                                        setShowCurrencyModal(false);
                                        setCurrencySearch('');
                                    }}
                                >
                                    <Text fontSize={24} marginRight={14}>{item.flag}</Text>
                                    <YStack flex={1}>
                                        <Text fontSize={16} fontWeight="600" color="#FFFFFF">{item.name}</Text>
                                        <Text fontSize={12} color="rgba(255, 255, 255, 0.4)" marginTop={2}>{item.label}</Text>
                                    </YStack>
                                    <Text fontSize={16} color="rgba(255, 255, 255, 0.4)" marginRight={12}>{item.symbol}</Text>
                                    {currency.name === item.name && (
                                        <Feather name="check" size={18} color="#4CAF50" />
                                    )}
                                </XStack>
                            )}
                        />
                    </YStack>
                </YStack>
            </Modal>
        </YStack>
    );
}
