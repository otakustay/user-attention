import hasPassiveEvent from 'has-passive-events';

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

const eventOptions = hasPassiveEvent ? {passive: true, capture: true} : true;

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
    document.documentElement.addEventListener('mousemove', toActiveWhenNotInactive, eventOptions);
    document.documentElement.addEventListener('keydown', toActive, eventOptions);
    document.documentElement.addEventListener('mousedown', toActive, eventOptions);
    document.documentElement.addEventListener('resize', toActive, eventOptions);
    document.documentElement.addEventListener('touchstart', toActive, eventOptions);
    document.documentElement.addEventListener('scroll', toActive, eventOptions);
    document.body.addEventListener('scroll', toActive, eventOptions);
    window.addEventListener('focus', toActive, eventOptions);
    window.addEventListener('blur', toInactive, eventOptions);
    document.addEventListener('visibilitychange', handleVisibilityChange, eventOptions);

    return {
        subscribe,
        getState() {
            return state.current;
        },
        getLastActionAt() {
            return lastActionAt.current;
        },
        dispose() {
            document.documentElement.removeEventListener('mousemove', toActive, eventOptions);
            document.documentElement.removeEventListener('keydown', toActive, eventOptions);
            document.documentElement.removeEventListener('mousedown', toActive, eventOptions);
            document.documentElement.removeEventListener('resize', toActive, eventOptions);
            document.documentElement.removeEventListener('touchstart', toActive, eventOptions);
            document.documentElement.removeEventListener('scroll', toActive, eventOptions);
            document.body.removeEventListener('scroll', toActive, eventOptions);
            window.removeEventListener('focus', toActive, eventOptions);
            window.removeEventListener('blur', toInactive, eventOptions);
            document.removeEventListener('visibilitychange', handleVisibilityChange, eventOptions);
            clearTimeout(timer.current);
        },
    };
};
