# react-native-instantpay-code-push

IpayCodePush is a self-hosted Over-The-Air (OTA) update solution for React Native applications. It allows you to instantly deploy JavaScript bundle updates to users without submitting new builds to the app stores, helping you fix bugs and ship improvements faster.

## Installation


```sh
npm install react-native-instantpay-code-push
```


## Usage


```js
import { IpayCodePush } from 'react-native-instantpay-code-push';

function App() {
    return (
        <View>
            <Text>Instantpay IpayCodePush</Text>
        </View>
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

```

## Configuration for Android

For React Native 0.82 and above, modify your ```MainApplication.kt```:

```
import com.instantpaycodepush.IpayCodePush //👈 import this package

class MainApplication : Application(), ReactApplication {
    ....

    override val reactHost: ReactHost by lazy {
        getDefaultReactHost(
            context = applicationContext,
        packageList =
            PackageList(this).packages.apply {
                
            },
            jsBundleFilePath = HotUpdater.getJSBundleFile(applicationContext), //👈 add this line
        )
    }

    override fun onCreate() {
        super.onCreate()
        loadReactNative(this)
    }

    ....
}
```

For others React Native version , modify your ```MainApplication.kt```:

```
import com.instantpaycodepush.IpayCodePush //👈 import this package

class MainApplication : Application(), ReactApplication {
    .....
    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            
            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED

            override fun getJSBundleFile(): String? { //👈 add this method
                return IpayCodePush.getJSBundleFile(applicationContext)
            }
        }
    .....
}

```

## Configuration for iOS

Open modify your ```AppDelegate.swift:```

```
import IpayCodePush //👈 import this package

@main
class AppDelegate: RCTAppDelegate {
    ....
    
    override func bundleURL() -> URL? {
        #if DEBUG
            RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
            Bundle.main.url(forResource: "main", withExtension: "jsbundle") //❌ remove this
            IpayCodePush.bundleURL()  //👈 add this
        #endif
    }

    ....

}

```



## License

MIT

---

Created By [Instantpay](https://www.instantpay.in)
