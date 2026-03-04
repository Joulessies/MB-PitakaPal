import { useSignUp, useUser } from '@clerk/clerk-expo';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const TOTAL_STEPS = 5;

const COUNTRIES = [
    { name: 'Philippines', flag: '🇵🇭' },
    { name: 'USA', flag: '🇺🇸' },
    { name: 'United Kingdom', flag: '🇬🇧' },
    { name: 'Canada', flag: '🇨🇦' },
    { name: 'Australia', flag: '🇦🇺' },
    { name: 'Japan', flag: '🇯🇵' },
];

const STEPS = [
    {
        title: 'Add Your email',
        description: 'Create an account to get going. It helps in the security and safety of your financial information.',
        label: 'Email',
        placeholder: 'juanluna@gmail.com',
        keyboardType: 'email-address' as const,
        secure: false,
        hasResend: false,
        buttonText: 'Next',
    },
    {
        title: 'Create your password',
        description: 'your password Must be at least 8 characters long,\nand include 1 symbol and 1 number',
        label: 'Password',
        placeholder: 'Enter your password',
        keyboardType: 'default' as const,
        secure: true,
        hasResend: false,
        buttonText: 'Create Password',
    },
    {
        title: 'Verify your email',
        description: '',
        label: 'OTP code',
        placeholder: '265981',
        keyboardType: 'number-pad' as const,
        secure: false,
        hasResend: true,
        buttonText: 'Verify',
    },
    {
        title: 'Add your phone number',
        description: 'We\'ll use this to verify your identity and keep your account secure.',
        label: 'Phone Number',
        placeholder: '+63 912 345 6789',
        keyboardType: 'phone-pad' as const,
        secure: false,
        hasResend: false,
        buttonText: 'Next',
    },
    {
        title: 'Tell us about yourself',
        description: 'Share a few more details about your personal information!',
        label: '',
        placeholder: '',
        keyboardType: 'default' as const,
        secure: false,
        hasResend: false,
        buttonText: 'Finish',
    },
];

