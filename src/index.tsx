import {
    type CheckForUpdateOptions,
    checkForUpdate,
    type InternalCheckForUpdateOptions,
} from "./checkForUpdate";

import { createDefaultResolver } from './DefaultResolver';

import {
    addListener,
    clearCrashHistory,
    getAppVersion,
    getBaseURL,
    getBundleId,
    getChannel,
    getCrashHistory,
    getFingerprintHash,
    getMinBundleId,
    reload,
    type UpdateParams,
    updateBundle,
} from "./native";

import { ipayCodePushStore } from "./store";

import type { IpayCodePushResolver } from "./types";

import { type IpayCodePushOptions, type InternalWrapOptions, wrap } from "./wrap";

export type { IpayCodePushEvent, NotifyAppReadyResult } from "./native";

export * from "./store";

export {
    extractSignatureFailure,
    type IpayCodePushResolver,
    isSignatureVerificationError,
    type ResolverCheckUpdateParams,
    type ResolverNotifyAppReadyParams,
    type SignatureVerificationFailure,
} from "./types";

export type { IpayCodePushOptions, RunUpdateProcessResponse } from "./wrap";

addListener("onProgress", ({ progress }) => {
    ipayCodePushStore.setState({
        progress,
    });
});

/**
 * Register getBaseURL to global objects for use without imports.
 * This is needed for Expo DOM components and Babel plugin generated code.
 */
const registerGlobalGetBaseURL = () => {
    const fn = getBaseURL;

    // Register to globalThis (modern, cross-platform)
    /* if (typeof globalThis !== "undefined") {

        if (!globalThis.IpayCodePushGetBaseURL) {
            globalThis.IpayCodePushGetBaseURL = fn;
        }
    }

    // Register to global (React Native, Node.js)
    if (typeof global !== "undefined") {
        if (!global.IpayCodePushGetBaseURL) {
            global.IpayCodePushGetBaseURL = fn;
        }
    } */
};

// Call registration immediately on module load
registerGlobalGetBaseURL();


/**
 * Creates a IpayCodePush client instance with all update management methods.
 * This function is called once on module initialization to create a singleton instance.
 */

