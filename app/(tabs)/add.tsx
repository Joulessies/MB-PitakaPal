import Feather from '@expo/vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAppTheme } from '../../context/ThemeContext';
import { useTransactions } from '../../context/TransactionContext';
import { useAccounts } from '../../context/AccountContext';

const CATEGORIES = [
    { id: 'food', name: 'Food', icon: 'coffee', color: '#FF7043' },
    { id: 'transport', name: 'Transport', icon: 'truck', color: '#42A5F5' },
    { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#EC407A' },
    { id: 'bills', name: 'Bills', icon: 'file-text', color: '#AB47BC' },
    { id: 'entertainment', name: 'Fun', icon: 'film', color: '#26C6DA' },
    { id: 'health', name: 'Health', icon: 'heart', color: '#EF5350' },
    { id: 'education', name: 'School', icon: 'book', color: '#FFA726' },
    { id: 'other', name: 'Other', icon: 'grid', color: '#78909C' },
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
    const [selectedAccount, setSelectedAccount] = useState<string>('');

    // Set default account when accounts are loaded
    React.useEffect(() => {
        if (accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts[0].id);
        }
    }, [accounts]);
    const [date, setDate] = useState(new Date());
    const [location, setLocation] = useState('');
    const [locationCoords, setLocationCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [note, setNote] = useState('');
    const [mapVisible, setMapVisible] = useState(false);

    const webViewRef = useRef<WebView>(null);

    const handleSave = () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Missing Amount', 'Please enter a valid amount.');
            return;
        }

        const val = parseFloat(amount);

        // Update Account Balance
        const targetAcc = accounts.find(a => a.id === selectedAccount);
        if (targetAcc) {
            const newBalance = type === 'income'
                ? targetAcc.balance + val
                : targetAcc.balance - val;

            // Fire and forget balance update (or await if critical)
            updateAccountBalance(targetAcc.id, newBalance).catch(err => console.error("Balance update failed", err));
        }

        addTransaction({
            id: Date.now().toString(),
            type,
            amount: parseFloat(amount),
            category: selectedCategory,
            account: targetAcc ? targetAcc.name : 'Unknown',
            date,
            locationName: location,
            lat: locationCoords?.lat,
            lng: locationCoords?.lng,
            note
        });

        Alert.alert('Success', 'Transaction saved successfully!', [
            {
                text: 'OK', onPress: () => {
                    setAmount('');
                    setNote('');
                    setLocation('');
                    setLocationCoords(null);
                    router.replace('/(tabs)/');
                }
            }
        ]);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const mapPickerHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: ${colors.background}; }
        #map { width: 100%; height: 100vh; }
        .center-marker {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 32px;
            height: 32px;
            margin-top: -32px; 
            margin-left: -16px;
            z-index: 1000;
            pointer-events: none;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="center-marker">
         <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#FF5252" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>
      </div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([14.5547, 121.0244], 15);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/${theme === 'dark' ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);

        function confirmLocation() {
            var center = map.getCenter();
            fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + center.lat + '&lon=' + center.lng)
              .then(response => response.json())
              .then(data => {
                 var address = data.display_name.split(',')[0];
                 if(!address) address = "Selected Location";
                 
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
            setLocation(data.address);
            setLocationCoords({ lat: data.lat, lng: data.lng });
            setMapVisible(false);
        } catch (e) {
            // ignore
        }
    };

    const confirmMapSelection = () => {
        webViewRef.current?.injectJavaScript('confirmLocation();');
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <Text style={[styles.headerTitle, { color: colors.text }]}>New Transaction</Text>
                        </View>

                        <View style={[styles.segmentedControl, { backgroundColor: colors.card }]}>
                            <TouchableOpacity
                                style={[styles.segmentBtn, type === 'expense' && { backgroundColor: colors.background, shadowColor: colors.text }]}
                                onPress={() => setType('expense')}
                            >
                                <Text style={[styles.segmentText, type === 'expense' && { color: colors.text }]}>Expense</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.segmentBtn, type === 'income' && { backgroundColor: colors.background, shadowColor: colors.text }]}
                                onPress={() => setType('income')}
                            >
                                <Text style={[styles.segmentText, type === 'income' && { color: colors.text }]}>Income</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Wrapper for fields to ensure visibility */}
                        <View style={{ marginBottom: 32 }}>

                            <Animated.View entering={FadeInDown.delay(100)} style={styles.amountCard}>
                                <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Enter Amount</Text>
                                <View style={styles.amountRow}>
                                    <Text style={[styles.currencySymbol, { color: type === 'expense' ? '#FF5252' : '#4CAF50' }]}>₱</Text>
                                    <TextInput
                                        style={[styles.amountInput, { color: type === 'expense' ? colors.danger : colors.activeToggle }]}
                                        placeholder="0.00"
                                        placeholderTextColor={type === 'expense' ? colors.dangerBg : 'rgba(76, 175, 80, 0.3)'}
                                        keyboardType="numeric"
                                        value={amount}
                                        onChangeText={setAmount}
                                        autoFocus
                                    />
                                </View>
                            </Animated.View>

                            <Animated.View entering={FadeInUp.delay(200)} style={styles.formContainer}>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Wallet / Account</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountList}>
                                        {accounts.length === 0 ? (
                                            <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>No accounts found</Text>
                                        ) : accounts.map((acc) => (
                                            <TouchableOpacity
                                                key={acc.id}
                                                style={[styles.accountChip, { backgroundColor: selectedAccount === acc.id ? colors.text : colors.card, borderColor: colors.border }]}
                                                onPress={() => setSelectedAccount(acc.id)}
                                            >
                                                <Feather name={acc.icon as any} size={16} color={selectedAccount === acc.id ? colors.background : colors.textSecondary} />
                                                <Text style={[styles.accountText, { color: selectedAccount === acc.id ? colors.background : colors.textSecondary }]}>{acc.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category</Text>
                                    <View style={styles.categoryGrid}>
                                        {CATEGORIES.map((cat) => (
                                            <TouchableOpacity
                                                key={cat.id}
                                                style={[styles.categoryItem, selectedCategory === cat.id && styles.activeCategoryItem, { backgroundColor: selectedCategory === cat.id ? cat.color : colors.card }]}
                                                onPress={() => setSelectedCategory(cat.id)}
                                            >
                                                <Feather name={cat.icon as any} size={18} color={selectedCategory === cat.id ? '#FFF' : cat.color} />
                                                <Text style={[styles.categoryText, { color: selectedCategory === cat.id ? '#FFF' : colors.textSecondary }]}>{cat.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date</Text>
                                        <TouchableOpacity style={[styles.dateInput, { backgroundColor: colors.card }]}>
                                            <Feather name="calendar" size={16} color={colors.textSecondary} />
                                            <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(date)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Location</Text>
                                        <View style={[styles.locationInputWrapper, { backgroundColor: colors.card }]}>
                                            <TouchableOpacity onPress={() => setMapVisible(true)}>
                                                <Feather name="map-pin" size={16} color={colors.activeToggle} />
                                            </TouchableOpacity>
                                            <TextInput
                                                style={[styles.locationInput, { color: colors.text }]}
                                                placeholder="Add location"
                                                placeholderTextColor={colors.textSecondary}
                                                value={location}
                                                onChangeText={setLocation}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Note (Optional)</Text>
                                    <TextInput
                                        style={[styles.noteInput, { backgroundColor: colors.card, color: colors.text }]}
                                        placeholder="e.g. Lunch with team"
                                        placeholderTextColor={colors.textSecondary}
                                        value={note}
                                        onChangeText={setNote}
                                    />
                                </View>

                            </Animated.View>

                            <Animated.View entering={SlideInDown.delay(500)} style={styles.footer}>
                                <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
                                    <LinearGradient
                                        colors={type === 'income' ? ['#4CAF50', '#2E7D32'] : ['#FF5252', '#C62828']}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                        style={styles.saveBtn}
                                    >
                                        <Text style={styles.saveBtnText}>Save Transaction</Text>
                                        <Feather name="check" size={24} color="#FFF" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </Animated.View>

                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>

                <Modal
                    animationType="slide"
                    visible={mapVisible}
                    onRequestClose={() => setMapVisible(false)}
                >
                    <View style={[styles.mapModalContainer, { backgroundColor: colors.background }]}>
                        <View style={[styles.mapHeader, { backgroundColor: colors.card }]}>
                            <Text style={[styles.mapTitle, { color: colors.text }]}>Pick Location</Text>
                            <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.closeMapBtn}>
                                <Feather name="x" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <WebView
                            ref={webViewRef}
                            originWhitelist={['*']}
                            source={{ html: mapPickerHTML }}
                            style={{ flex: 1, backgroundColor: colors.background }}
                            onMessage={handleMapMessage}
                            javaScriptEnabled={true}
                        />

                        <TouchableOpacity style={styles.confirmLocationBtn} onPress={confirmMapSelection}>
                            <Text style={styles.confirmLocationText}>Confirm Location</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>

            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 120 },
    header: { alignItems: 'center', marginVertical: 20 },
    headerTitle: { fontSize: 18, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2 },
    segmentedControl: { flexDirection: 'row', marginHorizontal: 24, borderRadius: 12, padding: 4, marginBottom: 24 },
    segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    activeSegment: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 2 },
    segmentText: { fontSize: 14, fontWeight: '600', color: 'rgba(128,128,128,0.5)' },
    activeSegmentText: {},
    amountCard: { alignItems: 'center', marginBottom: 32 },
    amountLabel: { fontSize: 12, marginBottom: 8, textTransform: 'uppercase' },
    amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    currencySymbol: { fontSize: 32, fontWeight: '700', marginRight: 4 },
    amountInput: { fontSize: 48, fontWeight: '700', minWidth: 100, textAlign: 'center' },
    formContainer: { paddingHorizontal: 24 },
    inputGroup: { marginBottom: 24 },
    inputLabel: { fontSize: 14, marginBottom: 12, fontWeight: '500' },
    row: { flexDirection: 'row' },
    accountList: { gap: 12 },
    accountChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, gap: 8 },
    activeAccountChip: {},
    accountText: { fontSize: 14, fontWeight: '500' },
    activeAccountText: {},
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    categoryItem: { width: '22%', aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 4 },
    activeCategoryItem: { transform: [{ scale: 1.05 }] },
    categoryText: { fontSize: 10, fontWeight: '500' },
    dateInput: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 8 },
    dateText: { fontSize: 14, fontWeight: '500' },
    locationInputWrapper: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 8 },
    locationInput: { flex: 1, fontSize: 14, padding: 0 },
    noteInput: { borderRadius: 16, padding: 16, fontSize: 16 },
    footer: { paddingHorizontal: 24, marginTop: 20, marginBottom: 40 },
    saveBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, borderRadius: 24, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
    saveBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF', letterSpacing: 0.5 },
    mapModalContainer: { flex: 1 },
    mapHeader: { paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
    mapTitle: { fontSize: 18, fontWeight: '700' },
    closeMapBtn: { padding: 4 },
    confirmLocationBtn: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: '#4CAF50', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    confirmLocationText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
