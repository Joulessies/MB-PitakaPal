import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, TouchableWithoutFeedback } from 'react-native';
import Animated, { FadeInDown, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Input, Text, XStack, YStack } from 'tamagui';
import TransactionSuccessModal, { SuccessModalData } from '../../components/TransactionSuccessModal';
import { useAccounts } from '../../context/AccountContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useTransactions } from '../../context/TransactionContext';

const EXPENSE_CATEGORIES = [
    { id: 'food', name: 'Food', icon: 'coffee', color: '#FF7043' },
    { id: 'transport', name: 'Transport', icon: 'truck', color: '#42A5F5' },
    { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#EC407A' },
    { id: 'bills', name: 'Bills', icon: 'file-text', color: '#AB47BC' },
    { id: 'entertainment', name: 'Fun', icon: 'film', color: '#26C6DA' },
    { id: 'health', name: 'Health', icon: 'heart', color: '#EF5350' },
    { id: 'education', name: 'School', icon: 'book', color: '#FFA726' },
    { id: 'other', name: 'Other', icon: 'grid', color: '#78909C' },
];

const INCOME_CATEGORIES = [
    { id: 'salary', name: 'Salary', icon: 'briefcase', color: '#4CAF50' },
    { id: 'freelance', name: 'Freelance', icon: 'edit-3', color: '#26C6DA' },
    { id: 'business', name: 'Business', icon: 'trending-up', color: '#7E57C2' },
    { id: 'gift', name: 'Gift', icon: 'gift', color: '#EC407A' },
    { id: 'investment', name: 'Invest', icon: 'bar-chart-2', color: '#FFA726' },
    { id: 'allowance', name: 'Allowance', icon: 'users', color: '#42A5F5' },
    { id: 'refund', name: 'Refund', icon: 'rotate-ccw', color: '#66BB6A' },
    { id: 'other_income', name: 'Other', icon: 'grid', color: '#78909C' },
];

export default function AddTransactionScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { addTransaction } = useTransactions();
    const { accounts, updateAccountBalance } = useAccounts();
    const { colors, theme } = useAppTheme();

    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('food');

    const activeCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const [selectedAccount, setSelectedAccount] = useState<string>('');

    React.useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts[0].id);
        }
    }, [accounts, selectedAccount]);
    const [date] = useState(new Date());
    const [location, setLocation] = useState('');
    const [locationCoords, setLocationCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [note, setNote] = useState('');
    const [mapVisible, setMapVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);
    const [successData, setSuccessData] = useState<SuccessModalData | null>(null);

    const webViewRef = useRef<WebView>(null);

    const handleSave = () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Missing Amount', 'Please enter a valid amount.');
            return;
        }

        const val = parseFloat(amount);

        const targetAcc = accounts.find(a => a.id === selectedAccount);
        if (!targetAcc) {
            Alert.alert('No Account Selected', 'Please select a wallet or account first.');
            return;
        }

        // Check for sufficient balance on expenses
        if (type === 'expense' && val > targetAcc.balance) {
            Alert.alert(
                'Insufficient Balance',
                `Your ${targetAcc.name} account only has ₱ ${targetAcc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}. Please cash in first or reduce the amount.`
            );
            return;
        }

        const newBalance = type === 'income'
            ? targetAcc.balance + val
            : targetAcc.balance - val;
        updateAccountBalance(targetAcc.id, newBalance).catch(err => console.error("Balance update failed", err));

        const catLabel = activeCategories.find(c => c.id === selectedCategory)?.name || selectedCategory;

        addTransaction({
            id: Date.now().toString(),
            type,
            amount: parseFloat(amount),
            category: selectedCategory,
            account: targetAcc.name,
            date,
            locationName: location,
            lat: locationCoords?.lat,
            lng: locationCoords?.lng,
            note
        });

        // Show the success modal
        setSuccessData({
            type,
            amount: val,
            category: selectedCategory,
            accountName: targetAcc.name,
            newBalance,
            note: note || undefined,
            actionLabel: `${catLabel} • ${type === 'income' ? 'Income' : 'Expense'}`,
        });
        setSuccessVisible(true);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const mapPickerHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
      <script src="https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.js"></script>
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css" rel="stylesheet" />
      <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.min.js"></script>
      <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css" type="text/css">
      <style>
        body { margin: 0; padding: 0; background-color: ${colors.background}; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
        .mapboxgl-ctrl-geocoder { 
            width: 92% !important; 
            max-width: none !important; 
            margin: 12px 4% !important; 
            border-radius: 14px; 
            background-color: rgba(40, 40, 40, 0.95) !important;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important; 
        }
        .mapboxgl-ctrl-geocoder--input {
            color: #FFFFFF !important;
            padding: 14px 12px 14px 48px !important;
            font-size: 15px !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        }
        .mapboxgl-ctrl-geocoder--icon-search {
            fill: #FFFFFF !important;
            opacity: 0.6;
            top: 14px !important;
            left: 16px !important;
            width: 20px !important;
            height: 20px !important;
        }
        .mapboxgl-ctrl-geocoder--button {
            background-color: transparent !important;
            top: 10px !important;
        }
        .mapboxgl-ctrl-geocoder--icon-close {
            fill: #FFFFFF !important;
            opacity: 0.6;
        }
        .mapboxgl-ctrl-geocoder .suggestions {
            background-color: ${colors.card} !important;
            border-radius: 12px !important;
            margin-top: 8px !important;
            border: 1px solid ${colors.border} !important;
            overflow: hidden !important;
        }
        .mapboxgl-ctrl-geocoder .suggestions > li > a {
            color: ${colors.text} !important;
            padding: 12px 16px !important;
        }
        .mapboxgl-ctrl-geocoder .suggestions > .active > a {
            background-color: ${colors.border} !important;
        }
        .center-marker {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 44px;
            height: 44px;
            margin-top: -44px; 
            margin-left: -22px;
            z-index: 1000;
            pointer-events: none;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="center-marker">
         <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="#007DFE" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="white"></circle>
         </svg>
      </div>
      <script>
        mapboxgl.accessToken = '${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}';
        
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/${theme === 'dark' ? 'dark-v11' : 'light-v11'}',
            center: [121.0244, 14.5547], // lng, lat
            zoom: 14,
            attributionControl: false
        });

        // Add search control
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            marker: false,
            placeholder: 'Search for a place...'
        });
        map.addControl(geocoder, 'top-left');

        // Add navigation and geolocate controls
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
        map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        }), 'bottom-right');

        // Update location on geocoder result
        geocoder.on('result', (e) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
                lat: e.result.center[1], 
                lng: e.result.center[0],
                address: e.result.text 
            }));
        });

        function confirmLocation() {
            var center = map.getCenter();
            
            // Format coords for Mapbox geocoding API (lng, lat)
            var url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + center.lng + ',' + center.lat + '.json?access_token=' + mapboxgl.accessToken + '&types=address,poi,neighborhood';
            
            fetch(url)
              .then(response => response.json())
              .then(data => {
                 var address = "Selected Location";
                 if(data.features && data.features.length > 0) {
                     address = data.features[0].text;
                 }
                 
                 window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    lat: center.lat, 
                    lng: center.lng,
                    address: address 
                 }));
              })
              .catch(err => {
                 window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    lat: center.lat, 
                    lng: center.lng,
                    address: "Custom Location" 
                 }));
              });
        }
      </script>
    </body>
    </html>
  `;

    const handleMapMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setLocation(data.address);
            setLocationCoords({ lat: data.lat, lng: data.lng });
            setMapVisible(false);
        } catch (error) {
            console.error("Error parsing map message:", error);
        }
    };

    const confirmMapSelection = () => {
        webViewRef.current?.injectJavaScript('confirmLocation();');
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <YStack flex={1} paddingTop={insets.top} backgroundColor={colors.background}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
                        <YStack alignItems="center" marginVertical={20}>
                            <Text fontSize={18} fontWeight="600" textTransform="uppercase" letterSpacing={2} color={colors.text}>
                                New Transaction
                            </Text>
                        </YStack>

                        <XStack marginHorizontal={24} borderRadius={12} padding={4} marginBottom={24} backgroundColor={colors.card}>
                            <YStack
                                flex={1} paddingVertical={10} alignItems="center" borderRadius={8}
                                backgroundColor={type === 'expense' ? colors.background : 'transparent'}
                                pressStyle={{ opacity: 0.7 }}
                                onPress={() => { setType('expense'); setSelectedCategory('food'); }}
                            >
                                <Text fontSize={14} fontWeight="600" color={type === 'expense' ? colors.text : 'rgba(128,128,128,0.5)'}>
                                    Expense
                                </Text>
                            </YStack>
                            <YStack
                                flex={1} paddingVertical={10} alignItems="center" borderRadius={8}
                                backgroundColor={type === 'income' ? colors.background : 'transparent'}
                                pressStyle={{ opacity: 0.7 }}
                                onPress={() => { setType('income'); setSelectedCategory('salary'); }}
                            >
                                <Text fontSize={14} fontWeight="600" color={type === 'income' ? colors.text : 'rgba(128,128,128,0.5)'}>
                                    Income
                                </Text>
                            </YStack>
                        </XStack>

                        {/* Wrapper for fields */}
                        <YStack marginBottom={32}>

                            <Animated.View entering={FadeInDown.delay(100)}>
                                <YStack alignItems="center" marginBottom={32}>
                                    <Text fontSize={12} marginBottom={8} textTransform="uppercase" color={colors.textSecondary}>
                                        Enter Amount
                                    </Text>
                                    <XStack alignItems="center" justifyContent="center">
                                        <Text fontSize={32} fontWeight="700" marginRight={4} color={type === 'expense' ? '#FF5252' : '#4CAF50'}>
                                            ₱
                                        </Text>
                                        <Input
                                            unstyled
                                            fontSize={48}
                                            fontWeight="700"
                                            minWidth={100}
                                            textAlign="center"
                                            paddingVertical={0}
                                            color={(type === 'expense' ? colors.danger : colors.activeToggle) as any}
                                            placeholder="0.00"
                                            placeholderTextColor={type === 'expense' ? colors.dangerBg : 'rgba(76, 175, 80, 0.3)'}
                                            keyboardType="numeric"
                                            value={amount}
                                            onChangeText={setAmount}
                                            autoFocus
                                        />
                                    </XStack>
                                </YStack>
                            </Animated.View>

                            <Animated.View entering={FadeInUp.delay(200)}>
                                <YStack paddingHorizontal={24}>

                                    <YStack marginBottom={24}>
                                        <Text fontSize={14} marginBottom={12} fontWeight="500" color={colors.textSecondary}>
                                            Wallet / Account
                                        </Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                                            {accounts.length === 0 ? (
                                                <Text color={colors.textSecondary} fontStyle="italic">No accounts found</Text>
                                            ) : accounts.map((acc) => (
                                                <XStack
                                                    key={acc.id}
                                                    alignItems="center" paddingHorizontal={16} paddingVertical={10}
                                                    borderRadius={20} borderWidth={1} gap={8}
                                                    backgroundColor={selectedAccount === acc.id ? colors.text : colors.card}
                                                    borderColor={colors.border}
                                                    pressStyle={{ opacity: 0.7 }}
                                                    onPress={() => setSelectedAccount(acc.id)}
                                                >
                                                    <Feather name={acc.icon as any} size={16} color={selectedAccount === acc.id ? colors.background : colors.textSecondary} />
                                                    <Text fontSize={14} fontWeight="500" color={selectedAccount === acc.id ? colors.background : colors.textSecondary}>
                                                        {acc.name}
                                                    </Text>
                                                </XStack>
                                            ))}
                                        </ScrollView>
                                    </YStack>

                                    <YStack marginBottom={24}>
                                        <Text fontSize={14} marginBottom={12} fontWeight="500" color={colors.textSecondary}>
                                            Category
                                        </Text>
                                        <XStack flexWrap="wrap" gap={8} justifyContent="space-between">
                                            {activeCategories.map((cat) => (
                                                <YStack
                                                    key={cat.id}
                                                    width="22.5%"
                                                    paddingVertical={12}
                                                    borderRadius={16}
                                                    alignItems="center" justifyContent="center" gap={6}
                                                    backgroundColor={selectedCategory === cat.id ? cat.color : colors.card}
                                                    scale={selectedCategory === cat.id ? 1.05 : 1}
                                                    pressStyle={{ opacity: 0.7 }}
                                                    onPress={() => setSelectedCategory(cat.id)}
                                                >
                                                    <Feather name={cat.icon as any} size={20} color={selectedCategory === cat.id ? '#FFF' : cat.color} />
                                                    <Text fontSize={11} fontWeight="600" color={selectedCategory === cat.id ? '#FFF' : colors.textSecondary}>
                                                        {cat.name}
                                                    </Text>
                                                </YStack>
                                            ))}
                                        </XStack>
                                    </YStack>

                                    <XStack marginBottom={24}>
                                        <YStack flex={1} marginRight={12}>
                                            <Text fontSize={14} marginBottom={12} fontWeight="500" color={colors.textSecondary}>
                                                Date
                                            </Text>
                                            <XStack alignItems="center" height={56} paddingHorizontal={16} borderRadius={16} gap={8} backgroundColor={colors.card}>
                                                <Feather name="calendar" size={16} color={colors.textSecondary} />
                                                <Text fontSize={14} fontWeight="500" color={colors.text}>{formatDate(date)}</Text>
                                            </XStack>
                                        </YStack>
                                        <YStack flex={1}>
                                            <Text fontSize={14} marginBottom={12} fontWeight="500" color={colors.textSecondary}>
                                                Location
                                            </Text>
                                            <XStack alignItems="center" height={56} paddingHorizontal={16} borderRadius={16} gap={8} backgroundColor={colors.card}>
                                                <YStack pressStyle={{ opacity: 0.7 }} onPress={() => setMapVisible(true)}>
                                                    <Feather name="map-pin" size={16} color={colors.activeToggle} />
                                                </YStack>
                                                <Input
                                                    unstyled
                                                    flex={1}
                                                    fontSize={14}
                                                    height="100%"
                                                    paddingVertical={0}
                                                    color={colors.text as any}
                                                    placeholder="Add location"
                                                    placeholderTextColor={colors.textSecondary}
                                                    value={location}
                                                    onChangeText={setLocation}
                                                />
                                            </XStack>
                                        </YStack>
                                    </XStack>

                                    <YStack marginBottom={24}>
                                        <Text fontSize={14} marginBottom={12} fontWeight="500" color={colors.textSecondary}>
                                            Note (Optional)
                                        </Text>
                                        <Input
                                            borderRadius={16}
                                            height={56}
                                            paddingHorizontal={16}
                                            paddingVertical={0}
                                            fontSize={16}
                                            backgroundColor={colors.card as any}
                                            color={colors.text as any}
                                            placeholder="e.g. Lunch with team"
                                            placeholderTextColor={colors.textSecondary}
                                            value={note}
                                            onChangeText={setNote}
                                        />
                                    </YStack>

                                </YStack>
                            </Animated.View>

                            <Animated.View entering={SlideInDown.delay(500)}>
                                <YStack paddingHorizontal={24} marginTop={20} marginBottom={40}>
                                    <YStack pressStyle={{ opacity: 0.8 }} onPress={handleSave}>
                                        <LinearGradient
                                            colors={type === 'income' ? ['#4CAF50', '#2E7D32'] : ['#FF5252', '#C62828']}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, borderRadius: 24, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 }}
                                        >
                                            <Text fontSize={18} fontWeight="700" color="#FFF" letterSpacing={0.5}>
                                                Save Transaction
                                            </Text>
                                            <Feather name="check" size={24} color="#FFF" />
                                        </LinearGradient>
                                    </YStack>
                                </YStack>
                            </Animated.View>

                        </YStack>

                    </ScrollView>
                </KeyboardAvoidingView>

                <Modal
                    animationType="slide"
                    visible={mapVisible}
                    onRequestClose={() => setMapVisible(false)}
                >
                    <YStack flex={1} backgroundColor={colors.background}>
                        {/* Header */}
                        <YStack
                            paddingHorizontal={20}
                            paddingTop={insets.top + 4}
                            paddingBottom={14}
                            zIndex={10}
                            backgroundColor={colors.background}
                            borderBottomWidth={1}
                            borderBottomColor={colors.border}
                        >
                            <XStack justifyContent="space-between" alignItems="center">
                                <YStack>
                                    <Text fontSize={22} fontWeight="800" letterSpacing={-0.5} color={colors.text}>Pick Location</Text>
                                    <Text fontSize={13} color={colors.textSecondary} marginTop={2}>Move the map to place the pin</Text>
                                </YStack>
                                <YStack
                                    width={36} height={36}
                                    borderRadius={18}
                                    backgroundColor={colors.card}
                                    borderWidth={1}
                                    borderColor={colors.border}
                                    alignItems="center" justifyContent="center"
                                    pressStyle={{ opacity: 0.7, scale: 0.95 }}
                                    onPress={() => setMapVisible(false)}
                                >
                                    <Feather name="x" size={18} color={colors.text} />
                                </YStack>
                            </XStack>
                        </YStack>

                        <WebView
                            ref={webViewRef}
                            originWhitelist={['*']}
                            source={{ html: mapPickerHTML }}
                            style={{ flex: 1, backgroundColor: colors.background }}
                            onMessage={handleMapMessage}
                            javaScriptEnabled={true}
                        />

                        {/* Bottom Confirm Button */}
                        <YStack
                            position="absolute" bottom={0} left={0} right={0}
                            paddingHorizontal={20} paddingTop={16}
                            paddingBottom={insets.bottom > 0 ? insets.bottom + 8 : 28}
                            zIndex={100}
                            backgroundColor={theme === 'dark' ? 'rgba(22,22,22,0.92)' : 'rgba(255,255,255,0.92)'}
                            borderTopWidth={1}
                            borderTopColor={colors.border}
                        >
                            <YStack pressStyle={{ opacity: 0.85, scale: 0.98 }} onPress={confirmMapSelection}>
                                <LinearGradient
                                    colors={['#007DFE', '#0057B7']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                    style={{
                                        flexDirection: 'row',
                                        paddingVertical: 18,
                                        borderRadius: 20,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 10,
                                        shadowColor: '#007DFE',
                                        shadowOffset: { width: 0, height: 6 },
                                        shadowOpacity: 0.35,
                                        shadowRadius: 12,
                                        elevation: 10
                                    }}
                                >
                                    <Feather name="check-circle" size={20} color="#FFF" />
                                    <Text fontSize={17} fontWeight="700" color="#FFF" letterSpacing={0.3}>
                                        Confirm Location
                                    </Text>
                                </LinearGradient>
                            </YStack>
                        </YStack>
                    </YStack>
                </Modal>

                <TransactionSuccessModal
                    visible={successVisible}
                    data={successData}
                    onDone={() => {
                        setSuccessVisible(false);
                        setSuccessData(null);
                        setAmount('');
                        setNote('');
                        setLocation('');
                        setLocationCoords(null);
                        router.replace('/(tabs)');
                    }}
                />

            </YStack>
        </TouchableWithoutFeedback>
    );
}
