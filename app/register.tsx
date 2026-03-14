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
} from 'react-native';
import { Button, Input, Text, XStack, YStack } from 'tamagui';

const { height } = Dimensions.get('window');
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
    const { user } = useUser();
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState(0);
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

        if (currentStep === 0) {
            if (!email.includes('@')) {
                Alert.alert('Invalid Email', 'Please enter a valid email address.');
                return;
            }
            animateTransition(1);
            return;
        }

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

        if (currentStep === 3) {
            animateTransition(4);
            return;
        }

        if (currentStep === 4) {
            if (!profileName) {
                Alert.alert('Missing Name', 'Please enter your name.');
                return;
            }

            setIsLoading(true);
            try {
                if (user) {
                    await user.update({
                        firstName: profileName,
                    });
                } else {
                    console.log('User object not loaded yet during profile update');
                }
                router.replace('/setup');
            } catch (err: any) {
                console.error('Profile update failed', err);
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
        <YStack flex={1} backgroundColor="#161616">
            <StatusBar style="light" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
                    {/* ── Header ── */}
                    <XStack alignItems="center" justifyContent="space-between" paddingTop={height * 0.06} marginBottom={16}>
                        <YStack
                            width={40} height={40} borderRadius={20}
                            backgroundColor="rgba(255, 255, 255, 0.1)"
                            alignItems="center" justifyContent="center"
                            pressStyle={{ opacity: 0.7 }}
                            onPress={handleBack}
                        >
                            <Feather name="arrow-left" size={22} color="#FFFFFF" />
                        </YStack>
                        <Text fontSize={16} fontWeight="600" color="#FFFFFF">
                            Step {currentStep + 1} of {TOTAL_STEPS}
                        </Text>
                        <YStack width={40} height={40} borderRadius={20} />
                    </XStack>

                    {/* ── Progress Bar ── */}
                    <YStack height={4} backgroundColor="rgba(255, 255, 255, 0.1)" borderRadius={2} marginBottom={32} position="relative">
                        <Animated.View
                            style={{
                                height: 4,
                                backgroundColor: '#FFFFFF',
                                borderRadius: 2,
                                width: progressWidth,
                            }}
                        />
                        <Animated.View
                            style={{
                                position: 'absolute',
                                top: -4,
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: '#FFFFFF',
                                marginLeft: -6,
                                left: progressWidth,
                            }}
                        />
                    </YStack>

                    {/* ── Step Content ── */}
                    <Animated.View
                        style={{
                            flex: 1,
                            opacity: fadeAnim,
                            transform: [{ translateX: slideAnim }],
                        }}
                    >
                        <Text fontSize={28} fontWeight="700" color="#FFFFFF" marginBottom={10}>
                            {step.title}
                        </Text>
                        <Text fontSize={14} color="rgba(255, 255, 255, 0.45)" lineHeight={22} marginBottom={32}>
                            {currentStep === 2
                                ? `We sent a 6-digit code to ${values[0] || 'your email'}, enter it below:`
                                : step.description}
                        </Text>

                        {/* Standard single input (steps 0, 1, 2, 3) */}
                        {currentStep !== 4 && (
                            <>
                                <Text fontSize={14} fontWeight="600" color="rgba(255, 255, 255, 0.6)" marginBottom={10}>
                                    {step.label}
                                </Text>
                                <XStack
                                    borderRadius={12}
                                    borderWidth={1}
                                    borderColor="rgba(255, 255, 255, 0.2)"
                                    height={52}
                                    alignItems="center"
                                    paddingHorizontal={16}
                                    marginBottom={16}
                                >
                                    <Input
                                        unstyled
                                        flex={currentStep === 1 ? 1 : undefined}
                                        key={currentStep}
                                        color="#FFFFFF"
                                        fontSize={15}
                                        height="100%"
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
                                        <YStack padding={6} pressStyle={{ opacity: 0.7 }} onPress={() => setShowPassword(!showPassword)}>
                                            <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="rgba(255,255,255,0.5)" />
                                        </YStack>
                                    )}
                                </XStack>
                            </>
                        )}

                        {/* Password Validation (Step 1) */}
                        {currentStep === 1 && (
                            <YStack marginBottom={24}>
                                <XStack alignItems="center" marginBottom={8}>
                                    <Feather
                                        name={values[1].length >= 8 ? 'check-circle' : 'circle'}
                                        size={16}
                                        color={values[1].length >= 8 ? '#4CAF50' : 'rgba(255,255,255,0.3)'}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text fontSize={13} color="rgba(255, 255, 255, 0.5)">Minimum 8 Characters</Text>
                                </XStack>
                                <XStack alignItems="center" marginBottom={8}>
                                    <Feather
                                        name={/[^A-Za-z0-9]/.test(values[1]) ? 'check-circle' : 'circle'}
                                        size={16}
                                        color={/[^A-Za-z0-9]/.test(values[1]) ? '#4CAF50' : 'rgba(255,255,255,0.3)'}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text fontSize={13} color="rgba(255, 255, 255, 0.5)">At least 1 symbol</Text>
                                </XStack>
                                <XStack alignItems="center" marginBottom={8}>
                                    <Feather
                                        name={/\d/.test(values[1]) ? 'check-circle' : 'circle'}
                                        size={16}
                                        color={/\d/.test(values[1]) ? '#4CAF50' : 'rgba(255,255,255,0.3)'}
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text fontSize={13} color="rgba(255, 255, 255, 0.5)">At least 1 number</Text>
                                </XStack>
                            </YStack>
                        )}

                        {/* Profile Fields (Step 4) */}
                        {currentStep === 4 && (
                            <YStack>
                                <Text fontSize={14} fontWeight="600" color="rgba(255, 255, 255, 0.6)" marginBottom={10}>
                                    Name
                                </Text>
                                <XStack
                                    borderRadius={12} borderWidth={1} borderColor="rgba(255, 255, 255, 0.2)"
                                    height={52} alignItems="center" paddingHorizontal={16} marginBottom={16}
                                >
                                    <Input
                                        unstyled
                                        flex={1}
                                        color="#FFFFFF"
                                        fontSize={15}
                                        height="100%"
                                        placeholder="Juan Luna"
                                        placeholderTextColor="rgba(255,255,255,0.35)"
                                        value={profileName}
                                        onChangeText={setProfileName}
                                        autoCapitalize="words"
                                    />
                                </XStack>

                                <Text fontSize={14} fontWeight="600" color="rgba(255, 255, 255, 0.6)" marginBottom={10}>
                                    Country or Residences
                                </Text>
                                <XStack
                                    borderRadius={12} borderWidth={1} borderColor="rgba(255, 255, 255, 0.2)"
                                    height={52} alignItems="center" paddingHorizontal={16} marginBottom={16}
                                    pressStyle={{ opacity: 0.7 }}
                                    onPress={() => setShowCountryModal(true)}
                                >
                                    <Text fontSize={22} marginRight={10}>{country.flag}</Text>
                                    <Text fontSize={15} color="#FFFFFF">{country.name}</Text>
                                    <YStack flex={1} />
                                    <Feather name="chevron-down" size={20} color="rgba(255,255,255,0.5)" />
                                </XStack>

                                <Text fontSize={14} fontWeight="600" color="rgba(255, 255, 255, 0.6)" marginBottom={10}>
                                    Birth Of Date
                                </Text>
                                <XStack
                                    borderRadius={12} borderWidth={1} borderColor="rgba(255, 255, 255, 0.2)"
                                    height={52} alignItems="center" paddingHorizontal={16} marginBottom={16}
                                >
                                    <Input
                                        unstyled
                                        flex={1}
                                        color="#FFFFFF"
                                        fontSize={15}
                                        height="100%"
                                        placeholder="11 May 1998"
                                        placeholderTextColor="rgba(255,255,255,0.35)"
                                        value={birthDate}
                                        onChangeText={setBirthDate}
                                    />
                                    <Feather name="calendar" size={20} color="rgba(255,255,255,0.5)" />
                                </XStack>
                            </YStack>
                        )}

                        <Button
                            backgroundColor="#FFFFFF"
                            borderRadius={12}
                            height={52}
                            onPress={handleNext}
                            pressStyle={{ opacity: 0.85 }}
                            disabled={isLoading}
                            opacity={isLoading ? 0.7 : 1}
                            {...(currentStep === 4 ? { marginTop: 'auto' } : {})}
                        >
                            <Text fontSize={16} fontWeight="700" color="#161616">
                                {isLoading ? 'Processing...' : step.buttonText}
                            </Text>
                        </Button>

                        {step.hasResend && (
                            <Button
                                unstyled
                                borderRadius={12}
                                height={52}
                                alignItems="center"
                                justifyContent="center"
                                marginTop={12}
                                borderWidth={1}
                                borderColor="rgba(255, 255, 255, 0.2)"
                                pressStyle={{ opacity: 0.85 }}
                                onPress={handleResend}
                            >
                                <Text fontSize={16} fontWeight="600" color="#FFFFFF">
                                    Resend Code
                                </Text>
                            </Button>
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
                            <Text fontSize={20} fontWeight="700" color="#FFFFFF">Select Country</Text>
                            <YStack pressStyle={{ opacity: 0.7 }} onPress={() => { setShowCountryModal(false); setCountrySearch(''); }}>
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
                                placeholder="Search country..."
                                placeholderTextColor="rgba(255,255,255,0.35)"
                                value={countrySearch}
                                onChangeText={setCountrySearch}
                                autoCorrect={false}
                            />
                        </XStack>
                        <FlatList
                            data={COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))}
                            keyExtractor={(item) => item.name}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <XStack
                                    alignItems="center"
                                    paddingVertical={14}
                                    paddingHorizontal={country.name === item.name ? 8 : 4}
                                    borderBottomWidth={1}
                                    borderBottomColor="rgba(255, 255, 255, 0.06)"
                                    backgroundColor={country.name === item.name ? 'rgba(255, 255, 255, 0.06)' : 'transparent'}
                                    borderRadius={country.name === item.name ? 10 : 0}
                                    marginHorizontal={country.name === item.name ? -4 : 0}
                                    pressStyle={{ opacity: 0.7 }}
                                    onPress={() => {
                                        setCountry(item);
                                        setShowCountryModal(false);
                                        setCountrySearch('');
                                    }}
                                >
                                    <Text fontSize={24} marginRight={14}>{item.flag}</Text>
                                    <Text fontSize={16} color="#FFFFFF" flex={1}>{item.name}</Text>
                                    {country.name === item.name && (
                                        <Text fontSize={18} color="#4CAF50" fontWeight="700">✓</Text>
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
