package com.instantpaycodepush

import android.util.Log

object CommonHelper {

    const val MAIN_LOG_TAG = "*IpayCodePush -> "

    const val WARNING_LOG = "WARNING_LOG"

    const val ERROR_LOG = "ERROR_LOG"

    fun logPrint(classTag:String, value: String?) {
        if (value == null) {
            return
        }

        val fullTagName = "$MAIN_LOG_TAG $classTag"

        Log.i(fullTagName, value)
    }

    fun logPrint(type:String,classTag:String, value: String?) {
        if (value == null) {
            return
        }

        val fullTagName = "$MAIN_LOG_TAG $classTag"

        if(type == "WARNING_LOG"){
            Log.i(fullTagName, value)
        } else if(type == "ERROR_LOG") {
            Log.e(fullTagName, value)
        }
        else{
            Log.i(fullTagName, value)
        }
    }
}
