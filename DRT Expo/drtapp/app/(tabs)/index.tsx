import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, StatusBar, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from 'expo-location';

export default function MyWebView() {
    const [locationPermission, setLocationPermission] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    "Permission Denied",
                    "Please enable location permissions to use all features.",
                    [{ text: "OK" }]
                );
            }
            setLocationPermission(status === 'granted');
        })();
    }, []);

    return (
        <SafeAreaView style={styles.safeContainer}>
            {/* WebView */}
            <View style={styles.container}>
                <WebView
                    source={{ uri: "http://10.160.31.227:3000/search" }}
                    geolocationEnabled={locationPermission}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    originWhitelist={['*']}
                    allowsBackForwardNavigationGestures={true}
                    mediaPlaybackRequiresUserAction={false}
                    onMessage={(event) => {
                        console.log('Message from WebView:', event.nativeEvent.data);
                    }}
                    androidHardwareAccelerationDisabled={false}
                    onGeolocationPermissionsShowPrompt={() => Promise.resolve(locationPermission)}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: "#226a37",
    },
    titleBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 60,
        backgroundColor: "#226a37",
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#fff",
    },
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
});
