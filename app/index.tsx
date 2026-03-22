import { useAuth } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Text } from 'tamagui';

export default function SplashPage() {
    const { isSignedIn, isLoaded } = useAuth();
    const logoScale = useRef(new Animated.Value(0.4)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(20)).current;
    const fadeOut = useRef(new Animated.Value(1)).current;
    const hasNavigated = useRef(false);

    const navigateAway = (signedIn: boolean | undefined) => {
        if (hasNavigated.current) return;
        hasNavigated.current = true;

        Animated.timing(fadeOut, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
        }).start(() => {
            if (signedIn) {
                router.replace('/(tabs)');
            } else {
                router.replace('/onboarding');
            }
        });
    };

    // Timeout safety net: if Clerk doesn't load within 10 seconds, navigate anyway
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!hasNavigated.current) {
                console.warn('[SplashScreen] Clerk auth timed out after 10s, navigating to onboarding');
                navigateAway(false);
            }
        }, 10000);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isLoaded) return;

        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(textTranslateY, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]),
            Animated.delay(800),
        ]).start(() => {
            navigateAway(isSignedIn);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded]);

    return (
        <Animated.View style={{ flex: 1, backgroundColor: '#282828', alignItems: 'center', justifyContent: 'center', opacity: fadeOut }}>
            <StatusBar style="light" />

            {/* Logo */}
            <Animated.View
                style={{
                    marginBottom: 20,
                    opacity: logoOpacity,
                    transform: [{ scale: logoScale }],
                }}
            >
                <Image
                    source={require('../assets/images/8.png')}
                    style={{ width: 140, height: 140 }}
                    contentFit="contain"
                />
            </Animated.View>

            {/* App Name */}
            <Animated.Text
                style={{
                    opacity: textOpacity,
                    transform: [{ translateY: textTranslateY }],
                }}
            >
                <Text
                    fontSize={36}
                    fontWeight="600"
                    color="#FFFFFF"
                    letterSpacing={1}
                >
                    PitakaPal
                </Text>
            </Animated.Text>
        </Animated.View>
    );
}
