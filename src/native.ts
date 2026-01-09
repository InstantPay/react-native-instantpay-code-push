import { NativeEventEmitter } from "react-native";
import { IpayCodePushErrorCode, isIpayCodePushError } from "./error";
import type { UpdateStatus } from "./types"

import IpayCodePushNative, {
    type UpdateBundleParams
} from './NativeInstantpayCodePush';


export { IpayCodePushErrorCode, isIpayCodePushError };

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

declare const __IPAY_CODE_PUSH_BUNDLE_ID: string | undefined;

export const IpayCodePushConstants = {
    IPAY_CODE_PUSH_BUNDLE_ID: __IPAY_CODE_PUSH_BUNDLE_ID || NIL_UUID,
};

export type IpayCodePushEvent = {
    onProgress: {
        progress: number;
    };
};


export const addListener = <T extends keyof IpayCodePushEvent>(
    eventName: T,
    listener: (event: any) => void, //(event: IpayCodePushEvent[T])
) => {
    const eventEmitter = new NativeEventEmitter(IpayCodePushNative);
    const subscription = eventEmitter.addListener(eventName, listener);

    return () => {
        subscription.remove();
    };
};

export type UpdateParams = UpdateBundleParams & {
    status: UpdateStatus;
};

// In-flight update deduplication by bundleId (session-scoped).
const inflightUpdates = new Map<string, Promise<boolean>>();

// Tracks the last successfully installed bundleId for this session.
let lastInstalledBundleId: string | null = null;

/**
 * Downloads files and applies them to the app.
 *
 * @param {UpdateParams} params - Parameters object required for bundle update
 * @returns {Promise<boolean>} Resolves with true if download was successful
 * @throws {Error} Rejects with error.code from HotUpdaterErrorCode enum and error.message
 */
export async function updateBundle(params: UpdateParams): Promise<boolean>;

/**
 * @deprecated Use updateBundle(params: UpdateBundleParamsWithStatus) instead
 */
export async function updateBundle(
    bundleId: string,
    fileUrl: string | null,
): Promise<boolean>;

export async function updateBundle(
    paramsOrBundleId: UpdateParams | string,
    fileUrl?: string | null,
): Promise<boolean> {

    const updateBundleId = typeof paramsOrBundleId === "string" ? paramsOrBundleId : paramsOrBundleId.bundleId;

    const status = typeof paramsOrBundleId === "string" ? "UPDATE" : paramsOrBundleId.status;

    // If we have already installed this bundle in this session, skip re-download.
    if (status === "UPDATE" && lastInstalledBundleId === updateBundleId) {
        return true;
    }

    const currentBundleId = getBundleId();

    // updateBundleId <= currentBundleId
    if (
        status === "UPDATE" &&
        updateBundleId.localeCompare(currentBundleId) <= 0
    ) {
        throw new Error(
            "Update bundle id is the same as the current bundle id. Preventing infinite update loop.",
        );
    }

    // In-flight guard: return the same promise if the same bundle is already updating.
    const existing = inflightUpdates.get(updateBundleId);
    if (existing) return existing;

    const targetFileUrl = typeof paramsOrBundleId === "string" ? (fileUrl ?? null) : paramsOrBundleId.fileUrl;

    const targetFileHash = typeof paramsOrBundleId === "string" ? undefined : paramsOrBundleId.fileHash;

    const promise = (async () => {
        try {
            const ok = await IpayCodePushNative.updateBundle({
                bundleId: updateBundleId,
                fileUrl: targetFileUrl,
                fileHash: targetFileHash ?? null,
            });

            if (ok) {
                lastInstalledBundleId = updateBundleId;
            }

            return ok;

        } finally {
            inflightUpdates.delete(updateBundleId);
        }
    })();

    inflightUpdates.set(updateBundleId, promise);
    return promise;
}

/**
 * Fetches the current app version.
 */
export const getAppVersion = (): string | null => {
    const constants = IpayCodePushNative.getConstants();
    return constants?.APP_VERSION ?? null;
};

/**
 * Reloads the app.
 */
export const reload = async () => {
    await IpayCodePushNative.reload();
};

/**
 * Fetches the minimum bundle id, which represents the initial bundle of the app
 * since it is created at build time.
 *
 * @returns {string} Resolves with the minimum bundle id or null if not available.
 */
