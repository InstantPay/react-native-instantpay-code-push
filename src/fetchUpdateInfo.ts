import type { AppUpdateInfo } from "./types";

export const fetchUpdateInfo = async ({
    url,
    requestHeaders,
    onError,
    requestTimeout = 5000,
    payload
}: {
    url: string;
    requestHeaders?: Record<string, string>;
    onError?: (error: Error) => void;
    requestTimeout?: number;
    payload: Record<string, string>;
}): Promise<AppUpdateInfo | null> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, requestTimeout);

        const headers = {
            "Content-Type": "application/json",
            ...requestHeaders,
        };

        const response = await fetch(url, {
            signal: controller.signal,
            headers,
            method: "POST",
            body : JSON.stringify(payload)
        });

        clearTimeout(timeoutId);

        if (response.status !== 200) {
            throw new Error(response.statusText);
        }

        let outputBundle:any = await response.json();

        if(outputBundle.statuscode == 'TXN'){
            return outputBundle.data;
        }   
        else{
            return null;
        }

    } catch (error: unknown) {

        if (error instanceof Error && error.name === "AbortError") {
            onError?.(new Error("Request timed out"));
        } else {
            onError?.(error as Error);
        }

        return null;
    }
};