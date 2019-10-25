# user-attention

A simple library to detect user's attention on page.

We don't introduce any intelligent solution, just a deadly simple detection that:

- When user continuously interact with document (mouse events, keyboard events, touch events, etc...), it is active.
- When document is hidden or window is blurred, it is inactive.
- When user idles for a certain time, it is a "unknown" state.

In the future we may improve this algorithm by detecting more evidences like playing `<video>` tags.

## API

We expose a single `create` function:

```typescript
const create = (options: Options) => AttentionContext;

type AttentionState = 'active' | 'inactive' | 'unknown';

interface AttentionContext {
    subscribe(callback: () => void): () => void;
    dispose(): void;
    getState(): AttentionState;
    getLastActionAt(): number;
}

interface Options {
    readonly maxIdleTime?: number;
}
```

By `subscribe` we can listen to change of user attention state, `getState` and `getLastActionAt` will provide current attention states.

```javascript
const attention = create();

attention.subscribe(() => {
    console.log(`Currently user is ${attention.getState()}`);
});
```
