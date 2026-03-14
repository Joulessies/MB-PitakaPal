import { useAuth, useSignIn } from '@clerk/clerk-expo';
import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Input, Separator, SizableText, Text, XStack, YStack } from 'tamagui';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const { signOut } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const contentOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const cleanup = async () => {
            try {
                await signOut();
            } catch (_err) {
            }
        };
        cleanup();
    }, []);

    const contentTranslateY = useRef(new Animated.Value(20)).current;
    const sheetTranslateY = useRef(new Animated.Value(height * 0.5)).current;
    const buttonScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(contentOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(contentTranslateY, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            Animated.spring(sheetTranslateY, {
                toValue: 0,
                tension: 50,
                friction: 10,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!isLoaded) return;

        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.96,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScale, {
                toValue: 1,
                duration: 80,
                useNativeDriver: true,
            }),
        ]).start();

        setIsLoading(true);

        try {
            const completeSignIn = await signIn.create({
                identifier: email,
                password,
            });

            await setActive({ session: completeSignIn.createdSessionId });
            router.replace('/(tabs)');
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            Alert.alert('Login Failed', err.errors ? err.errors[0].message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <YStack flex={1} backgroundColor="#161616">
            <StatusBar style="light" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
                    {/* ── Top Content ── */}
                    <Animated.View
                        style={{
                            paddingTop: height * 0.08,
                            alignItems: 'center',
                            opacity: contentOpacity,
                            transform: [{ translateY: contentTranslateY }],
                        }}
                    >
                        {/* Logo + App Name */}
                        <XStack alignItems="center" marginBottom={20}>
                            <Image
                                source={require('../assets/images/8.png')}
                                style={{ width: 48, height: 48, marginRight: 12 }}
                                contentFit="contain"
                            />
                            <Text fontSize={28} fontWeight="700" color="#FFFFFF" letterSpacing={0.5}>
                                PitakaPal
                            </Text>
                        </XStack>

                        {/* Subtitle */}
                        <Text
                            fontSize={26}
                            fontWeight="600"
                            color="#FFFFFF"
                            textAlign="center"
                            lineHeight={36}
                            marginBottom={24}
                        >
                            Let&apos;s resolve your{'\n'}financial issues
                        </Text>

                        {/* Large Wallet Image */}
                        <YStack alignItems="center" justifyContent="center" marginBottom={-30} zIndex={2}>
                            <Image
                                source={require('../assets/images/8.png')}
                                style={{ width: width * 0.5, height: width * 0.38 }}
                                contentFit="contain"
                            />
                        </YStack>
                    </Animated.View>

                    {/* ── Bottom Sheet ── */}
                    <Animated.View
                        style={{
                            flex: 1,
                            backgroundColor: '#1e1e1e',
                            borderTopLeftRadius: 28,
                            borderTopRightRadius: 28,
                            paddingHorizontal: 28,
                            paddingTop: 44,
                            paddingBottom: 60,
                            zIndex: 1,
                            transform: [{ translateY: sheetTranslateY }],
                        }}
                    >
                        {/* Email */}
                        <YStack
                            borderRadius={10}
                            borderWidth={1}
                            borderColor="rgba(255, 255, 255, 0.2)"
                            marginBottom={14}
                            height={50}
                            justifyContent="center"
                            paddingHorizontal={16}
                        >
                            <Input
                                unstyled
                                color="#FFFFFF"
                                fontSize={15}
                                height="100%"
                                placeholder="Email"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </YStack>

                        {/* Password */}
                        <YStack
                            borderRadius={10}
                            borderWidth={1}
                            borderColor="rgba(255, 255, 255, 0.2)"
                            marginBottom={14}
                            height={50}
                            justifyContent="center"
                            paddingHorizontal={16}
                        >
                            <Input
                                unstyled
                                color="#FFFFFF"
                                fontSize={15}
                                height="100%"
                                placeholder="Password"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </YStack>

                        {/* Forgot Password */}
                        <XStack alignSelf="flex-start" marginBottom={20} marginTop={2}>
                            <SizableText
                                fontSize={13}
                                color="rgba(255, 255, 255, 0.45)"
                                pressStyle={{ opacity: 0.7 }}
                            >
                                Forgot your password?
                            </SizableText>
                        </XStack>

                        {/* Log In Button */}
                        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                            <YStack
                                backgroundColor="#FFFFFF"
                                borderRadius={12}
                                height={50}
                                alignItems="center"
                                justifyContent="center"
                                onPress={handleLogin}
                                disabled={isLoading}
                                opacity={isLoading ? 0.6 : 1}
                                pressStyle={{ opacity: 0.85 }}
                            >
                                <Text fontSize={16} fontWeight="700" color="#161616">
                                    {isLoading ? 'Logging in...' : 'Log In'}
                                </Text>
                            </YStack>
                        </Animated.View>

                        {/* Sign Up */}
                        <XStack justifyContent="center" marginBottom={20} marginTop={16}>
                            <Text fontSize={13} color="rgba(255, 255, 255, 0.4)">
                                Need to create an account?{' '}
                            </Text>
                            <Text
                                fontSize={13}
                                color="rgba(255, 255, 255, 0.4)"
                                textDecorationLine="underline"
                                pressStyle={{ opacity: 0.7 }}
                                onPress={() => router.push('/register')}
                            >
                                Sign Up
                            </Text>
                        </XStack>

                        {/* Divider */}
                        <XStack alignItems="center" marginBottom={20}>
                            <Separator flex={1} borderColor="rgba(255, 255, 255, 0.1)" />
                            <Text fontSize={13} color="rgba(255, 255, 255, 0.35)" marginHorizontal={16}>
                                Or
                            </Text>
                            <Separator flex={1} borderColor="rgba(255, 255, 255, 0.1)" />
                        </XStack>

                        {/* Google */}
                        <XStack
                            pressStyle={{ opacity: 0.7 }}
                            alignItems="center"
                            justifyContent="center"
                            borderRadius={12}
                            height={50}
                            marginBottom={12}
                            borderWidth={1}
                            borderColor="rgba(255, 255, 255, 0.2)"
                        >
                            <Feather name="chrome" size={20} color="#4285F4" style={{ marginRight: 10 }} />
                            <Text fontSize={15} color="#FFFFFF" fontWeight="500">
                                Log In using Google
                            </Text>
                        </XStack>

                        {/* GitHub */}
                        <XStack
                            pressStyle={{ opacity: 0.7 }}
                            alignItems="center"
                            justifyContent="center"
                            borderRadius={12}
                            height={50}
                            borderWidth={1}
                            borderColor="rgba(255, 255, 255, 0.2)"
                        >
                            <Feather name="github" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
                            <Text fontSize={15} color="#FFFFFF" fontWeight="500">
                                Login Using GitHub
                            </Text>
                        </XStack>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </YStack>
    );
}
