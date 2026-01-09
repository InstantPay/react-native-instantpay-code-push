package com.instantpaycodepush

import android.app.Activity
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext

class IpayCodePush {

    companion object{

        @Volatile
        private var instance: IpayCodePushImpl? = null

        /**
         * Gets or creates the singleton instance
         * Thread-safe double-checked locking
         * @param context Application context
         * @return The singleton IpayCodePushImpl instance
         */
        fun getInstance(context: Context): IpayCodePushImpl =
            instance ?: synchronized(this){
                instance ?: IpayCodePushImpl(context.applicationContext).also {
                    instance = it
                }
            }

        /**
         * Gets the JS bundle file path using the default singleton instance
         * @param context Application context
         * @return The path to the bundle file
         */
        fun getJSBundleFile(context: Context): String = getInstance(context).getJSBundleFile()

        /**
         * Updates the bundle using the default singleton instance
         * @param context Application context
         * @param bundleId ID of the bundle to update
         * @param fileUrl URL of the bundle file to download (or null to reset)
         * @param fileHash Combined hash string for verification (sig:<signature> or <hex_hash>)
         * @param progressCallback Callback for download progress updates
         * @throws IpayCodePushException if the update fails
         */
        suspend fun updateBundle(
            context: Context,
            bundleId: String,
            fileUrl: String?,
            fileHash: String?,
            progressCallback: (Double) -> Unit,
        ) {
            getInstance(context).updateBundle(bundleId, fileUrl, fileHash, progressCallback)
        }

        /**
         * Reloads the React Native application using the default singleton instance
         * @param context Application context
         */
        suspend fun reload(context: Context) {
            val currentActivity = getCurrentActivity(context)
            getInstance(context).reload(currentActivity)
        }

        /**
         * Gets the app version - delegates to IpayCodePushImpl static method
         * @param context Application context
         * @return App version name or null if not available
         */
        fun getAppVersion(context: Context): String? = IpayCodePushImpl.getAppVersion(context)

        /**
         * Gets the minimum bundle ID - delegates to IpayCodePushImpl static method
         * @return The minimum bundle ID string
         */
        fun getMinBundleId(): String = IpayCodePushImpl.getMinBundleId()

        /**
         * Gets the current fingerprint hash - delegates to IpayCodePushImpl static method
         * @param context Application context
         * @return The fingerprint hash or null if not set
         */
        fun getFingerprintHash(context: Context): String? = IpayCodePushImpl.getFingerprintHash(context)

        /**
         * Gets the current update channel - delegates to IpayCodePushImpl static method
         * @param context Application context
         * @return The channel name or null if not set
         */
        fun getChannel(context: Context): String = IpayCodePushImpl.getChannel(context)

        /**
         * Gets the current activity from ReactApplicationContext
         * @param context Context that might be a ReactApplicationContext
         * @return The current activity or null
         */
        private fun getCurrentActivity(context: Context): Activity? =
            if (context is ReactApplicationContext) {
                context.currentActivity
            } else {
                null
            }
    }
}
