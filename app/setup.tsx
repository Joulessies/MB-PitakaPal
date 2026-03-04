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
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
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
    const [currency, setCurrency] = useState(CURRENCIES[1]); // Default PHP
    const [cashAmount, setCashAmount] = useState('');
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);
    const [currencySearch, setCurrencySearch] = useState('');
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // To prevent double taps

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
            // Setup complete → Finish Logic
            if (isSubmitting) return;
            setIsSubmitting(true);

            try {
                // 1. Process Data
                const initialAmount = parseFloat(cashAmount.replace(/,/g, '')) || 0;

                // 2. Add Transaction (Initial Balance)
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

                // 3. Add Account (Cash Wallet)
                await addAccount({
                    name: 'Cash Wallet',
                    balance: initialAmount,
                    type: 'cash',
                    icon: 'dollar-sign',
                    colors: ['#2E7D32', '#1B5E20'],
                    number: 'Cash',
                    theme: 'dark'
                });

                // 4. Navigate
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
        <View style={styles.container}>
            <StatusBar style="light" />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <Feather name="arrow-left" size={22} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Dot Indicators */}
                    <View style={styles.dotsRow}>
                        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    i === currentStep && styles.dotActive,
                                ]}
                            />
                        ))}
                    </View>

                    <View style={{ width: 40 }} />
                </View>

                {/* ── Step Content ── */}
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateX: slideAnim }],
                        },
                    ]}
                >
                    {/* ═══ STEP 1: Currency ═══ */}
                    {currentStep === 0 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.title}>Select the primary{'\n'}Currency!</Text>
                            <Text style={styles.description}>
                                Select the currency you wish to use to calculate all of your transactions in one.
                            </Text>

                            <TouchableOpacity
                                style={styles.pickerWrapper}
                                onPress={() => setShowCurrencyModal(true)}
                            >
                                <Text style={styles.pickerFlag}>{currency.flag}</Text>
                                <Text style={styles.pickerText}>{currency.name}</Text>
                                <View style={{ flex: 1 }} />
                                <Feather name="chevron-down" size={20} color="rgba(255,255,255,0.5)" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ═══ STEP 2: Cash Amount ═══ */}
                    {currentStep === 1 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.title}>What's your total{'\n'}amount of cash?</Text>
                            <Text style={styles.description}>
                                Enter your current cash balance so we can help you start tracking your finances right away.
                            </Text>

                            <View style={styles.amountContainer}>
                                <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder="0.00"
                                    placeholderTextColor="rgba(255,255,255,0.2)"
                                    value={cashAmount}
                                    onChangeText={setCashAmount}
                                    keyboardType="decimal-pad"
                                />
                            </View>

                            <View style={styles.amountChips}>
                                {['100', '500', '1,000', '5,000', '10,000'].map((amt) => (
                                    <TouchableOpacity
                                        key={amt}
                                        style={styles.chip}
                                        onPress={() => setCashAmount(amt.replace(',', ''))}
                                    >
                                        <Text style={styles.chipText}>{currency.symbol}{amt}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* ═══ STEP 3: Biometrics ═══ */}
                    {currentStep === 2 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.title}>Enable Biometrics</Text>
                            <Text style={styles.description}>
                                Secure your account with fingerprint or face recognition for quick and safe access.
                            </Text>

                            <View style={styles.biometricsCard}>
                                <Text style={styles.biometricsEmoji}>
                                    {biometricsEnabled ? '🔓' : '🔒'}
                                </Text>
                                <Text style={styles.biometricsTitle}>
                                    {biometricsEnabled ? 'Biometrics Enabled' : 'Tap to Enable'}
                                </Text>
                                <Text style={styles.biometricsSubtitle}>
                                    {biometricsEnabled
                                        ? 'Your account is secured with biometrics'
                                        : 'Use fingerprint or face ID to login'}
                                </Text>

                                <TouchableOpacity
                                    style={[
                                        styles.biometricsToggle,
                                        biometricsEnabled && styles.biometricsToggleActive,
                                    ]}
                                    onPress={() => setBiometricsEnabled(!biometricsEnabled)}
                                    activeOpacity={0.8}
                                >
                                    <View
                                        style={[
                                            styles.toggleThumb,
                                            biometricsEnabled && styles.toggleThumbActive,
                                        ]}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.biometricsInfo}>
                                <View style={styles.infoRow}>
                                    <Feather name="shield" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 12 }} />
                                    <Text style={styles.infoText}>Your biometric data stays on your device</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Feather name="zap" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 12 }} />
                                    <Text style={styles.infoText}>Instant login without typing passwords</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Feather name="lock" size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 12 }} />
                                    <Text style={styles.infoText}>Bank-level security for your finances</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            {/* ── Bottom Button ── */}
            <View style={styles.bottomButton}>
                <TouchableOpacity
                    style={[styles.nextButton, isSubmitting && { opacity: 0.7 }]}
                    onPress={handleNext}
                    activeOpacity={0.85}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#161616" />
                    ) : (
                        <Text style={styles.nextButtonText}>
                            {currentStep === TOTAL_STEPS - 1 ? 'Get Started' : 'Next'}
                        </Text>
                    )}
                </TouchableOpacity>

                {currentStep === 2 && !biometricsEnabled && (
                    <TouchableOpacity
                        style={styles.skipBiometrics}
                        onPress={() => router.replace('/(tabs)')}
                    >
                        <Text style={styles.skipBiometricsText}>Skip for now</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Currency Picker Modal (kept same as before) ── */}
            <Modal
                visible={showCurrencyModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCurrencyModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Currency</Text>
                            <TouchableOpacity onPress={() => { setShowCurrencyModal(false); setCurrencySearch(''); }}>
                                <Feather name="x" size={22} color="rgba(255,255,255,0.5)" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalSearchWrapper}>
                            <Feather name="search" size={18} color="rgba(255,255,255,0.35)" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder="Search currency..."
                                placeholderTextColor="rgba(255,255,255,0.35)"
                                value={currencySearch}
                                onChangeText={setCurrencySearch}
                                autoCorrect={false}
                            />
                        </View>

                        <FlatList
                            data={CURRENCIES.filter(c =>
                                c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
                                c.label.toLowerCase().includes(currencySearch.toLowerCase())
                            )}
                            keyExtractor={(item) => item.name}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.currencyItem,
                                        currency.name === item.name && styles.currencyItemActive,
                                    ]}
                                    onPress={() => {
                                        setCurrency(item);
                                        setShowCurrencyModal(false);
                                        setCurrencySearch('');
                                    }}
                                >
                                    <Text style={styles.currencyItemFlag}>{item.flag}</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.currencyItemCode}>{item.name}</Text>
                                        <Text style={styles.currencyItemLabel}>{item.label}</Text>
                                    </View>
                                    <Text style={styles.currencyItemSymbol}>{item.symbol}</Text>
                                    {currency.name === item.name && (
                                        <Feather name="check" size={18} color="#4CAF50" style={{ fontWeight: '700' }} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#161616',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },

    /* ── Header ── */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: height * 0.06,
        marginBottom: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backArrow: {
        fontSize: 20,
        color: '#FFFFFF',
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 32,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    dotActive: {
        backgroundColor: '#FFFFFF',
    },

    /* ── Content ── */
    content: {
        flex: 1,
    },
    stepContainer: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 10,
        lineHeight: 36,
    },
    description: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.45)',
        lineHeight: 22,
        marginBottom: 28,
    },

    /* ── Currency Picker ── */
    pickerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        height: 52,
        paddingHorizontal: 16,
    },
    pickerFlag: {
        fontSize: 24,
        marginRight: 12,
    },
    pickerText: {
        fontSize: 15,
        color: '#FFFFFF',
    },
    chevronIcon: {
        fontSize: 22,
        color: 'rgba(255, 255, 255, 0.5)',
    },

    /* ── Cash Amount ── */
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    currencySymbol: {
        fontSize: 48,
        fontWeight: '700',
        color: '#FFFFFF',
        marginRight: 4,
    },
    amountInput: {
        fontSize: 48,
        fontWeight: '700',
        color: '#FFFFFF',
        minWidth: 120,
        textAlign: 'center',
    },
    amountChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    chipText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },

    /* ── Biometrics ── */
    biometricsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    biometricsEmoji: {
        fontSize: 56,
        marginBottom: 16,
    },
    biometricsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    biometricsSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.45)',
        marginBottom: 20,
        textAlign: 'center',
    },
    biometricsToggle: {
        width: 56,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 3,
        justifyContent: 'center',
    },
    biometricsToggleActive: {
        backgroundColor: '#4CAF50',
    },
    toggleThumb: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFFFFF',
    },
    toggleThumbActive: {
        alignSelf: 'flex-end',
    },
    biometricsInfo: {
        gap: 14,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: {
        fontSize: 18,
        marginRight: 12,
    },
    infoText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
    },

    /* ── Bottom Button ── */
    bottomButton: {
        paddingHorizontal: 24,
        paddingBottom: 36,
        paddingTop: 12,
    },
    nextButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#161616',
    },
    skipBiometrics: {
        alignItems: 'center',
        paddingTop: 14,
    },
    skipBiometricsText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.45)',
        fontWeight: '600',
    },

    /* ── Currency Modal ── */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#1e1e1e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: height * 0.75,
        paddingTop: 20,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalClose: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.5)',
        padding: 4,
    },
    modalSearchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        height: 46,
        paddingHorizontal: 14,
        marginBottom: 12,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 10,
    },
    modalSearchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
        height: '100%',
    },
    currencyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    },
    currencyItemActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 10,
        marginHorizontal: -4,
        paddingHorizontal: 8,
    },
    currencyItemFlag: {
        fontSize: 24,
        marginRight: 14,
    },
    currencyItemCode: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    currencyItemLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 2,
    },
    currencyItemSymbol: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.4)',
        marginRight: 12,
    },
    currencyItemCheck: {
        fontSize: 18,
        color: '#4CAF50',
        fontWeight: '700',
    },
});
