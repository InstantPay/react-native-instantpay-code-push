import React, { useEffect, useState } from "react";
import { Button, Image, Modal, SafeAreaView, Text, View } from "react-native";
import { IpayCodePush, useIpayCodePushStore } from 'react-native-instantpay-code-push';

export const extractFormatDateFromUUIDv7 = (uuid: string) => {
    const timestampHex = uuid.split("-").join("").slice(0, 12);
    const timestamp = Number.parseInt(timestampHex, 16);

    const date = new Date(timestamp);
    const year = date.getFullYear().toString().slice(2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

function App() {

    const [bundleId, setBundleId] = useState<string | null>(null);

    useEffect(() => {
        const bundleId = IpayCodePush.getBundleId();
        setBundleId(bundleId);

        const getCrashHistory = IpayCodePush.getCrashHistory();
        console.log("Crash History:", getCrashHistory);

        console.log('dd',global.IpayCodePushGetBaseURL())

        //const clearCrashHistory = IpayCodePush.clearCrashHistory();
        //console.log("Clear Crash:", clearCrashHistory);

    }, []);

    const progress = useIpayCodePushStore((state) => state.progress);

    return (
        <SafeAreaView style={{flex:1}}>
            <Text>Babel {IpayCodePush.getBundleId()}</Text>
            <Text>Channel "{IpayCodePush.getChannel()}"</Text>
            <Text>App Version "{IpayCodePush.getAppVersion()}"</Text>

            <Text>{extractFormatDateFromUUIDv7(IpayCodePush.getBundleId())}</Text>
            <Text
                style={{
                marginVertical: 20,
                fontSize: 20,
                fontWeight: "bold",
                textAlign: "center",
                }}
            >
                IpayCodePush 0
            </Text>

            <Text
                style={{
                marginVertical: 20,
                fontSize: 20,
                fontWeight: "bold",
                textAlign: "center",
                }}
            >
                Update {Math.round(progress * 100)}%
            </Text>
            <Text
                style={{
                marginVertical: 20,
                fontSize: 20,
                fontWeight: "bold",
                textAlign: "center",
                }}
            >
                BundleId: {bundleId}
            </Text>

            <Image
                style={{
                width: 100,
                height: 100,
                }}
                source={require("./logo.png")}
                // source={require("./src/test/_image.png")}
            />

            <Button title="Reload" onPress={() => IpayCodePush.reload()} />
        </SafeAreaView>
    );
}

export default IpayCodePush.wrap({
    baseURL: "",
    updateStrategy: "appVersion", // or "fingerprint"
    updateMode: "auto",
    requestHeaders: {
    },
    onNotifyAppReady: (result) => {
        console.log("App ready notified:", result);
    },
    onError: (error) => { 
        // Handle other errors
        console.error("Update error:", error);
    },
    onUpdateProcessCompleted: ({ status, shouldForceUpdate, id, message }) => {
        console.log("Bundle updated:", status, shouldForceUpdate, id, message);
    },
    fallbackComponent: ({ progress, status }) => (
        <Modal transparent visible={true}>
            <View
                style={{
                flex: 1,
                padding: 20,
                borderRadius: 10,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                }}
            >
                {/* You can put a splash image here. */}

                <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
                {status === "UPDATING" ? "Updating..." : "Checking for Update..."}
                </Text>
                {progress > 0 ? (
                <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
                    {Math.round(progress * 100)}%
                </Text>
                ) : null}
            </View>
        </Modal>
    ),
})(App);