import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform, PermissionsAndroid } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

export default function MyWebView() {
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        const requestPermissions = async () => {
            if (Platform.OS === "android") {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
            } else {
                const { status } = await Location.requestForegroundPermissionsAsync();
                setHasPermission(status === "granted");
            }
        };

        requestPermissions();
    }, []);

    if (!hasPermission) {
        return (
            <SafeAreaView style={styles.safeContainer}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>
                        Location permission is required to use this feature.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.container}>
                <WebView
                    source={{ uri: "http://10.160.31.227:3000/stops" }}
                    geolocationEnabled={true}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    originWhitelist={['*']}
                    allowsBackForwardNavigationGestures={true}
                    mediaPlaybackRequiresUserAction={false}
                    onMessage={(event) => {
                        console.log('Message from WebView:', event.nativeEvent.data);
                    }}
                    androidHardwareAccelerationDisabled={false}
                    onGeolocationPermissionsShowPrompt={() => Promise.resolve(true)}
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
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    permissionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    permissionText: {
        fontSize: 16,
        color: "#fff",
        textAlign: "center",
    },
});
