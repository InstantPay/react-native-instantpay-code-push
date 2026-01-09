import useSyncExternalStoreExports from "use-sync-external-store/shim/with-selector";

export type IpayCodePushState = {
    progress: number;
    isUpdateDownloaded: boolean;
};

const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports;

const createIpayCodePushStore = () => {

    let state: IpayCodePushState = {
        progress: 0,
        isUpdateDownloaded: false,
    };

    const getSnapshot = () => {
        return state;
    };

    const listeners = new Set<() => void>();

    const emitChange = () => {
        for (const listener of listeners) {
            listener();
        }
    };

    const setState = (newState: Partial<IpayCodePushState>) => {
        // Merge first, then normalize derived fields
        const nextState: IpayCodePushState = {
            ...state,
            ...newState,
        };

        // Derive `isUpdateDownloaded` from `progress` if provided.
        // If `progress` is not provided but `isUpdateDownloaded` is,
        // honor the explicit value.
        if ("progress" in newState && typeof newState.progress === "number") {
            nextState.isUpdateDownloaded = newState.progress >= 1;
        } else if ("isUpdateDownloaded" in newState && typeof newState.isUpdateDownloaded === "boolean") {
            nextState.isUpdateDownloaded = newState.isUpdateDownloaded;
        }

        state = nextState;
        emitChange();
    };

    const subscribe = (listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };

    return { getSnapshot, setState, subscribe };
};

export const ipayCodePushStore = createIpayCodePushStore();

export const useIpayCodePushStore = <T = IpayCodePushState>(
    selector: (snapshot: IpayCodePushState) => T = (snapshot) => snapshot as T,
) => {
    return useSyncExternalStoreWithSelector(
        ipayCodePushStore.subscribe,
        ipayCodePushStore.getSnapshot,
        ipayCodePushStore.getSnapshot,
        selector,
    );
};

