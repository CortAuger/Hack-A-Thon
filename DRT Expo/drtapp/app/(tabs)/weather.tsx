import React from "react";
import { View, Text, StyleSheet, Image, StatusBar } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyWebView() {
    return (
        <SafeAreaView style={styles.safeContainer}>
            {/* WebView */}
            <View style={styles.container}>
                <WebView source={{ uri: "http://10.160.31.227:3000/weather" }} />
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
