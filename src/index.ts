export interface Options {
    readonly maxIdleTime?: number;
}

export type AttentionState = 'active' | 'inactive' | 'unknown';

interface Mutable<T> {
    current: T;
}

export interface AttentionContext {
    subscribe(callback: () => void): () => void;
    dispose(): void;
    getState(): AttentionState;
    getLastActionAt(): number;
}

interface Subscription {
    subscribe: AttentionContext['subscribe'];
    trigger(): void;
}

const createSubscription = (): Subscription => {
    const listeners = new Set<() => void>();
    return {
        subscribe(callback) {
            listeners.add(callback);
            return () => {
                listeners.delete(callback);
            };
        },
        trigger() {
            for (const callback of listeners) {
                callback();
            }
        },
    };
};

export const create = (options: Options = {}): AttentionContext => {
    const {maxIdleTime = 1000 * 30} = options;
    const timer: Mutable<number> = {current: -1};
    const state: Mutable<AttentionState> = {current: 'active'};
    const lastActionAt: Mutable<number> = {current: Date.now()};
    const {subscribe, trigger} = createSubscription();

    const updateState = (newState: AttentionState) => {
        const previousState = state.current;
        state.current = newState;
        window.clearTimeout(timer.current);

        if (newState === 'active') {
            lastActionAt.current = Date.now();
            timer.current = window.setTimeout(() => updateState('unknown'), maxIdleTime);
        }

        if (newState !== previousState) {
            trigger();
        }
    };

    const toActive = () => updateState('active');
    const toActiveWhenNotInactive = () => {
        if (state.current !== 'inactive') {
            updateState('active');
        }
    };
    const toInactive = () => updateState('inactive');
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            toActive();
        }
        else {
            toInactive();
        }
    };
    document.documentElement.addEventListener('mousemove', toActiveWhenNotInactive);
    document.documentElement.addEventListener('keydown', toActive);
    document.documentElement.addEventListener('mousedown', toActive);
    document.documentElement.addEventListener('resize', toActive);
    document.documentElement.addEventListener('touchstart', toActive);
    document.documentElement.addEventListener('scroll', toActive);
    document.body.addEventListener('scroll', toActive);
    window.addEventListener('focus', toActive);
    window.addEventListener('blur', toInactive);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return {
        subscribe,
        getState() {
            return state.current;
        },
        getLastActionAt() {
            return lastActionAt.current;
        },
        dispose() {
            document.documentElement.removeEventListener('mousemove', toActive);
            document.documentElement.removeEventListener('keydown', toActive);
            document.documentElement.removeEventListener('mousedown', toActive);
            document.documentElement.removeEventListener('resize', toActive);
            document.documentElement.removeEventListener('touchstart', toActive);
            document.documentElement.removeEventListener('scroll', toActive);
            document.body.removeEventListener('scroll', toActive);
            window.removeEventListener('focus', toActive);
            window.removeEventListener('blur', toInactive);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearTimeout(timer.current);
        },
    };
};
