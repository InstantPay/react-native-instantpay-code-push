import { NativeEventEmitter } from "react-native";
import { HotUpdaterErrorCode, isHotUpdaterError } from "./error";
/* import HotUpdaterNative, {
  type UpdateBundleParams,
} from "./specs/NativeHotUpdater"; */


export { HotUpdaterErrorCode, isHotUpdaterError };

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

declare const __HOT_UPDATER_BUNDLE_ID: string | undefined;

export const HotUpdaterConstants = {
    HOT_UPDATER_BUNDLE_ID: __HOT_UPDATER_BUNDLE_ID || NIL_UUID,
};

export type HotUpdaterEvent = {
    onProgress: {
        progress: number;
    };
};


export const addListener = <T extends keyof HotUpdaterEvent>(
    eventName: T,
    listener: (event: HotUpdaterEvent[T]) => void,
) => {
    /* const eventEmitter = new NativeEventEmitter(HotUpdaterNative);
    const subscription = eventEmitter.addListener(eventName, listener);

    return () => {
        subscription.remove();
    }; */
};

//UpdateBundleParams &
export type UpdateParams =  {
    status: null// UpdateStatus;
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
    return true
}

/**
 * Fetches the current app version.
 */
export const getAppVersion = (): string | null => {
    //const constants = HotUpdaterNative.getConstants();
    const constants = { APP_VERSION : '0' }; //duplicate-original1
    return constants?.APP_VERSION ?? null;
};

/**
 * Reloads the app.
 */
export const reload = async () => {
    //await HotUpdaterNative.reload();
    await null
};

/**
 * Fetches the minimum bundle id, which represents the initial bundle of the app
 * since it is created at build time.
 *
 * @returns {string} Resolves with the minimum bundle id or null if not available.
 */
export const getMinBundleId = (): string => {
    //const constants = HotUpdaterNative.getConstants(); //original1
    const constants = { MIN_BUNDLE_ID : '0' }; //duplicate-original1
    return constants.MIN_BUNDLE_ID;
};

/**
 * Fetches the current bundle version id.
 *
 * @async
 * @returns {string} Resolves with the current version id or null if not available.
 */
export const getBundleId = (): string => {
  return HotUpdaterConstants.HOT_UPDATER_BUNDLE_ID === NIL_UUID
    ? getMinBundleId()
    : HotUpdaterConstants.HOT_UPDATER_BUNDLE_ID;
};

/**
 * Fetches the channel for the app.
 *
 * @returns {string} Resolves with the channel or null if not available.
 */
export const getChannel = (): string => {
    //const constants = HotUpdaterNative.getConstants();
    const constants = { CHANNEL : '0' }; //duplicate-original1
    return constants.CHANNEL;
};

/**
 * Fetches the fingerprint for the app.
 *
 * @returns {string | null} Resolves with the fingerprint hash
 */
export const getFingerprintHash = (): string | null => {
    //const constants = HotUpdaterNative.getConstants();
    const constants = { FINGERPRINT_HASH : '######' }; //duplicate-original1
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
 * const result = HotUpdater.notifyAppReady();
 *
 * switch (result.status) {
 *   case "PROMOTED":
 *     // Send ACTIVE analytics event
 *     analytics.track('bundle_active', { bundleId: HotUpdater.getBundleId() });
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
    //const result = HotUpdaterNative.notifyAppReady({ bundleId }); //Origin1
    const result = ''; //Origin1-copy

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