import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
} from 'react-native';
import { Button, Text, YStack, XStack } from 'tamagui';

const { width } = Dimensions.get('window');

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

    const renderSlide = ({ item }: { item: typeof slides[0] }) => {
        return (
            <YStack width={width} flex={1}>
                {/* Background Image */}
                <Image
                    source={item.image}
                    style={{ width: '100%', height: '100%', position: 'absolute' }}
                    contentFit="cover"
                />

                {/* Dark overlay at bottom for readability */}
                <YStack
                    position="absolute"
                    bottom={0}
                    left={0}
                    right={0}
                    height="30%"
                    backgroundColor="transparent"
                />

                {/* Float badge (top) */}
                <YStack
                    position="absolute"
                    borderRadius={16}
                    overflow="hidden"
                    elevation={8}
                    {...item.floatPosition}
                >
                    <Image
                        source={item.floatBadge}
                        style={{ height: 44, width: 220 }}
                        contentFit="contain"
                    />
                </YStack>

                {/* Bottom badge */}
                <YStack
                    position="absolute"
                    borderRadius={16}
                    overflow="hidden"
                    elevation={8}
                    {...item.badgePosition}
                >
                    <Image
                        source={item.badge}
                        style={{ height: 44, width: 220 }}
                        contentFit="contain"
                    />
                </YStack>
            </YStack>
        );
    };

    return (
        <YStack flex={1} backgroundColor="#161616">
            <StatusBar style="light" />

            {/* Image Carousel */}
            <YStack flex={1}>
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
                <XStack
                    position="absolute"
                    bottom={16}
                    alignSelf="center"
                    alignItems="center"
                    gap={6}
                >
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
                                style={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: '#FFFFFF',
                                    width: dotWidth,
                                    opacity: dotOpacity,
                                }}
                            />
                        );
                    })}
                </XStack>
            </YStack>

            {/* Bottom Card */}
            <YStack
                backgroundColor="#1e1e1e"
                borderTopLeftRadius={28}
                borderTopRightRadius={28}
                paddingHorizontal={28}
                paddingTop={32}
                paddingBottom={50}
            >
                <Text
                    fontSize={26}
                    fontWeight="700"
                    color="#FFFFFF"
                    textAlign="center"
                    marginBottom={12}
                >
                    {slides[currentIndex].title}
                </Text>
                <Text
                    fontSize={14}
                    color="rgba(255, 255, 255, 0.5)"
                    textAlign="center"
                    lineHeight={22}
                    marginBottom={28}
                    paddingHorizontal={8}
                >
                    {slides[currentIndex].description}
                </Text>

                {/* Next Button */}
                <Button
                    backgroundColor="#FFFFFF"
                    borderRadius={12}
                    height={50}
                    onPress={handleNext}
                    pressStyle={{ opacity: 0.85 }}
                    marginBottom={12}
                >
                    <Text fontSize={16} fontWeight="700" color="#161616">
                        {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </Button>

                {/* Skip Button */}
                <Button
                    unstyled
                    borderRadius={12}
                    height={50}
                    alignItems="center"
                    justifyContent="center"
                    borderWidth={1}
                    borderColor="rgba(255, 255, 255, 0.2)"
                    onPress={handleSkip}
                    pressStyle={{ opacity: 0.85 }}
                >
                    <Text fontSize={16} fontWeight="600" color="#FFFFFF">
                        Skip
                    </Text>
                </Button>
            </YStack>
        </YStack>
    );
}
