import Feather from '@expo/vector-icons/Feather';
import React, { useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAppTheme } from '../../context/ThemeContext';
import { useTransactions } from '../../context/TransactionContext';

const { width } = Dimensions.get('window');

export default function GpsScreen() {
    const insets = useSafeAreaInsets();
    const webViewRef = useRef<WebView>(null);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const { transactions } = useTransactions();
    const { colors, theme } = useAppTheme();

    // Filter only transactions that have valid coordinates
    const locations = transactions
        .filter(t => t.lat && t.lng)
        .map(t => ({
            id: t.id,
            name: t.locationName || 'Unknown Location',
            amount: (t.type === 'expense' ? '-' : '+') + '₱' + t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            type: t.category, // e.g. 'food' -> 'coffee' icon mapping needs to be handled
            lat: t.lat,
            lng: t.lng,
            address: new Date(t.date).toLocaleDateString(),
            isExpense: t.type === 'expense'
        }));

    // Define SVGs for the map icons mapping
    const currentSvgs = {
        default: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`,
        food: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
        shopping: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
        transport: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`,
        bills: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    };

    const leafletHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: ${colors.background}; }
        #map { width: 100%; height: 100vh; }
        .leaflet-popup-content-wrapper { background: ${colors.card}; color: ${colors.text}; border-radius: 8px; border: 1px solid ${colors.border}; }
        .leaflet-popup-tip { background: ${colors.card}; border: 1px solid ${colors.border}; border-top: none; border-left: none; }
        
        .custom-icon { 
            background: linear-gradient(135deg, #007DFE, #0057B7);
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        .custom-icon svg {
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
        }
        .custom-icon.active {
            transform: scale(1.2);
            border-color: #4CAF50;
            background: linear-gradient(135deg, #43A047, #2E7D32);
        }
        .custom-icon.expense {
            background: linear-gradient(135deg, #FF5252, #D32F2F);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([14.5547, 121.0244], 14);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/${theme === 'dark' ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19
        }).addTo(map);

        var locations = ${JSON.stringify(locations)};
        var icons = ${JSON.stringify(currentSvgs)};
        var markers = {};

        locations.forEach(function(loc) {
           var svgContent = icons[loc.type] || icons['default'];
           var isExpense = loc.isExpense;
           
           var customIcon = L.divIcon({
              className: 'custom-icon icon-' + loc.id + (isExpense ? ' expense' : ''),
              iconSize: [36, 36],
              iconAnchor: [18, 18],
              popupAnchor: [0, -10],
              html: svgContent
           });

           var marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);
           
           var popupContent = '<div style="text-align: center;">' +
                              '<div style="font-weight: bold; margin-bottom: 2px; color: ${colors.text}">' + loc.name + '</div>' +
                              '<div style="color: ' + (isExpense ? '${colors.danger}' : '#4CAF50') + '; font-weight: bold; font-size: 14px;">' + loc.amount + '</div>' +
                              '</div>';

           marker.bindPopup(popupContent);
           
           marker.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify(loc));
              highlightMarker(loc.id);
           });
           
           markers[loc.id] = marker;
        });

        function highlightMarker(id) {
            document.querySelectorAll('.custom-icon').forEach(el => el.classList.remove('active'));
            var el = document.querySelector('.icon-' + id);
            if (el) el.classList.add('active');
        }

        function flyToLocation(lat, lng, id) {
            map.flyTo([lat, lng], 17, { animate: true, duration: 1.0 });
            highlightMarker(id);
            var marker = markers[id];
            if (marker) marker.openPopup();
        }
      </script>
    </body>
    </html>
  `;

    const focusLocation = (loc: any) => {
        setSelectedLocation(loc);
        webViewRef.current?.injectJavaScript(`flyToLocation(${loc.lat}, ${loc.lng}, "${loc.id}")`);
    };

    const onMessage = (event: any) => {
        try {
            const loc = JSON.parse(event.nativeEvent.data);
            setSelectedLocation(loc);
        } catch (e) {
            // ignore
        }
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: leafletHTML }}
                style={[styles.map, { backgroundColor: colors.background }]}
                onMessage={onMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />

            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <Text style={styles.headerTitle}>Spending Tracker</Text>
                <View style={[styles.locationBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name="map-pin" size={12} color="#4CAF50" />
                    <Text style={styles.locationText}>Makati City, PH</Text>
                </View>
            </View>

            <View style={[styles.bottomSheet, { backgroundColor: theme === 'dark' ? 'rgba(22, 22, 22, 0.95)' : 'rgba(255, 255, 255, 0.95)', borderTopColor: colors.border }]}>
                <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Nearby Transactions</Text>

                <Animated.ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {locations.map((loc, index) => (
                        <TouchableOpacity key={loc.id} onPress={() => focusLocation(loc)}>
                            <Animated.View entering={FadeInDown.delay(200 + index * 100)} style={[
                                styles.locationItem,
                                { borderColor: colors.border, backgroundColor: 'transparent' },
                                selectedLocation?.id === loc.id && { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', borderColor: colors.border }
                            ]}>
                                <View style={[styles.locationIcon, { backgroundColor: colors.border }]}>
                                    <Feather name={loc.type === 'food' ? 'coffee' : loc.type === 'shopping' ? 'shopping-bag' : 'grid' as any} size={20} color={colors.text} />
                                </View>
                                <View style={styles.locationInfo}>
                                    <Text style={[styles.locationName, { color: colors.text }]}>{loc.name}</Text>
                                    <Text style={[styles.locationDate, { color: colors.textSecondary }]}>{loc.address}</Text>
                                </View>
                                <Text style={[styles.locationAmount, { color: loc.isExpense ? colors.danger : colors.activeToggle }]}>{loc.amount}</Text>
                            </Animated.View>
                        </TouchableOpacity>
                    ))}
                </Animated.ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    header: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
    locationBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6, borderWidth: 1 },
    locationText: { fontSize: 12, fontWeight: '600', color: '#4CAF50' },
    bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, paddingBottom: 0, borderTopWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 20 },
    dragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
    locationItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, padding: 12, borderRadius: 12, borderWidth: 1 },
    locationIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    locationInfo: { flex: 1 },
    locationName: { fontSize: 14, fontWeight: '600' },
    locationDate: { fontSize: 12 },
    locationAmount: { fontSize: 14, fontWeight: '700' },
});