export const getMinBundleId = (): string => {
    const constants = IpayCodePushNative.getConstants();
    return constants.MIN_BUNDLE_ID;
};

/**
 * Fetches the current bundle version id.
 *
 * @async
 * @returns {string} Resolves with the current version id or null if not available.
 */
export const getBundleId = (): string => {
  return IpayCodePushConstants.IPAY_CODE_PUSH_BUNDLE_ID === NIL_UUID
    ? getMinBundleId()
    : IpayCodePushConstants.IPAY_CODE_PUSH_BUNDLE_ID;
};

/**
 * Fetches the channel for the app.
 *
 * @returns {string} Resolves with the channel or null if not available.
 */
export const getChannel = (): string => {
    const constants = IpayCodePushNative.getConstants();
    return constants.CHANNEL;
};

/**
 * Fetches the fingerprint for the app.
 *
 * @returns {string | null} Resolves with the fingerprint hash
 */
export const getFingerprintHash = (): string | null => {
    const constants = IpayCodePushNative.getConstants();
    return constants.FINGERPRINT_HASH;
};

/**
 * Result returned by notifyAppReady()
 * - `status: "PROMOTED"` - Staging bundle was promoted to stable (ACTIVE event)
 * - `status: "RECOVERED"` - App recovered from crash, rollback occurred (ROLLBACK event)
 * - `status: "STABLE"` - No changes, already stable
 * - `crashedBundleId` - Present only when status is "RECOVERED"
 */
export type NotifyAppReadyResult = {
    status: "PROMOTED" | "RECOVERED" | "STABLE";
    crashedBundleId?: string;
};

/**
 * Notifies the native side that the app has successfully started with the current bundle.
 * If the bundle matches the staging bundle, it promotes to stable.
 *
 * This function is called automatically when the module loads.
 *
 * @returns {NotifyAppReadyResult} Bundle state information
 * - `status: "PROMOTED"` - Staging bundle was promoted to stable (ACTIVE event)
 * - `status: "RECOVERED"` - App recovered from crash, rollback occurred (ROLLBACK event)
 * - `status: "STABLE"` - No changes, already stable
 * - `crashedBundleId` - Present only when status is "RECOVERED"
 *
 * @example
 * ```ts
 * const result = IpayCodePush.notifyAppReady();
 *
 * switch (result.status) {
 *   case "PROMOTED":
 *     // Send ACTIVE analytics event
 *     analytics.track('bundle_active', { bundleId: IpayCodePush.getBundleId() });
 *     break;
 *   case "RECOVERED":
 *     // Send ROLLBACK analytics event
 *     analytics.track('bundle_rollback', { crashedBundleId: result.crashedBundleId });
 *     break;
 *   case "STABLE":
 *     // No special action needed
 *     break;
 * }
 * ```
 */
export const notifyAppReady = (): NotifyAppReadyResult => {
    const bundleId = getBundleId();
    const result = IpayCodePushNative.notifyAppReady({ bundleId });
    // Oldarch returns JSON string, newarch returns array
    if (typeof result === "string") {
        try {
            return JSON.parse(result);
        } catch {
            return { status: "STABLE" };
        }
    }
    return result;
};

/**
 * Gets the list of bundle IDs that have been marked as crashed.
 * These bundles will be rejected if attempted to install again.
 *
 * @returns {string[]} Array of crashed bundle IDs
 */
export const getCrashHistory = (): string[] => {
    const result = IpayCodePushNative.getCrashHistory();
    // Oldarch returns JSON string, newarch returns array
    if (typeof result === "string") {
        try {
            return JSON.parse(result);
        } catch {
            return [];
        }
    }
    return result;
};

/**
 * Clears the crashed bundle history, allowing previously crashed bundles
 * to be installed again.
 *
 * @returns {boolean} true if clearing was successful
 */
export const clearCrashHistory = (): boolean => {
    return IpayCodePushNative.clearCrashHistory();
};

/**
 * Gets the base URL for the current active bundle directory.
 * Returns the file:// URL to the bundle directory without trailing slash.
 * This is used for Expo DOM components to construct full asset paths.
 *
 * @returns {string | null} Base URL string (e.g., "file:///data/.../bundle-store/abc123") or null if not available
 */
export const getBaseURL = (): string | null => {
    const result = IpayCodePushNative.getBaseURL();
    if (typeof result === "string" && result !== "") {
        return result;
    }
    return null;
};