import type { AppUpdateInfo } from "./types";
import { fetchUpdateInfo } from "./fetchUpdateInfo";
import type { IpayCodePushResolver, ResolverCheckUpdateParams } from "./types";

/**
 * Creates a default resolver that uses baseURL for network operations.
 * This encapsulates the existing baseURL logic into a resolver.
 *
 * @param baseURL - The base URL for the update server
 * @returns A HotUpdaterResolver that uses the baseURL
 */
export function createDefaultResolver(baseURL: string): IpayCodePushResolver {
    return {
        checkUpdate: async (
            params: ResolverCheckUpdateParams,
        ): Promise<AppUpdateInfo | null> => {
            // Build URL based on strategy (existing buildUpdateUrl logic)
            let url: string;

            let payloadData = {
                platform : (params.platform).toUpperCase(),
                channel : (params.channel).toUpperCase(),
                minBundleId : params.minBundleId,
                bundleId : params.bundleId,
                actionType : '',
                actionValue : '',
            }

            if (params.updateStrategy === "fingerprint") {
                if (!params.fingerprintHash) {
                    throw new Error("Fingerprint hash is required");
                }
                url = `${baseURL}`;
                payloadData['actionType'] = 'FINGERPRINT';
                payloadData['actionValue'] = params.fingerprintHash;
            } else {
                url = `${baseURL}`;
                payloadData['actionType'] = 'APP_VERSION';
                payloadData['actionValue'] = params.appVersion;
            }

            // Use existing fetchUpdateInfo
            return fetchUpdateInfo({
                url,
                requestHeaders: params.requestHeaders,
                requestTimeout: params.requestTimeout,
                payload : payloadData,
            });
        },
    };
}