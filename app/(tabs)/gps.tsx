import Feather from '@expo/vector-icons/Feather';
import React, { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Text, XStack, YStack } from 'tamagui';
import { useAppTheme } from '../../context/ThemeContext';
import { useTransactions } from '../../context/TransactionContext';

export default function GpsScreen() {
    const insets = useSafeAreaInsets();
    const webViewRef = useRef<WebView>(null);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const [locationLabel, setLocationLabel] = useState('Locating...');
    const { transactions } = useTransactions();
    const { colors, theme } = useAppTheme();

    const locations = transactions
        .filter(t => t.lat && t.lng)
        .map(t => ({
            id: t.id,
            name: t.locationName || 'Unknown Location',
            amount: (t.type === 'expense' ? '-' : '+') + '₱' + t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            type: t.category,
            lat: t.lat,
            lng: t.lng,
            address: new Date(t.date).toLocaleDateString(),
            isExpense: t.type === 'expense'
        }));

    const currentSvgs = {
        default: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`,
        food: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
        shopping: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
        transport: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>`,
        bills: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`
    };

    const mapboxHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
      <link href="https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css" rel="stylesheet">
      <script src="https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: ${colors.background}; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
        
        .mapboxgl-popup-content { background: ${colors.card}; color: ${colors.text}; border-radius: 8px; border: 1px solid ${colors.border}; padding: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        .mapboxgl-popup-tip { border-top-color: ${colors.border} !important; border-bottom-color: ${colors.border} !important; }
        
        .custom-icon { 
            background: linear-gradient(135deg, #007DFE, #0057B7);
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            width: 36px;
            height: 36px;
            cursor: pointer;
        }
        .custom-icon svg {
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
        }
        .custom-icon.active {
            transform: scale(1.2);
            border-color: #4CAF50;
            background: linear-gradient(135deg, #43A047, #2E7D32);
            z-index: 10 !important;
        }
        .custom-icon.expense {
            background: linear-gradient(135deg, #FF5252, #D32F2F);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        mapboxgl.accessToken = '${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}';
        
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/${theme === 'dark' ? 'dark-v11' : 'light-v11'}',
            center: [121.0244, 14.5547], // lng, lat
            zoom: 14,
            attributionControl: false
        });

        // Add geolocate control to center on user's real location
        var geolocate = new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showUserHeading: true
        });
        map.addControl(geolocate, 'bottom-right');
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        // Reverse geocode the map center and send the label to React Native
        var geocodeTimeout = null;
        function updateLocationLabel() {
            clearTimeout(geocodeTimeout);
            geocodeTimeout = setTimeout(function() {
                var center = map.getCenter();
                var url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/' + center.lng + ',' + center.lat + '.json?access_token=' + mapboxgl.accessToken + '&types=place,locality,neighborhood&limit=1';
                fetch(url)
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        var label = 'Unknown Location';
                        if (data.features && data.features.length > 0) {
                            var f = data.features[0];
                            // e.g. "Makati City, Metro Manila, Philippines" → show top-level place
                            label = f.text;
                            if (f.context) {
                                var country = f.context.find(function(c) { return c.id.startsWith('country'); });
                                if (country) {
                                    label += ', ' + country.short_code.toUpperCase();
                                }
                            }
                        }
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'location_label', label: label }));
                    })
                    .catch(function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'location_label', label: 'Unknown Location' }));
                    });
            }, 400); // debounce 400ms
        }

        // Update label on initial load
        map.on('load', function() {
            updateLocationLabel();
            // Auto-trigger geolocate to center on user's position
            geolocate.trigger();
        });

        // Update label when user pans/zooms the map
        map.on('moveend', updateLocationLabel);

        var locations = ${JSON.stringify(locations)};
        var icons = ${JSON.stringify(currentSvgs)};
        var markers = {};
        var popups = {};

        locations.forEach(function(loc) {
           var svgContent = icons[loc.type] || icons['default'];
           var isExpense = loc.isExpense;
           
           // Create DOM element for the marker
           var el = document.createElement('div');
           el.className = 'custom-icon icon-' + loc.id + (isExpense ? ' expense' : '');
           el.innerHTML = svgContent;
           
           // Create Popup
           var popupContent = '<div style="text-align: center;">' +
                              '<div style="font-weight: bold; margin-bottom: 2px; color: ${colors.text}">' + loc.name + '</div>' +
                              '<div style="color: ' + (isExpense ? '${colors.danger}' : '#4CAF50') + '; font-weight: bold; font-size: 14px;">' + loc.amount + '</div>' +
                              '</div>';
                              
           var popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
               .setHTML(popupContent);
               
           popups[loc.id] = popup;

           // Add Marker to Map
           var marker = new mapboxgl.Marker(el)
               .setLngLat([loc.lng, loc.lat])
               .setPopup(popup)
               .addTo(map);
               
           // Handle click to communicate with React Native
           el.addEventListener('click', function(e) {
              e.stopPropagation();
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_click', ...loc }));
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
            map.flyTo({
                center: [lng, lat],
                zoom: 17,
                speed: 1.2,
                curve: 1,
                essential: true
            });
            highlightMarker(id);
            var marker = markers[id];
            var popup = popups[id];
            
            // Close all other popups
            Object.values(popups).forEach(p => p.remove());
            
            if (marker && popup) {
                marker.togglePopup();
            }
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
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'location_label') {
                setLocationLabel(data.label);
            } else if (data.type === 'marker_click') {
                setSelectedLocation(data);
            } else {
                // Legacy fallback for marker clicks without type
                setSelectedLocation(data);
            }
        } catch (_e) {
            // ignore
        }
    };

    return (
        <YStack flex={1}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: mapboxHTML }}
                style={{ flex: 1, backgroundColor: colors.background }}
                onMessage={onMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
            />

            <XStack
                position="absolute" top={0} left={0} right={0}
                paddingTop={insets.top + 20} paddingHorizontal={20}
                justifyContent="space-between" alignItems="center"
            >
                <Text fontSize={20} fontWeight="800" color="#FFF"
                    style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
                >
                    Spending Tracker
                </Text>
                <XStack
                    alignItems="center" paddingHorizontal={12} paddingVertical={6}
                    borderRadius={12} gap={6} borderWidth={1}
                    backgroundColor={colors.card} borderColor={colors.border}
                >
                    <Feather name="map-pin" size={12} color="#4CAF50" />
                    <Text fontSize={12} fontWeight="600" color="#4CAF50" numberOfLines={1}>{locationLabel}</Text>
                </XStack>
            </XStack>

            <YStack
                position="absolute" bottom={0} left={0} right={0}
                height="40%"
                borderTopLeftRadius={30} borderTopRightRadius={30}
                padding={24} paddingBottom={0}
                borderTopWidth={1} elevation={20}
                backgroundColor={theme === 'dark' ? 'rgba(22, 22, 22, 0.95)' : 'rgba(255, 255, 255, 0.95)'}
                borderTopColor={colors.border}
            >
                <YStack width={40} height={4} borderRadius={2} alignSelf="center" marginBottom={20} backgroundColor={colors.border} />
                <Text fontSize={16} fontWeight="700" marginBottom={16} color={colors.text}>
                    Nearby Transactions
                </Text>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {locations.map((loc, index) => (
                        <YStack key={loc.id} pressStyle={{ opacity: 0.7 }} onPress={() => focusLocation(loc)}>
                            <Animated.View entering={FadeInDown.delay(200 + index * 100)}>
                                <XStack
                                    alignItems="center" marginBottom={16}
                                    padding={12} borderRadius={12} borderWidth={1}
                                    borderColor={colors.border}
                                    backgroundColor={selectedLocation?.id === loc.id
                                        ? (theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)')
                                        : 'transparent'}
                                >
                                    <YStack
                                        width={40} height={40} borderRadius={20}
                                        alignItems="center" justifyContent="center" marginRight={12}
                                        backgroundColor={colors.border}
                                    >
                                        <Feather name={loc.type === 'food' ? 'coffee' : loc.type === 'shopping' ? 'shopping-bag' : 'grid' as any} size={20} color={colors.text} />
                                    </YStack>
                                    <YStack flex={1}>
                                        <Text fontSize={14} fontWeight="600" color={colors.text}>{loc.name}</Text>
                                        <Text fontSize={12} color={colors.textSecondary}>{loc.address}</Text>
                                    </YStack>
                                    <Text fontSize={14} fontWeight="700" color={loc.isExpense ? colors.danger : colors.activeToggle}>
                                        {loc.amount}
                                    </Text>
                                </XStack>
                            </Animated.View>
                        </YStack>
                    ))}
                </ScrollView>
            </YStack>
        </YStack>
    );
}
