package com.instantpaycodepush

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

import android.os.Handler
import android.os.Looper


@ReactModule(name = InstantpayCodePushModule.NAME)
class InstantpayCodePushModule(reactContext: ReactApplicationContext) : NativeInstantpayCodePushSpec(reactContext) {

    private val mReactApplicationContext: ReactApplicationContext = reactContext

    // Managed coroutine scope for the module lifecycle
    private val moduleScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    companion object {
        const val NAME = "InstantpayCodePush"
        private const val CLASS_TAG = "*InstantpayCodePushModule"
    }

    override fun invalidate() {
        super.invalidate()
        // Cancel all ongoing coroutines when module is destroyed
        moduleScope.cancel()
    }

    /**
     * Gets the singleton IpayCodePushImpl instance
     */
    private fun getInstance(): IpayCodePushImpl = IpayCodePush.getInstance(mReactApplicationContext)

    override fun getName(): String {
        return NAME
    }

    override fun reload(promise: Promise) {
        moduleScope.launch {
            try {
                val impl = getInstance()
                val currentActivity = mReactApplicationContext.currentActivity
                impl.reload(currentActivity)
                promise.resolve(null)
            } catch (e: Exception) {
                CommonHelper.logPrint(CLASS_TAG, "Failed to reload $e",)
                promise.reject("reload", e)
            }
        }
    }

    override fun updateBundle(
        params: ReadableMap,
        promise: Promise,
    ) {
        moduleScope.launch {
            try {
                val bundleId = params.getString("bundleId")
                if (bundleId == null || bundleId.isEmpty()) {
                    promise.reject("MISSING_BUNDLE_ID", "Missing or empty 'bundleId'")
                    return@launch
                }

                val fileUrl = params.getString("fileUrl")

                // Validate fileUrl format if provided
                if (fileUrl != null && fileUrl.isNotEmpty()) {
                    try {
                        java.net.URL(fileUrl)
                    } catch (e: java.net.MalformedURLException) {
                        promise.reject("INVALID_FILE_URL", "Invalid 'fileUrl' provided: $fileUrl")
                        return@launch
                    }
                }

                val fileHash = params.getString("fileHash")

                val impl = getInstance()

                impl.updateBundle(
                    bundleId,
                    fileUrl,
                    fileHash,
                ) { progress ->
                    // Post to Main thread for React Native event emission
                    Handler(Looper.getMainLooper()).post {
                        try {
                            val progressParams =
                                WritableNativeMap().apply {
                                    putDouble("progress", progress)
                                }

                            this@InstantpayCodePushModule
                                .mReactApplicationContext
                                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                                ?.emit("onProgress", progressParams)
                        } catch (e: Exception) {
                            CommonHelper.logPrint(CommonHelper.WARNING_LOG,CLASS_TAG, "Failed to emit progress (bridge may be unavailable): ${e.message}")
                        }
                    }
                }
                promise.resolve(true)
            } catch (e: IpayCodePushException) {
                CommonHelper.logPrint(CommonHelper.ERROR_LOG,CLASS_TAG, "Catch IpayCodePushException: ${e.message}")
                promise.reject(e.code, e.message)
            } catch (e: Exception) {
                CommonHelper.logPrint(CommonHelper.ERROR_LOG,CLASS_TAG, "Catch Exception: ${e.message}")
                promise.reject("UNKNOWN_ERROR", e.message ?: "An unknown error occurred")
            }
        }
    }

    override fun getTypedExportedConstants(): Map<String, Any?> {
        val constants: MutableMap<String, Any?> = HashMap()
        constants["MIN_BUNDLE_ID"] = IpayCodePush.getMinBundleId()
        constants["APP_VERSION"] = IpayCodePush.getAppVersion(mReactApplicationContext)
        constants["CHANNEL"] = IpayCodePush.getChannel(mReactApplicationContext)
        constants["FINGERPRINT_HASH"] = IpayCodePush.getFingerprintHash(mReactApplicationContext)
        return constants
    }

    override fun addListener(
        @Suppress("UNUSED_PARAMETER") eventName: String?,
    ) {
        // No-op
    }

    override fun removeListeners(
        @Suppress("UNUSED_PARAMETER") count: Double,
    ) {
        // No-op
    }

    override fun notifyAppReady(params: ReadableMap): WritableNativeMap {
        val result = WritableNativeMap()
        val bundleId = params.getString("bundleId")
        if (bundleId == null) {
            result.putString("status", "STABLE")
            return result
        }

        val impl = getInstance()
        val statusMap = impl.notifyAppReady(bundleId)

        result.putString("status", statusMap["status"] as? String ?: "STABLE")
        statusMap["crashedBundleId"]?.let {
            result.putString("crashedBundleId", it as String)
        }

        return result
    }

    override fun getCrashHistory(): WritableNativeArray {
        val impl = getInstance()
        val crashHistory = impl.getCrashHistory()
        val result = WritableNativeArray()
        crashHistory.forEach { result.pushString(it) }
        return result
    }

    override fun clearCrashHistory(): Boolean {
        val impl = getInstance()
        return impl.clearCrashHistory()
    }

    override fun getBaseURL(): String {
        val impl = getInstance()
        return impl.getBaseURL()
    }

}
