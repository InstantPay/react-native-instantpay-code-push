package com.instantpaycodepush

/**
 * Exception class for Ipay Code Push errors
 * Matches error codes defined in packages/react-native/src/errors.ts
 */
class IpayCodePushException(
    val code: String,
    message: String,
    cause: Throwable? = null,
) : Exception(message, cause){

    companion object {
        // Parameter validation errors
        fun missingBundleId() =
            IpayCodePushException(
                "MISSING_BUNDLE_ID",
                "Missing or empty 'bundleId'",
            )

        fun invalidFileUrl() =
            IpayCodePushException(
                "INVALID_FILE_URL",
                "Invalid 'fileUrl' provided",
            )

        // Bundle storage errors
        fun directoryCreationFailed() =
            IpayCodePushException(
                "DIRECTORY_CREATION_FAILED",
                "Failed to create bundle directory",
            )

        fun downloadFailed(cause: Throwable? = null) =
            IpayCodePushException(
                "DOWNLOAD_FAILED",
                "Failed to download bundle",
                cause,
            )

        fun incompleteDownload(
            expectedSize: Long,
            actualSize: Long,
        ) = IpayCodePushException(
            "INCOMPLETE_DOWNLOAD",
            "Download incomplete: received $actualSize bytes, expected $expectedSize bytes",
        )

        fun extractionFormatError(cause: Throwable? = null) =
            IpayCodePushException(
                "EXTRACTION_FORMAT_ERROR",
                "Invalid or corrupted bundle archive format",
                cause,
            )

        fun invalidBundle() =
            IpayCodePushException(
                "INVALID_BUNDLE",
                "Bundle missing required platform files (index.ios.bundle or index.android.bundle)",
            )

        fun insufficientDiskSpace(
            required: Long,
            available: Long,
        ) = IpayCodePushException(
            "INSUFFICIENT_DISK_SPACE",
            "Insufficient disk space: need $required bytes, available $available bytes",
        )

        fun signatureVerificationFailed(cause: Throwable? = null) =
            IpayCodePushException(
                "SIGNATURE_VERIFICATION_FAILED",
                "Bundle signature verification failed",
                cause,
            )

        fun moveOperationFailed() =
            IpayCodePushException(
                "MOVE_OPERATION_FAILED",
                "Failed to move bundle files",
            )

        fun bundleInCrashedHistory(bundleId: String) =
            IpayCodePushException(
                "BUNDLE_IN_CRASHED_HISTORY",
                "Bundle '$bundleId' is in crashed history and cannot be applied",
            )

        // Signature verification errors
        fun publicKeyNotConfigured() =
            IpayCodePushException(
                "PUBLIC_KEY_NOT_CONFIGURED",
                "Public key not configured for signature verification",
            )

        fun invalidPublicKeyFormat() =
            IpayCodePushException(
                "INVALID_PUBLIC_KEY_FORMAT",
                "Invalid public key format",
            )

        fun fileHashMismatch() =
            IpayCodePushException(
                "FILE_HASH_MISMATCH",
                "File hash verification failed",
            )

        fun fileReadFailed() =
            IpayCodePushException(
                "FILE_READ_FAILED",
                "Failed to read file for verification",
            )

        fun unsignedNotAllowed() =
            IpayCodePushException(
                "UNSIGNED_NOT_ALLOWED",
                "Unsigned bundles are not allowed",
            )

        fun securityFrameworkError(cause: Throwable? = null) =
            IpayCodePushException(
                "SECURITY_FRAMEWORK_ERROR",
                "Security framework error occurred",
                cause,
            )

        // Internal errors
        fun unknownError(cause: Throwable? = null) =
            IpayCodePushException(
                "UNKNOWN_ERROR",
                "An unknown error occurred",
                cause,
            )
    }
}