function createIpayCodePushClient() {
    
    // Global configuration stored from wrap
    const globalConfig: {
        resolver: IpayCodePushResolver | null;
        requestHeaders?: Record<string, string>;
        requestTimeout?: number;
    } = {
        resolver: null,
    };

    const ensureGlobalResolver = (methodName: string) => {
        if (!globalConfig.resolver) {
            throw new Error(
                `[IpayCodePush] ${methodName} requires IpayCodePush.wrap() to be used.\n\n` +
                `To fix this issue, wrap your root component with IpayCodePush.wrap():\n\n` +
                `Option 1: With automatic updates\n` +
                `  export default IpayCodePush.wrap({\n` +
                `    baseURL: "<your-update-server-url>",\n` +
                `    updateStrategy: "appVersion",\n` +
                `    updateMode: "auto"\n` +
                `  })(App);\n\n` +
                `Option 2: Manual updates only (custom flow)\n` +
                `  export default IpayCodePush.wrap({\n` +
                `    baseURL: "<your-update-server-url>",\n` +
                `    updateMode: "manual"\n` +
                `  })(App);\n\n`
            );
        }
        return globalConfig.resolver;
    };

    return {
        /**
         * `IpayCodePush.wrap` checks for updates at the entry point, and if there is a bundle to update, it downloads the bundle and applies the update strategy.
         *
         * @param {object} options - Configuration options
         * @param {string} options.source - Update server URL
         * @param {object} [options.requestHeaders] - Request headers
         * @param {React.ComponentType} [options.fallbackComponent] - Component to display during updates
         * @param {boolean} [options.reloadOnForceUpdate=true] - Whether to automatically reload the app on force updates
         * @param {Function} [options.onUpdateProcessCompleted] - Callback after update process completes
         * @param {Function} [options.onProgress] - Callback to track bundle download progress
         * @returns {Function} Higher-order component that wraps the app component
         *
         * @example
         * ```tsx
         * export default IpayCodePush.wrap({
         *   baseURL: "<your-update-server-url>",
         *   updateStrategy: "appVersion", //"appVersion" | "fingerprint"
         *   updateMode: "auto",
         *   requestHeaders: {
         *     "Authorization": "Bearer <your-access-token>",
         *   },
         * })(App);
         * ```
         */
        wrap: (options: IpayCodePushOptions) => {
            let normalizedOptions: InternalWrapOptions;

            if ("baseURL" in options && options.baseURL) {
                const { baseURL, ...rest } = options;
                normalizedOptions = {
                    ...rest,
                    resolver: createDefaultResolver(baseURL),
                };
            } else if ("resolver" in options && options.resolver) {
                normalizedOptions = options;
            } else {
                throw new Error(
                `[IpayCodePush] Either baseURL or resolver must be provided.\n\n` +
                    `Option 1: Using baseURL (recommended for most cases)\n` +
                    `  export default IpayCodePush.wrap({\n` +
                    `    baseURL: "<your-update-server-url>",\n` +
                    `    updateStrategy: "appVersion",\n` +
                    `    updateMode: "auto"\n` +
                    `  })(App);\n\n` +
                    `Option 2: Using custom resolver (advanced)\n` +
                    `  export default IpayCodePush.wrap({\n` +
                    `    resolver: {\n` +
                    `      checkUpdate: async (params) => { /* custom logic */ },\n` +
                    `      notifyAppReady: async (params) => { /* custom logic */ }\n` +
                    `    },\n` +
                    `    updateMode: "manual"\n` +
                    `  })(App);\n\n`,
                );
            }

            globalConfig.resolver = normalizedOptions.resolver;
            globalConfig.requestHeaders = options.requestHeaders;
            globalConfig.requestTimeout = options.requestTimeout;

            return wrap(normalizedOptions);
        },

        /**
         * Reloads the app.
         */
        reload,

        /**
         * Returns whether an update has finished downloading in this app session.
         *
         * When it returns true, calling `IpayCodePush.reload()` (or restarting the app)
         * will apply the downloaded update bundle.
         *
         * - Derived from `progress` reaching 1.0
         * - Resets to false when a new download starts (progress < 1)
         *
         * @returns {boolean} True if a downloaded update is ready to apply
         * @example
         * ```ts
         * if (IpayCodePush.isUpdateDownloaded()) {
         *   await IpayCodePush.reload();
         * }
         * ```
         */
        isUpdateDownloaded: () => ipayCodePushStore.getSnapshot().isUpdateDownloaded,

        /**
         * Fetches the current app version.
         */
        getAppVersion,

        /**
         * Fetches the current bundle ID of the app.
         */
        getBundleId,

        /**
         * Retrieves the initial bundle ID based on the build time of the native app.
         */
        getMinBundleId,

        /**
         * Fetches the current channel of the app.
         *
         * If no channel is specified, the app is assigned to the 'production' channel.
         *
         * @returns {string} The current release channel of the app
         * @default "production"
         * @example
         * ```ts
         * const channel = IpayCodePush.getChannel();
         * console.log(`Current channel: ${channel}`);
         * ```
         */
        getChannel,

        /**
         * Adds a listener to IpayCodePush events.
         *
         * @param {keyof IpayCodePushEvent} eventName - The name of the event to listen for
         * @param {(event: IpayCodePushEvent[T]) => void} listener - The callback function to handle the event
         * @returns {() => void} A cleanup function that removes the event listener
         *
         * @example
         * ```ts
         * const unsubscribe = IpayCodePush.addListener("onProgress", ({ progress }) => {
         *   console.log(`Update progress: ${progress * 100}%`);
         * });
         *
         * // Unsubscribe when no longer needed
         * unsubscribe();
         * ```
         */
        addListener,

        /**
         * Manually checks for updates.
         *
         * @param {Object} config - Update check configuration
         * @param {string} config.source - Update server URL
         * @param {Record<string, string>} [config.requestHeaders] - Request headers
         *
         * @returns {Promise<UpdateInfo | null>} Update information or null if up to date
         *
         * @example
         * ```ts
         * const updateInfo = await IpayCodePush.checkForUpdate({
         *   source: "<your-update-server-url>",
         *   requestHeaders: {
         *     Authorization: "Bearer <your-access-token>",
         *   },
         * });
         *
         * if (!updateInfo) {
         *   console.log("App is up to date");
         *   return;
         * }
         *
         * await IpayCodePush.updateBundle(updateInfo.id, updateInfo.fileUrl);
         * if (updateInfo.shouldForceUpdate) {
         *   await HotUpdater.reload();
         * }
         * ```
         */
        checkForUpdate: (config: CheckForUpdateOptions) => {
            const resolver = ensureGlobalResolver("checkForUpdate");

            const mergedConfig: InternalCheckForUpdateOptions = {
                ...config,
                resolver,
                requestHeaders: {
                ...globalConfig.requestHeaders,
                ...config.requestHeaders,
                },
                requestTimeout: config.requestTimeout ?? globalConfig.requestTimeout,
            };

            return checkForUpdate(mergedConfig);
        },

        /**
         * Updates the bundle of the app.
         *
         * @param {UpdateBundleParams} params - Parameters object required for bundle update
         * @param {string} params.bundleId - The bundle ID of the app
         * @param {string|null} params.fileUrl - The URL of the zip file
         *
         * @returns {Promise<boolean>} Whether the update was successful
         *
         * @example
         * ```ts
         * const updateInfo = await IpayCodePush.checkForUpdate({
         *   source: "<your-update-server-url>",
         *   requestHeaders: {
         *     Authorization: "Bearer <your-access-token>",
         *   },
         * });
         *
         * if (!updateInfo) {
         *   return {
         *     status: "UP_TO_DATE",
         *   };
         * }
         *
         * await IpayCodePush.updateBundle({
         *   bundleId: updateInfo.id,
         *   fileUrl: updateInfo.fileUrl
         * });
         * if (updateInfo.shouldForceUpdate) {
         *   await HotUpdater.reload();
         * }
         * ```
         */
        updateBundle: (params: UpdateParams) => {
            ensureGlobalResolver("updateBundle");
            return updateBundle(params);
        },

        /**
         * Fetches the fingerprint of the app.
         *
         * @returns {string} The fingerprint of the app
         *
         * @example
         * ```ts
         * const fingerprint = IpayCodePush.getFingerprintHash();
         * console.log(`Fingerprint: ${fingerprint}`);
         * ```
         */
        getFingerprintHash,

        /**
         * Gets the list of bundle IDs that have been marked as crashed.
         * These bundles will be rejected if attempted to install again.
         *
         * @returns {string[]} Array of crashed bundle IDs
         *
         * @example
         * ```ts
         * const crashedBundles = IpayCodePush.getCrashHistory();
         * console.log("Crashed bundles:", crashedBundles);
         * ```
         */
        getCrashHistory,

        /**
         * Clears the crashed bundle history, allowing previously crashed bundles
         * to be installed again.
         *
         * @returns {boolean} true if clearing was successful
         *
         * @example
         * ```ts
         * // Clear crash history to allow retrying a previously failed bundle
         * IpayCodePush.clearCrashHistory();
         * ```
         */
        clearCrashHistory,
    };
}

export const IpayCodePush = createIpayCodePushClient();


