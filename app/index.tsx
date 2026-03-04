import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
    const logoScale = useRef(new Animated.Value(0.4)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textTranslateY = useRef(new Animated.Value(20)).current;
    const fadeOut = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            // Step 1: Logo fades in and scales up with a spring
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
            // Step 2: App name slides up and fades in
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
            // Step 3: Hold for a moment
            Animated.delay(800),
            // Step 4: Fade out the whole screen
            Animated.timing(fadeOut, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Navigate to the login screen
            router.replace('/onboarding');
        });
    }, []);

    return (
        <Animated.View style={[styles.container, { opacity: fadeOut }]}>
            <StatusBar style="light" />

            {/* Logo */}
            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }],
                    },
                ]}
            >
                <Image
                    source={require('../assets/images/8.png')}
                    style={styles.logo}
                    contentFit="contain"
                />
            </Animated.View>

            {/* App Name */}
            <Animated.Text
                style={[
                    styles.appName,
                    {
                        opacity: textOpacity,
                        transform: [{ translateY: textTranslateY }],
                    },
                ]}
            >
                PitakaPal
            </Animated.Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#282828',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        marginBottom: 20,
    },
    logo: {
        width: 140,
        height: 140,
    },
    appName: {
        fontSize: 36,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
