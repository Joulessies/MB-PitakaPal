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
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const { signOut } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Animations
    const contentOpacity = useRef(new Animated.Value(0)).current;

    // Sign out on mount to clear any existing stale sessions
    useEffect(() => {
        const cleanup = async () => {
            try {
                await signOut();
            } catch (err) {
                // ignore
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

            // This is an important step,
            // This indicates the user is signed in
            await setActive({ session: completeSignIn.createdSessionId });

            // Navigate to main tabs
            router.replace('/(tabs)');
        } catch (err: any) {
            console.error(JSON.stringify(err, null, 2));
            Alert.alert('Login Failed', err.errors ? err.errors[0].message : 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

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
                    {/* ── Top Content ── */}
                    <Animated.View
                        style={[
                            styles.topContent,
                            {
                                opacity: contentOpacity,
                                transform: [{ translateY: contentTranslateY }],
                            },
                        ]}
                    >
                        {/* Logo + App Name */}
                        <View style={styles.logoRow}>
                            <Image
                                source={require('../assets/images/8.png')}
                                style={styles.logoSmall}
                                contentFit="contain"
                            />
                            <Text style={styles.logoText}>PitakaPal</Text>
                        </View>

                        {/* Subtitle */}
                        <Text style={styles.subtitle}>
                            Let's resolve your{'\n'}financial issues
                        </Text>

                        {/* Large Wallet Image */}
                        <View style={styles.imageSection}>
                            <Image
                                source={require('../assets/images/8.png')}
                                style={styles.walletImage}
                                contentFit="contain"
                            />
                        </View>
                    </Animated.View>

                    {/* ── Bottom Sheet ── */}
                    <Animated.View
                        style={[
                            styles.bottomSheet,
                            { transform: [{ translateY: sheetTranslateY }] },
                        ]}
                    >
                        {/* Email */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        {/* Forgot Password */}
                        <TouchableOpacity style={styles.forgotButton}>
                            <Text style={styles.forgotText}>Forgot your password?</Text>
                        </TouchableOpacity>

                        {/* Log In Button */}
                        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                            <TouchableOpacity
                                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                                onPress={handleLogin}
                                activeOpacity={0.85}
                                disabled={isLoading}
                            >
                                <Text style={styles.loginButtonText}>
                                    {isLoading ? 'Logging in...' : 'Log In'}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Sign Up */}
                        <View style={styles.signupRow}>
                            <Text style={styles.signupText}>Need to create an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/register')}>
                                <Text style={styles.signupLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>Or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google */}
                        <TouchableOpacity style={styles.socialButton}>
                            <Feather name="chrome" size={20} color="#4285F4" style={{ marginRight: 10 }} />
                            <Text style={styles.socialButtonText}>Log In using Google</Text>
                        </TouchableOpacity>

                        {/* GitHub */}
                        <TouchableOpacity style={[styles.socialButton, { marginBottom: 0 }]}>
                            <Feather name="github" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
                            <Text style={styles.socialButtonText}>Login Using GitHub</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#161616',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },

    /* ── Top Content ── */
    topContent: {
        paddingTop: height * 0.08,
        alignItems: 'center',
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoSmall: {
        width: 48,
        height: 48,
        marginRight: 12,
    },
    logoText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 26,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 36,
        marginBottom: 24,
    },
    imageSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: -30,
        zIndex: 2,
    },
    walletImage: {
        width: width * 0.5,
        height: width * 0.38,
    },

    /* ── Bottom Sheet ── */
    bottomSheet: {
        flex: 1,
        backgroundColor: '#1e1e1e',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 28,
        paddingTop: 44,
        paddingBottom: 60,
        zIndex: 1,
    },

    /* ── Inputs ── */
    inputWrapper: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: 14,
        height: 50,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    input: {
        color: '#FFFFFF',
        fontSize: 15,
        height: '100%',
    },

    /* ── Forgot ── */
    forgotButton: {
        alignSelf: 'flex-start',
        marginBottom: 20,
        marginTop: 2,
    },
    forgotText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.45)',
    },

    /* ── Login Button ── */
    loginButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#161616',
    },

    /* ── Sign Up ── */
    signupRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    signupText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.4)',
    },
    signupLink: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.4)',
        textDecorationLine: 'underline',
    },

    /* ── Divider ── */
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.35)',
        marginHorizontal: 16,
    },

    /* ── Social Buttons ── */
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        height: 50,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    socialButtonText: {
        fontSize: 15,
        color: '#FFFFFF',
        fontWeight: '500',
    },
});
