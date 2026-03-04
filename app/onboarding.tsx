import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        image: require('../assets/images/9.png'),
        badge: require('../assets/images/6.png'),
        badgePosition: { bottom: 120, right: 20 },
        floatBadge: require('../assets/images/7.png'),
        floatPosition: { top: 100, left: 20 },
        title: 'Your cash flow strategy',
        description:
            'Adopt smart financial practices!  Limit your expenditures and refrain from making impulsive purchases.',
    },
    {
        id: '2',
        image: require('../assets/images/1.png'),
        badge: require('../assets/images/5.png'),
        badgePosition: { bottom: 140, right: 20 },
        floatBadge: require('../assets/images/3.png'),
        floatPosition: { top: 100, left: 20 },
        title: 'Track your spending',
        description:
            'Monitor every transaction and categorize your expenses to better understand where your money goes.',
    },
    {
        id: '3',
        image: require('../assets/images/2.png'),
        badge: require('../assets/images/4.png'),
        badgePosition: { bottom: 140, left: 20 },
        floatBadge: require('../assets/images/6.png'),
        floatPosition: { top: 100, right: 20 },
        title: 'Plan your subscriptions',
        description:
            'Keep all your recurring payments organized and never miss a due date with smart subscription tracking.',
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
            setCurrentIndex(currentIndex + 1);
        } else {
            router.replace('/login');
        }
    };

    const handleSkip = () => {
        router.replace('/login');
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const renderSlide = ({ item, index }: { item: typeof slides[0]; index: number }) => {
        return (
            <View style={styles.slide}>
                {/* Background Image */}
                <Image
                    source={item.image}
                    style={styles.backgroundImage}
                    contentFit="cover"
                />

                {/* Dark overlay at bottom for readability */}
                <View style={styles.imageOverlay} />

                {/* Float badge (top) */}
                <View style={[styles.floatingBadge, item.floatPosition]}>
                    <Image
                        source={item.floatBadge}
                        style={styles.badgeImage}
                        contentFit="contain"
                    />
                </View>

                {/* Bottom badge */}
                <View style={[styles.floatingBadge, item.badgePosition]}>
                    <Image
                        source={item.badge}
                        style={styles.badgeImage}
                        contentFit="contain"
                    />
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Image Carousel */}
            <View style={styles.carouselContainer}>
                <FlatList
                    ref={flatListRef}
                    data={slides}
                    renderItem={renderSlide}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    bounces={false}
                />

                {/* Dots */}
                <View style={styles.dotsContainer}>
                    {slides.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [8, 20, 8],
                            extrapolate: 'clamp',
                        });
                        const dotOpacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.4, 1, 0.4],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.dot,
                                    { width: dotWidth, opacity: dotOpacity },
                                ]}
                            />
                        );
                    })}
                </View>
            </View>

            {/* Bottom Card */}
            <View style={styles.bottomCard}>
                <Text style={styles.title}>{slides[currentIndex].title}</Text>
                <Text style={styles.description}>{slides[currentIndex].description}</Text>

                {/* Next Button */}
                <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
                    <Text style={styles.nextButtonText}>
                        {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </TouchableOpacity>

                {/* Skip Button */}
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.85}>
                    <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#161616',
    },

    /* ── Carousel ── */
    carouselContainer: {
        flex: 1,
    },
    slide: {
        width,
        flex: 1,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '30%',
        backgroundColor: 'transparent',
    },

    /* ── Floating Badges ── */
    floatingBadge: {
        position: 'absolute',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    badgeImage: {
        height: 44,
        width: 220,
    },

    /* ── Dots ── */
    dotsContainer: {
        position: 'absolute',
        bottom: 16,
        flexDirection: 'row',
        alignSelf: 'center',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
    },

    /* ── Bottom Card ── */
    bottomCard: {
        backgroundColor: '#1e1e1e',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 28,
        paddingTop: 32,
        paddingBottom: 50,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
        paddingHorizontal: 8,
    },

    /* ── Buttons ── */
    nextButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#161616',
    },
    skipButton: {
        borderRadius: 12,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    skipButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