export default function RegisterScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { user } = useUser(); // Get user object to update profile
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState(0);
    // values: [email, password, otp, phone, name] (Note: index adjusted due to swap)
    const [values, setValues] = useState<string[]>(new Array(TOTAL_STEPS).fill(''));
    const [showPassword, setShowPassword] = useState(false);
    const [profileName, setProfileName] = useState('');
    const [country, setCountry] = useState({ name: 'Philippines', flag: '🇵🇭' });
    const [birthDate, setBirthDate] = useState('');
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

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
                Animated.timing(progressAnim, {
                    toValue: (nextStep + 1) / TOTAL_STEPS,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start();
        });
    };

    const handleResend = async () => {
        if (!isLoaded) return;
        setIsLoading(true);
        try {
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            Alert.alert('Code Resent', 'A new verification code has been sent to your email.');
        } catch (err: any) {
            Alert.alert('Resend Failed', err.errors ? err.errors[0].message : 'Could not resend code.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = async () => {
        if (!isLoaded) return;


        const email = values[0];
        const password = values[1];
        const otp = values[2];

        // Step 0: Email (Just move next)
        if (currentStep === 0) {
            if (!email.includes('@')) {
                Alert.alert('Invalid Email', 'Please enter a valid email address.');
                return;
            }
            animateTransition(1);
            return;
        }

        // Step 1: Password -> Create Account Intent
        if (currentStep === 1) {
            if (password.length < 8) {
                Alert.alert('Weak Password', 'Password must be at least 8 characters.');
                return;
            }
            if (!/\d/.test(password)) {
                Alert.alert('Weak Password', 'Password must contain at least 1 number.');
                return;
            }
            if (!/[^A-Za-z0-9]/.test(password)) {
                Alert.alert('Weak Password', 'Password must contain at least 1 symbol.');
                return;
            }
            setIsLoading(true);
            try {
                await signUp.create({
                    emailAddress: email,
                    password,
                });

                await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                animateTransition(2);
            } catch (err: any) {
                console.error(JSON.stringify(err, null, 2));
                Alert.alert('Registration Error', err.errors ? err.errors[0].message : 'Could not create account.');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Step 2: OTP -> Verify Email
        if (currentStep === 2) {
            if (!otp) {
                Alert.alert('Missing Code', 'Please enter the verification code sent to your email.');
                return;
            }
            setIsLoading(true);
            try {
                const completeSignUp = await signUp.attemptEmailAddressVerification({
                    code: otp,
                });

                if (completeSignUp.status === 'complete') {
                    // Don't set active yet if we want to collect more info?
                    // Actually, let's set active now so we are logged in, then update profile in subsequent steps.
                    await setActive({ session: completeSignUp.createdSessionId });
                    animateTransition(3);
                } else {
                    Alert.alert('Verification Failed', 'Invalid code or specific verification issue.');
                }
            } catch (err: any) {
                console.error(JSON.stringify(err, null, 2));
                Alert.alert('Verification Error', err.errors ? err.errors[0].message : 'Could not verify email.');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Step 3: Phone -> Just move next (We can add phone verification later if needed)
        if (currentStep === 3) {
            animateTransition(4);
            return;
        }

        // Step 4: Details -> Finish
        if (currentStep === 4) {
            if (!profileName) {
                Alert.alert('Missing Name', 'Please enter your name.');
                return;
            }

            setIsLoading(true);
            try {
                // Update user profile
                if (user) {
                    await user.update({
                        firstName: profileName,
                    });
                } else {
                    // Fallback if user object isn't immediately available (should happen rarely after setActive)
                    // Log error or retry
                    console.log('User object not loaded yet during profile update');
                }
                router.replace('/setup');
            } catch (err: any) {
                console.error('Profile update failed', err);
                // Continue anyway since account is created
                router.replace('/setup');
            } finally {
                setIsLoading(false);
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

    const updateValue = (text: string) => {
        const updated = [...values];
        updated[currentStep] = text;
        setValues(updated);
    };

    const step = STEPS[currentStep];

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
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
                        <Text style={styles.stepText}>Step {currentStep + 1} of {TOTAL_STEPS}</Text>
                        <View style={styles.backButton} />
                    </View>

                    {/* ── Progress Bar ── */}
                    <View style={styles.progressBarContainer}>
                        <Animated.View
                            style={[
                                styles.progressBarFill,
                                { width: progressWidth },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.progressDot,
                                {
                                    left: progressWidth,
                                },
                            ]}
                        />
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
                        <Text style={styles.title}>{step.title}</Text>
                        <Text style={styles.description}>
                            {currentStep === 2
                                ? `We sent a 6-digit code to ${values[0] || 'your email'}, enter it below:`
                                : step.description}
                        </Text>

                        {/* Standard single input (steps 0, 1, 2, 3) */}
                        {currentStep !== 4 && (
                            <>
                                <Text style={styles.inputLabel}>{step.label}</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        key={currentStep}
                                        style={[styles.input, currentStep === 1 && { flex: 1 }]}
                                        placeholder={step.placeholder}
                                        placeholderTextColor="rgba(255,255,255,0.35)"
                                        value={values[currentStep]}
                                        onChangeText={updateValue}
                                        keyboardType={step.keyboardType}
                                        secureTextEntry={currentStep === 1 ? !showPassword : step.secure}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    {currentStep === 1 && (
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.eyeButton}
                                        >
                                            <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="rgba(255,255,255,0.5)" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </>
                        )}

                        {/* Password Validation (Step 1) */}
                        {currentStep === 1 && (
                            <View style={styles.validationContainer}>
                                <View style={styles.validationRow}>
                                    <Feather
                                        name={values[1].length >= 8 ? 'check-circle' : 'circle'}
                                        size={16}
                                        color={values[1].length >= 8 ? '#4CAF50' : 'rgba(255,255,255,0.3)'}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={styles.validationText}>Minimum 8 Characters</Text>
                                </View>
                                <View style={styles.validationRow}>
                                    <Feather
                                        name={/[^A-Za-z0-9]/.test(values[1]) ? 'check-circle' : 'circle'}
                                        size={16}
                                        color={/[^A-Za-z0-9]/.test(values[1]) ? '#4CAF50' : 'rgba(255,255,255,0.3)'}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={styles.validationText}>At least 1 symbol</Text>
                                </View>
                                <View style={styles.validationRow}>
                                    <Feather
                                        name={/\d/.test(values[1]) ? 'check-circle' : 'circle'}
                                        size={16}
                                        color={/\d/.test(values[1]) ? '#4CAF50' : 'rgba(255,255,255,0.3)'}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={styles.validationText}>At least 1 number</Text>
                                </View>
                            </View>
                        )}

                        {/* Profile Fields (Step 4) */}
                        {currentStep === 4 && (
                            <View>
                                <Text style={styles.inputLabel}>Name</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Juan Luna"
                                        placeholderTextColor="rgba(255,255,255,0.35)"
                                        value={profileName}
                                        onChangeText={setProfileName}
                                        autoCapitalize="words"
                                    />
                                </View>

                                <Text style={styles.inputLabel}>Country or Residences</Text>
                                <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowCountryModal(true)}>
                                    <Text style={styles.flagIcon}>{country.flag}</Text>
                                    <Text style={styles.countryText}>{country.name}</Text>
                                    <View style={{ flex: 1 }} />
                                    <Feather name="chevron-down" size={20} color="rgba(255,255,255,0.5)" />
                                </TouchableOpacity>

                                <Text style={styles.inputLabel}>Birth Of Date</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="11 May 1998"
                                        placeholderTextColor="rgba(255,255,255,0.35)"
                                        value={birthDate}
                                        onChangeText={setBirthDate}
                                    />
                                    <Feather name="calendar" size={20} color="rgba(255,255,255,0.5)" />
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.nextButton, currentStep === 4 && { marginTop: 'auto' }, isLoading && { opacity: 0.7 }]}
                            onPress={handleNext}
                            activeOpacity={0.85}
                            disabled={isLoading}
                        >
                            <Text style={styles.nextButtonText}>
                                {isLoading ? 'Processing...' : step.buttonText}
                            </Text>
                        </TouchableOpacity>

                        {step.hasResend && (
                            <TouchableOpacity
                                style={styles.resendButton}
                                activeOpacity={0.85}
                                onPress={handleResend}
                            >
                                <Text style={styles.resendButtonText}>Resend Code</Text>
                            </TouchableOpacity>
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal for Country Picker */}
            <Modal
                visible={showCountryModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCountryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Country</Text>
                            <TouchableOpacity onPress={() => { setShowCountryModal(false); setCountrySearch(''); }}>
                                <Feather name="x" size={22} color="rgba(255,255,255,0.5)" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalSearchWrapper}>
                            <Feather name="search" size={18} color="rgba(255,255,255,0.35)" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder="Search country..."
                                placeholderTextColor="rgba(255,255,255,0.35)"
                                value={countrySearch}
                                onChangeText={setCountrySearch}
                                autoCorrect={false}
                            />
                        </View>
                        <FlatList
                            data={COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))}
                            keyExtractor={(item) => item.name}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.countryItem,
                                        country.name === item.name && styles.countryItemActive,
                                    ]}
                                    onPress={() => {
                                        setCountry(item);
                                        setShowCountryModal(false);
                                        setCountrySearch('');
                                    }}
                                >
                                    <Text style={styles.countryItemFlag}>{item.flag}</Text>
                                    <Text style={styles.countryItemName}>{item.name}</Text>
                                    {country.name === item.name && (
                                        <Text style={styles.countryItemCheck}>✓</Text>
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
    container: { flex: 1, backgroundColor: '#161616' },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: height * 0.06, marginBottom: 16 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
    stepText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
    progressBarContainer: { height: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, marginBottom: 32, position: 'relative' },
    progressBarFill: { height: 4, backgroundColor: '#FFFFFF', borderRadius: 2 },
    progressDot: { position: 'absolute', top: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF', marginLeft: -6 },
    content: { flex: 1 },
    title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 10 },
    description: { fontSize: 14, color: 'rgba(255, 255, 255, 0.45)', lineHeight: 22, marginBottom: 32 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 10 },
    inputWrapper: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
    input: { color: '#FFFFFF', fontSize: 15, height: '100%' },
    eyeButton: { padding: 6 },
    validationContainer: { marginBottom: 24 },
    validationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    validationText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.5)' },
    flagIcon: { fontSize: 22, marginRight: 10 },
    countryText: { fontSize: 15, color: '#FFFFFF' },
    nextButton: { backgroundColor: '#FFFFFF', borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center' },
    nextButtonText: { fontSize: 16, fontWeight: '700', color: '#161616' },
    resendButton: { borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
    resendButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#1e1e1e', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.75, paddingTop: 20, paddingHorizontal: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
    modalSearchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 12, height: 46, paddingHorizontal: 14, marginBottom: 12 },
    modalSearchInput: { flex: 1, color: '#FFFFFF', fontSize: 15, height: '100%' },
    countryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)' },
    countryItemActive: { backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 10, marginHorizontal: -4, paddingHorizontal: 8 },
    countryItemFlag: { fontSize: 24, marginRight: 14 },
    countryItemName: { fontSize: 16, color: '#FFFFFF', flex: 1 },
    countryItemCheck: { fontSize: 18, color: '#4CAF50', fontWeight: '700' },
});
